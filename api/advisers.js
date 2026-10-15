import supabase from './db-client.js';
import { cors, getUser, requireAdmin, readConfig, writeConfig } from './_lib.js';

// In-memory / storage fallback state to guarantee zero downtime and smooth testability
const FALLBACK_FILE = 'advisers_state.json';

async function getAppState() {
  const defaultState = {
    advisers: [],
    policies: {
      registration_reward: {
        version: 1,
        is_active: true,
        registration_fee: 1100,
        tiers: { '1': 300, '2': 200, '3': 100 },
        default_higher_level_reward: 100,
        max_eligible_levels: 10,
        max_total_reward_cap: 1100,
        require_approval: true,
        is_enabled: true,
      },
      property_commission: {
        version: 1,
        is_active: true,
        commission_base: 'company_brokerage', // 'total_price' | 'company_brokerage' | 'fixed_amount'
        default_brokerage_percent: 2.0,
        seller_rate_percent: 10.0,
        upline_rates_percent: { '1': 5.0, '2': 4.0, '3': 3.0, '4': 2.0, '5': 1.0 },
        default_higher_upline_rate_percent: 1.0,
        max_eligible_levels: 10,
        max_total_commission_cap_percent: 30.0,
        require_approval: true,
        is_enabled: true,
      },
    },
    registration_rewards: [],
    property_leads: [],
    property_sales: [],
    property_commissions: [],
    payout_requests: [],
    audit_logs: [],
  };

  const state = await readConfig(FALLBACK_FILE, null);
  return state || defaultState;
}

async function saveAppState(state) {
  try {
    await writeConfig(FALLBACK_FILE, state);
  } catch (err) {
    console.warn('saveAppState warning:', err.message);
  }
}

// Log audit trail
async function logAudit(action, entityType, entityId, performedBy, details = {}) {
  const entry = {
    id: Date.now() + Math.random().toString(36).substring(2, 7),
    action,
    entity_type: entityType,
    entity_id: String(entityId || ''),
    performed_by: performedBy,
    details,
    created_at: new Date().toISOString(),
  };

  try {
    await supabase.from('audit_logs').insert(entry);
  } catch {
    /* fallback to app state */
  }

  const state = await getAppState();
  state.audit_logs = [entry, ...(state.audit_logs || [])].slice(0, 1000);
  await saveAppState(state);
}

// Calculation engine for Registration Referral Rewards
export function calculateRegistrationRewards(newAdviser, hierarchy, policy) {
  if (!policy || !policy.is_enabled) return [];
  const rewards = [];
  const maxLevels = Number(policy.max_eligible_levels) || 10;
  const maxCap = Number(policy.max_total_reward_cap) || policy.registration_fee || 1100;
  let totalDistributed = 0;

  // Traverse upline hierarchy (Level 1, 2, 3...)
  for (let i = 0; i < hierarchy.length && i < maxLevels; i++) {
    const upline = hierarchy[i];
    const level = i + 1;

    let rewardAmount = 0;
    if (policy.tiers && policy.tiers[String(level)] !== undefined) {
      rewardAmount = Number(policy.tiers[String(level)]);
    } else {
      rewardAmount = Number(policy.default_higher_level_reward || 100);
    }

    // Check cap
    if (totalDistributed + rewardAmount > maxCap) {
      rewardAmount = Math.max(0, maxCap - totalDistributed);
    }

    if (rewardAmount <= 0) break;

    const isBeneficiaryEligible = upline.status === 'active';
    const status = !isBeneficiaryEligible ? 'held_suspended' : policy.require_approval ? 'pending' : 'approved';

    const idempotencyKey = `reg_rew_${newAdviser.adviser_id}_lvl_${level}_${upline.adviser_id}_v${policy.version}`;

    rewards.push({
      registration_event_id: `REG-${newAdviser.adviser_id}`,
      new_adviser_id: newAdviser.adviser_id,
      beneficiary_adviser_id: upline.adviser_id,
      beneficiary_name: upline.full_name,
      beneficiary_email: upline.email,
      level,
      amount: rewardAmount,
      policy_version: policy.version,
      status,
      idempotency_key: idempotencyKey,
      created_at: new Date().toISOString(),
    });

    totalDistributed += rewardAmount;
    if (totalDistributed >= maxCap) break;
  }

  return rewards;
}

// Calculation engine for Property-Sale Commissions
export function calculatePropertyCommissions(sale, seller, hierarchy, policy) {
  if (!policy || !policy.is_enabled) return [];
  const commissions = [];

  // Determine commission base
  let baseAmount = 0;
  const salePrice = Number(sale.sale_price) || 0;
  const brokerageReceived = Number(sale.company_brokerage_received) || (salePrice * (Number(policy.default_brokerage_percent) || 2)) / 100;

  if (policy.commission_base === 'total_price') {
    baseAmount = salePrice;
  } else if (policy.commission_base === 'company_brokerage') {
    baseAmount = brokerageReceived;
  } else if (policy.commission_base === 'fixed_amount') {
    baseAmount = Number(sale.fixed_commission_amount || 0);
  } else {
    baseAmount = brokerageReceived;
  }

  const maxCapPercent = Number(policy.max_total_commission_cap_percent) || 30.0;
  const maxLevels = Number(policy.max_eligible_levels) || 10;
  let totalPercentUsed = 0;

  // 1. Seller commission (Level 0)
  const sellerRate = Number(policy.seller_rate_percent) || 10.0;
  let effectiveSellerRate = sellerRate;
  if (totalPercentUsed + effectiveSellerRate > maxCapPercent) {
    effectiveSellerRate = Math.max(0, maxCapPercent - totalPercentUsed);
  }

  if (effectiveSellerRate > 0) {
    const sellerAmount = Math.round(((baseAmount * effectiveSellerRate) / 100) * 100) / 100;
    commissions.push({
      sale_id: sale.id,
      property_title: sale.property_title,
      beneficiary_adviser_id: seller.adviser_id,
      beneficiary_name: seller.full_name,
      beneficiary_email: seller.email,
      role_in_sale: 'seller',
      level: 0,
      rate_percent: effectiveSellerRate,
      commission_base_amount: baseAmount,
      amount: sellerAmount,
      policy_version: policy.version,
      status: policy.require_approval ? 'pending' : 'approved',
      idempotency_key: `comm_sale_${sale.id}_seller_${seller.adviser_id}_v${policy.version}`,
      created_at: new Date().toISOString(),
    });
    totalPercentUsed += effectiveSellerRate;
  }

  // 2. Uplines commissions (Level 1 to maxLevels)
  for (let i = 0; i < hierarchy.length && i < maxLevels; i++) {
    const upline = hierarchy[i];
    const level = i + 1;

    let rate = 0;
    if (policy.upline_rates_percent && policy.upline_rates_percent[String(level)] !== undefined) {
      rate = Number(policy.upline_rates_percent[String(level)]);
    } else {
      rate = Number(policy.default_higher_upline_rate_percent || 1.0);
    }

    if (totalPercentUsed + rate > maxCapPercent) {
      rate = Math.max(0, maxCapPercent - totalPercentUsed);
    }

    if (rate <= 0) break;

    const uplineAmount = Math.round(((baseAmount * rate) / 100) * 100) / 100;
    const isEligible = upline.status === 'active';

    commissions.push({
      sale_id: sale.id,
      property_title: sale.property_title,
      beneficiary_adviser_id: upline.adviser_id,
      beneficiary_name: upline.full_name,
      beneficiary_email: upline.email,
      role_in_sale: `upline_${level}`,
      level,
      rate_percent: rate,
      commission_base_amount: baseAmount,
      amount: uplineAmount,
      policy_version: policy.version,
      status: !isEligible ? 'held_suspended' : policy.require_approval ? 'pending' : 'approved',
      idempotency_key: `comm_sale_${sale.id}_lvl_${level}_${upline.adviser_id}_v${policy.version}`,
      created_at: new Date().toISOString(),
    });

    totalPercentUsed += rate;
    if (totalPercentUsed >= maxCapPercent) break;
  }

  return commissions;
}

// Compute upline chain given an adviser and all advisers list
export function getUplineHierarchy(adviser, allAdvisers) {
  const map = new Map(allAdvisers.map((a) => [a.adviser_id, a]));
  const hierarchy = [];
  const visited = new Set([adviser.adviser_id]);

  let currentSponsorId = adviser.sponsor_id;
  while (currentSponsorId && map.has(currentSponsorId)) {
    if (visited.has(currentSponsorId)) break; // Prevent cycle
    visited.add(currentSponsorId);

    const upline = map.get(currentSponsorId);
    hierarchy.push(upline);
    currentSponsorId = upline.sponsor_id;
  }

  return hierarchy;
}

// Compute downline team statistics and tree
export function getDownlineStats(rootAdviserId, allAdvisers) {
  // Map parent -> children
  const childrenMap = new Map();
  for (const a of allAdvisers) {
    if (a.sponsor_id) {
      if (!childrenMap.has(a.sponsor_id)) childrenMap.set(a.sponsor_id, []);
      childrenMap.get(a.sponsor_id).push(a);
    }
  }

  let totalTeam = 0;
  const levelCounts = {};
  const visited = new Set([rootAdviserId]);

  let currentLevel = [rootAdviserId];
  let depth = 1;

  while (currentLevel.length > 0) {
    const nextLevel = [];
    for (const parentId of currentLevel) {
      const children = childrenMap.get(parentId) || [];
      for (const child of children) {
        if (!visited.has(child.adviser_id)) {
          visited.add(child.adviser_id);
          nextLevel.push(child.adviser_id);
          totalTeam++;
          levelCounts[depth] = (levelCounts[depth] || 0) + 1;
        }
      }
    }
    currentLevel = nextLevel;
    depth++;
  }

  const directCount = (childrenMap.get(rootAdviserId) || []).length;
  return { directCount, totalTeam, levelCounts };
}

// Build nested referral tree for visualization
export function buildReferralTree(rootAdviser, allAdvisers, maxDepth = 100) {
  const childrenMap = new Map();
  for (const a of allAdvisers) {
    if (a.sponsor_id) {
      if (!childrenMap.has(a.sponsor_id)) childrenMap.set(a.sponsor_id, []);
      childrenMap.get(a.sponsor_id).push(a);
    }
  }

  function traverse(node, currentDepth) {
    const children = currentDepth < maxDepth ? childrenMap.get(node.adviser_id) || [] : [];
    return {
      adviser_id: node.adviser_id,
      full_name: node.full_name,
      email: node.email,
      status: node.status,
      depth_level: currentDepth,
      created_at: node.created_at,
      children: children.map((child) => traverse(child, currentDepth + 1)),
    };
  }

  return traverse(rootAdviser, 0);
}

// ---------------- MAIN HANDLER ---------------- //
export default async function handler(req, res) {
  if (cors(req, res)) return;

  try {
    const state = await getAppState();
    const action = req.query.action || (req.body && req.body.action);

    // 1. PUBLIC: Get sponsor details by referral code / ID
    if (action === 'get_sponsor') {
      const code = String(req.query.code || '').trim().toUpperCase();
      if (!code) return res.status(400).json({ error: 'Referral code is required.' });

      // Look up in DB or fallback
      let sponsor = null;
      try {
        const { data } = await supabase
          .from('advisers')
          .select('adviser_id, referral_code, full_name, status')
          .or(`referral_code.ilike.${code},adviser_id.ilike.${code}`)
          .maybeSingle();
        if (data) sponsor = data;
      } catch {
        /* fallback */
      }

      if (!sponsor) {
        sponsor = state.advisers.find(
          (a) => a.referral_code.toUpperCase() === code || a.adviser_id.toUpperCase() === code
        );
      }

      if (!sponsor) {
        return res.status(404).json({ error: 'Invalid or unknown referral code.' });
      }

      return res.status(200).json({
        ok: true,
        sponsor: {
          adviser_id: sponsor.adviser_id,
          referral_code: sponsor.referral_code,
          full_name: sponsor.full_name,
          status: sponsor.status,
          isActive: sponsor.status === 'active',
        },
      });
    }

    // 2. AUTHENTICATED: Register as an Adviser
    if (action === 'register') {
      const userRes = await getUser(req);
      if (userRes.error) return res.status(userRes.code || 401).json({ error: userRes.error });
      const authUser = userRes.user;

      const body = req.body || {};
      const fullName = String(body.full_name || authUser.name || '').trim();
      const phone = String(body.phone || '').trim();
      const email = (authUser.email || body.email || '').trim().toLowerCase();
      const sponsorCode = String(body.sponsor_code || '').trim().toUpperCase();
      const bankDetails = body.bank_details || {};

      if (!fullName || fullName.length < 2) return res.status(400).json({ error: 'Please enter your full name.' });
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 13) return res.status(400).json({ error: 'Please enter a valid 10-12 digit phone number.' });

      // Check for existing adviser account (anti-duplicate)
      const existingInState = state.advisers.find((a) => a.email.toLowerCase() === email || a.user_id === authUser.id);
      if (existingInState) {
        return res.status(400).json({ error: 'An adviser account already exists for this email.' });
      }

      // Validate Sponsor
      let sponsor = null;
      if (sponsorCode) {
        // Prevent self-referral
        if (sponsorCode === email.toUpperCase()) {
          return res.status(400).json({ error: 'Self-referral is not permitted.' });
        }

        sponsor = state.advisers.find(
          (a) => a.referral_code.toUpperCase() === sponsorCode || a.adviser_id.toUpperCase() === sponsorCode
        );

        if (!sponsor) {
          try {
            const { data } = await supabase
              .from('advisers')
              .select('*')
              .or(`referral_code.ilike.${sponsorCode},adviser_id.ilike.${sponsorCode}`)
              .maybeSingle();
            if (data) sponsor = data;
          } catch {
            /* ignore */
          }
        }

        if (!sponsor) {
          return res.status(400).json({ error: 'Specified sponsor referral code is invalid or does not exist.' });
        }
      }

      // Generate unique IDs
      const nextSeq = (state.advisers.length + 1001).toString();
      const adviserId = `IST-ADV-${nextSeq}`;
      const referralCode = `ADV${nextSeq}`;
      const depthLevel = sponsor ? (sponsor.depth_level || 1) + 1 : 1;
      const sponsorChain = sponsor ? [sponsor.adviser_id, ...(sponsor.sponsor_chain || [])] : [];

      // Check anti-circular hierarchy
      if (sponsor && sponsorChain.includes(adviserId)) {
        return res.status(400).json({ error: 'Circular sponsor hierarchy detected.' });
      }

      const activePolicy = state.policies.registration_reward;
      const registrationFee = activePolicy?.registration_fee || 1100.0;

      const newAdviser = {
        id: Date.now(),
        user_id: authUser.id,
        adviser_id: adviserId,
        referral_code: referralCode,
        full_name: fullName,
        phone,
        email,
        sponsor_id: sponsor ? sponsor.adviser_id : null,
        sponsor_chain: sponsorChain,
        depth_level: depthLevel,
        status: 'pending', // Starts pending until verification
        registration_fee: registrationFee,
        payment_status: 'demo_paid', // Demo registration
        payment_reference: `DEMO-PAY-${Date.now()}`,
        bank_details: bankDetails,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Persist in DB and state
      try {
        await supabase.from('advisers').insert(newAdviser);
        // Link to user profile
        await supabase.from('user_profiles').update({ is_adviser: true, adviser_id: adviserId }).eq('email', email);
      } catch {
        /* fallback handled below */
      }

      state.advisers.push(newAdviser);
      await saveAppState(state);
      await logAudit('ADVISER_REGISTERED', 'advisers', adviserId, email, { sponsor_id: newAdviser.sponsor_id });

      return res.status(201).json({
        ok: true,
        message: 'Adviser application submitted successfully. Complete payment verification to activate your account.',
        adviser: newAdviser,
      });
    }

    // 3. AUTHENTICATED: Get Adviser Dashboard Data
    if (action === 'get_dashboard') {
      const userRes = await getUser(req);
      if (userRes.error) return res.status(userRes.code || 401).json({ error: userRes.error });
      const authUser = userRes.user;

      let adviser = state.advisers.find((a) => a.email.toLowerCase() === authUser.email.toLowerCase() || a.user_id === authUser.id);
      if (!adviser) {
        try {
          const { data } = await supabase.from('advisers').select('*').eq('email', authUser.email.toLowerCase()).maybeSingle();
          if (data) adviser = data;
        } catch {
          /* ignore */
        }
      }

      if (!adviser) {
        return res.status(404).json({ error: 'No adviser account found for this user.' });
      }

      // Compute team statistics
      const { directCount, totalTeam, levelCounts } = getDownlineStats(adviser.adviser_id, state.advisers);

      // Filter ledgers for this adviser
      const myRegRewards = state.registration_rewards.filter((r) => r.beneficiary_adviser_id === adviser.adviser_id);
      const myCommissions = state.property_commissions.filter((c) => c.beneficiary_adviser_id === adviser.adviser_id);
      const myLeads = state.property_leads.filter((l) => l.adviser_id === adviser.adviser_id);
      const myPayouts = state.payout_requests.filter((p) => p.adviser_id === adviser.adviser_id);

      // Financial balance breakdown
      const sum = (arr, status) => arr.filter((x) => x.status === status).reduce((a, b) => a + (Number(b.amount) || 0), 0);

      const regRewardsSummary = {
        pending: sum(myRegRewards, 'pending'),
        approved: sum(myRegRewards, 'approved'),
        paid: sum(myRegRewards, 'paid'),
        reversed: sum(myRegRewards, 'reversed'),
        total: myRegRewards.filter((x) => x.status !== 'reversed').reduce((a, b) => a + (Number(b.amount) || 0), 0),
      };

      const commissionsSummary = {
        pending: sum(myCommissions, 'pending'),
        approved: sum(myCommissions, 'approved'),
        paid: sum(myCommissions, 'paid'),
        reversed: sum(myCommissions, 'reversed'),
        total: myCommissions.filter((x) => x.status !== 'reversed').reduce((a, b) => a + (Number(b.amount) || 0), 0),
      };

      const totalApprovedPayable = regRewardsSummary.approved + commissionsSummary.approved;
      const totalRequestedOrPaid = myPayouts
        .filter((p) => p.status !== 'rejected')
        .reduce((a, b) => a + (Number(b.amount) || 0), 0);
      const availableBalance = Math.max(0, totalApprovedPayable - totalRequestedOrPaid);

      return res.status(200).json({
        ok: true,
        adviser,
        stats: {
          directCount,
          totalTeam,
          levelCounts,
        },
        regRewardsSummary,
        commissionsSummary,
        availableBalance,
        registrationRewards: myRegRewards,
        propertyCommissions: myCommissions,
        leads: myLeads,
        payouts: myPayouts,
      });
    }

    // 4. AUTHENTICATED: Submit Property Lead
    if (action === 'submit_lead') {
      const userRes = await getUser(req);
      if (userRes.error) return res.status(userRes.code || 401).json({ error: userRes.error });

      const adviser = state.advisers.find((a) => a.email.toLowerCase() === userRes.user.email.toLowerCase());
      if (!adviser) return res.status(403).json({ error: 'Only registered advisers can submit leads.' });

      const b = req.body || {};
      const leadName = String(b.lead_name || '').trim();
      const leadPhone = String(b.lead_phone || '').trim();
      const leadEmail = String(b.lead_email || '').trim();
      const propertyType = String(b.property_type || 'properties').trim();
      const propertyTitle = String(b.property_title || '').trim();
      const notes = String(b.notes || '').trim();

      if (!leadName || leadName.length < 2) return res.status(400).json({ error: 'Lead name is required.' });
      if (!leadPhone || leadPhone.replace(/\D/g, '').length < 10) return res.status(400).json({ error: 'Valid phone number is required.' });

      const newLead = {
        id: Date.now(),
        adviser_id: adviser.adviser_id,
        lead_name: leadName,
        lead_phone: leadPhone,
        lead_email: leadEmail || null,
        property_type: propertyType,
        property_id: b.property_id || null,
        property_title: propertyTitle || 'Property Enquiry',
        notes: notes || null,
        status: 'new',
        created_at: new Date().toISOString(),
      };

      try {
        await supabase.from('property_leads').insert(newLead);
      } catch {
        /* ignore */
      }

      state.property_leads.push(newLead);
      await saveAppState(state);
      await logAudit('LEAD_SUBMITTED', 'property_leads', newLead.id, adviser.email, { property: propertyTitle });

      return res.status(201).json({ ok: true, lead: newLead });
    }

    // 5. AUTHENTICATED: Request Payout
    if (action === 'request_payout') {
      const userRes = await getUser(req);
      if (userRes.error) return res.status(userRes.code || 401).json({ error: userRes.error });

      const adviser = state.advisers.find((a) => a.email.toLowerCase() === userRes.user.email.toLowerCase());
      if (!adviser) return res.status(403).json({ error: 'Only registered advisers can request payouts.' });

      const amount = Number(req.body?.amount) || 0;
      if (amount <= 0) return res.status(400).json({ error: 'Payout amount must be greater than zero.' });

      const newPayout = {
        id: Date.now(),
        adviser_id: adviser.adviser_id,
        amount,
        reward_type: req.body?.reward_type || 'combined',
        status: 'pending',
        payment_method: req.body?.payment_method || 'bank_transfer',
        payout_details: req.body?.payout_details || adviser.bank_details || {},
        created_at: new Date().toISOString(),
      };

      state.payout_requests.push(newPayout);
      await saveAppState(state);
      await logAudit('PAYOUT_REQUESTED', 'payout_requests', newPayout.id, adviser.email, { amount });

      return res.status(201).json({ ok: true, payout: newPayout });
    }

    // ---------------- ADMIN ENDPOINTS ---------------- //
    const admin = await requireAdmin(req, res);
    if (!admin) return; // Response sent by requireAdmin

    // A1. Admin: List all advisers
    if (action === 'admin_list') {
      const q = String(req.query.q || '').trim().toLowerCase();
      const statusFilter = String(req.query.status || 'all').trim();

      let filtered = [...state.advisers];
      if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter((a) => a.status === statusFilter);
      }
      if (q) {
        filtered = filtered.filter(
          (a) =>
            a.full_name.toLowerCase().includes(q) ||
            a.email.toLowerCase().includes(q) ||
            a.adviser_id.toLowerCase().includes(q) ||
            a.referral_code.toLowerCase().includes(q)
        );
      }

      return res.status(200).json({
        ok: true,
        advisers: filtered,
        total: filtered.length,
      });
    }

    // A2. Admin: Update adviser status
    if (action === 'admin_update_status') {
      const { adviser_id, status } = req.body || {};
      const validStatuses = ['pending', 'active', 'suspended', 'rejected'];
      if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

      const adv = state.advisers.find((a) => a.adviser_id === adviser_id);
      if (!adv) return res.status(404).json({ error: 'Adviser not found.' });

      adv.status = status;
      adv.updated_at = new Date().toISOString();
      if (status === 'active' && !adv.activated_at) {
        adv.activated_at = new Date().toISOString();
      }

      try {
        await supabase.from('advisers').update({ status, activated_at: adv.activated_at, updated_at: adv.updated_at }).eq('adviser_id', adviser_id);
      } catch {
        /* ignore */
      }

      await saveAppState(state);
      await logAudit('ADVISER_STATUS_UPDATED', 'advisers', adviser_id, admin.email, { status });

      return res.status(200).json({ ok: true, adviser: adv });
    }

    // A3. Admin: Get referral tree
    if (action === 'admin_get_tree') {
      const adviserId = String(req.query.adviser_id || state.advisers[0]?.adviser_id || '');
      const root = state.advisers.find((a) => a.adviser_id === adviserId);
      if (!root) return res.status(404).json({ error: 'Root adviser not found.' });

      const maxDepth = Number(req.query.max_depth) || 100;
      const tree = buildReferralTree(root, state.advisers, maxDepth);
      const stats = getDownlineStats(root.adviser_id, state.advisers);

      return res.status(200).json({ ok: true, root: root.adviser_id, tree, stats });
    }

    // A4. Admin: Get policies & preview calculation
    if (action === 'admin_get_policies') {
      return res.status(200).json({
        ok: true,
        policies: state.policies,
      });
    }

    // A5. Admin: Update policies
    if (action === 'admin_update_policy') {
      const { policy_type, config: newConfig } = req.body || {};
      if (!policy_type || !state.policies[policy_type]) {
        return res.status(400).json({ error: 'Invalid policy type.' });
      }

      const current = state.policies[policy_type];
      const updated = {
        ...current,
        ...newConfig,
        version: (current.version || 1) + 1,
        updated_at: new Date().toISOString(),
      };
      state.policies[policy_type] = updated;

      await saveAppState(state);
      await logAudit('POLICY_UPDATED', 'adviser_policies', policy_type, admin.email, { version: updated.version });

      return res.status(200).json({ ok: true, policy: updated });
    }

    // A6. Admin: Verify Registration Payment & Distribute Rewards (idempotent)
    if (action === 'admin_verify_registration') {
      const { adviser_id } = req.body || {};
      const adv = state.advisers.find((a) => a.adviser_id === adviser_id);
      if (!adv) return res.status(404).json({ error: 'Adviser not found.' });

      // Mark payment verified and adviser active
      adv.payment_status = 'verified_paid';
      adv.status = 'active';
      adv.activated_at = new Date().toISOString();

      // Follow upline hierarchy
      const hierarchy = getUplineHierarchy(adv, state.advisers);
      const policy = state.policies.registration_reward;

      // Calculate rewards
      const generatedRewards = calculateRegistrationRewards(adv, hierarchy, policy);

      // Save to ledger with idempotency check
      const newEntries = [];
      for (const reward of generatedRewards) {
        const exists = state.registration_rewards.some((r) => r.idempotency_key === reward.idempotency_key);
        if (!exists) {
          state.registration_rewards.push(reward);
          newEntries.push(reward);
        }
      }

      await saveAppState(state);
      await logAudit('REGISTRATION_VERIFIED', 'advisers', adviser_id, admin.email, {
        rewardsDistributed: newEntries.length,
        totalAmount: newEntries.reduce((a, b) => a + b.amount, 0),
      });

      return res.status(200).json({
        ok: true,
        message: `Adviser ${adviser_id} verified. Distributed ${newEntries.length} upline rewards.`,
        rewards: newEntries,
      });
    }

    // A7. Admin: Verify Property Sale & Distribute Commissions (idempotent)
    if (action === 'admin_verify_sale') {
      const b = req.body || {};
      const sellerAdviserId = String(b.seller_adviser_id || '').trim();
      const seller = state.advisers.find((a) => a.adviser_id === sellerAdviserId);
      if (!seller) return res.status(400).json({ error: 'Seller adviser not found.' });

      const salePrice = Number(b.sale_price) || 0;
      if (salePrice <= 0) return res.status(400).json({ error: 'Sale price must be greater than zero.' });

      const saleId = Date.now();
      const newSale = {
        id: saleId,
        seller_adviser_id: seller.adviser_id,
        property_title: b.property_title || 'Iston Property',
        property_type: b.property_type || 'properties',
        buyer_name: b.buyer_name || 'Buyer',
        buyer_phone: b.buyer_phone || '',
        sale_price: salePrice,
        company_brokerage_received: Number(b.company_brokerage_received) || (salePrice * 0.02),
        fixed_commission_amount: Number(b.fixed_commission_amount) || 0,
        status: 'verified',
        verified_by: admin.email,
        verified_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      state.property_sales.push(newSale);

      // Follow upline hierarchy
      const hierarchy = getUplineHierarchy(seller, state.advisers);
      const policy = state.policies.property_commission;

      // Calculate commissions
      const generatedCommissions = calculatePropertyCommissions(newSale, seller, hierarchy, policy);

      // Save to ledger with idempotency
      const newEntries = [];
      for (const comm of generatedCommissions) {
        const exists = state.property_commissions.some((c) => c.idempotency_key === comm.idempotency_key);
        if (!exists) {
          state.property_commissions.push(comm);
          newEntries.push(comm);
        }
      }

      await saveAppState(state);
      await logAudit('PROPERTY_SALE_VERIFIED', 'property_sales', saleId, admin.email, {
        salePrice,
        commissionsGenerated: newEntries.length,
      });

      return res.status(200).json({
        ok: true,
        sale: newSale,
        commissions: newEntries,
      });
    }

    // A8. Admin: Reward / Commission Status Update or Reversal (Audit preserved)
    if (action === 'admin_update_ledger_status') {
      const { type, id, status, reason } = req.body || {};
      const targetList = type === 'commission' ? state.property_commissions : state.registration_rewards;
      const item = targetList.find((x) => x.idempotency_key === id || x.id === id);

      if (!item) return res.status(404).json({ error: 'Ledger item not found.' });

      if (status === 'reversed') {
        // Reversal creates a documented reversal record rather than destructive deletion
        item.status = 'reversed';
        item.reversed_at = new Date().toISOString();
        item.reversal_reason = reason || 'Admin reversal';
        item.reversed_by = admin.email;
      } else {
        item.status = status;
        if (status === 'approved') {
          item.approved_at = new Date().toISOString();
          item.approved_by = admin.email;
        }
        if (status === 'paid') item.paid_at = new Date().toISOString();
      }

      await saveAppState(state);
      await logAudit('LEDGER_STATUS_UPDATED', type, id, admin.email, { status, reason });

      return res.status(200).json({ ok: true, item });
    }

    // A9. Admin: Payout Request Status Update
    if (action === 'admin_update_payout_status') {
      const { payout_id, status, notes, transaction_reference } = req.body || {};
      const payout = state.payout_requests.find((p) => p.id === payout_id);
      if (!payout) return res.status(404).json({ error: 'Payout request not found.' });

      payout.status = status;
      payout.admin_notes = notes || payout.admin_notes;
      payout.transaction_reference = transaction_reference || payout.transaction_reference;
      payout.processed_by = admin.email;
      payout.processed_at = new Date().toISOString();

      await saveAppState(state);
      await logAudit('PAYOUT_STATUS_UPDATED', 'payout_requests', payout_id, admin.email, { status, transaction_reference });

      return res.status(200).json({ ok: true, payout });
    }

    // A10. Admin: Get Audit Logs & Ledgers
    if (action === 'admin_get_financials') {
      return res.status(200).json({
        ok: true,
        registrationRewards: state.registration_rewards,
        propertyCommissions: state.property_commissions,
        propertySales: state.property_sales,
        payoutRequests: state.payout_requests,
        auditLogs: state.audit_logs || [],
      });
    }

    return res.status(400).json({ error: 'Unknown action specified.' });
  } catch (err) {
    console.error('advisers API error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}
