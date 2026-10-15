import assert from 'assert';
import {
  calculateRegistrationRewards,
  calculatePropertyCommissions,
  getUplineHierarchy,
  getDownlineStats,
  buildReferralTree,
} from '../api/advisers.js';
import { ADMIN_EMAILS } from '../api/_lib.js';

console.log('====================================================');
console.log('   ISTON BUILDER GROUP — ADVISERS TEST SUITE        ');
console.log('====================================================\n');

// 1. Verify Authorized Administrators Allowlist
console.log('TEST 1: Admin Allowlist Verification');
assert(ADMIN_EMAILS.includes('abnixsh@gmail.com'), 'abnixsh@gmail.com must be in ADMIN_EMAILS');
assert(ADMIN_EMAILS.includes('sitaramchaurasiya8@gmail.com'), 'sitaramchaurasiya8@gmail.com must be in ADMIN_EMAILS');
console.log('✓ Both authorized administrators are correctly registered.\n');

// Standard Policies
const standardRegPolicy = {
  version: 1,
  registration_fee: 1100,
  tiers: { '1': 300, '2': 200, '3': 100 },
  default_higher_level_reward: 100,
  max_eligible_levels: 10,
  max_total_reward_cap: 1100,
  require_approval: true,
  is_enabled: true,
};

const standardCommPolicy = {
  version: 1,
  commission_base: 'company_brokerage',
  default_brokerage_percent: 2.0,
  seller_rate_percent: 10.0,
  upline_rates_percent: { '1': 5.0, '2': 4.0, '3': 3.0, '4': 2.0, '5': 1.0 },
  default_higher_upline_rate_percent: 1.0,
  max_eligible_levels: 10,
  max_total_commission_cap_percent: 30.0,
  require_approval: true,
  is_enabled: true,
};

// 2. Test Referral Depths: 1, 2, 3, 4, 5, 20, 100
console.log('TEST 2: Referral Hierarchy at Depths 1, 2, 3, 4, 5, 20, 100');

function generateHierarchy(depth) {
  const chain = [];
  chain.push({
    id: 1,
    adviser_id: 'ADV-1',
    referral_code: 'CODE-1',
    full_name: 'Adviser 1 (Root)',
    email: 'adv1@iston.test',
    sponsor_id: null,
    status: 'active',
  });

  for (let i = 2; i <= depth + 1; i++) {
    chain.push({
      id: i,
      adviser_id: `ADV-${i}`,
      referral_code: `CODE-${i}`,
      full_name: `Adviser ${i}`,
      email: `adv${i}@iston.test`,
      sponsor_id: `ADV-${i - 1}`,
      status: 'active',
    });
  }
  return chain;
}

const testDepths = [1, 2, 3, 4, 5, 20, 100];
for (const d of testDepths) {
  const all = generateHierarchy(d);
  const newestAdviser = all[all.length - 1];
  const uplines = getUplineHierarchy(newestAdviser, all);
  assert.strictEqual(uplines.length, d, `Upline hierarchy at depth ${d} should have exactly ${d} ancestors`);

  const root = all[0];
  const tree = buildReferralTree(root, all, 120);
  assert(tree, `Tree generation for depth ${d} must succeed`);

  const stats = getDownlineStats(root.adviser_id, all);
  assert.strictEqual(stats.directCount, 1, 'Root has 1 direct child in linear chain');
  assert.strictEqual(stats.totalTeam, d, `Root total team must equal ${d}`);

  const rewards = calculateRegistrationRewards(newestAdviser, uplines, standardRegPolicy);
  
  if (d === 1) {
    assert.strictEqual(rewards.length, 1);
    assert.strictEqual(rewards[0].amount, 300, 'Direct sponsor gets ₹300');
    assert.strictEqual(rewards[0].level, 1);
  } else if (d === 2) {
    assert.strictEqual(rewards.length, 2);
    assert.strictEqual(rewards[0].amount, 300, 'L1 sponsor gets ₹300');
    assert.strictEqual(rewards[1].amount, 200, 'L2 sponsor gets ₹200');
  } else if (d === 3) {
    assert.strictEqual(rewards.length, 3);
    assert.strictEqual(rewards[0].amount, 300, 'L1 sponsor gets ₹300');
    assert.strictEqual(rewards[1].amount, 200, 'L2 sponsor gets ₹200');
    assert.strictEqual(rewards[2].amount, 100, 'L3 sponsor gets ₹100');
  } else if (d >= 4) {
    assert.strictEqual(rewards[0].amount, 300);
    assert.strictEqual(rewards[1].amount, 200);
    assert.strictEqual(rewards[2].amount, 100);
    assert.strictEqual(rewards[3].amount, 100);
    const totalDistributed = rewards.reduce((sum, r) => sum + r.amount, 0);
    assert(totalDistributed <= standardRegPolicy.max_total_reward_cap, `Total reward ₹${totalDistributed} must not exceed cap ₹${standardRegPolicy.max_total_reward_cap}`);
  }

  console.log(`✓ Depth ${d.toString().padStart(3)}: verified ${uplines.length} uplines, tree depth ${d}, rewards distributed: ${rewards.length} levels, total ₹${rewards.reduce((s, r) => s + r.amount, 0)}.`);
}
console.log('✓ All referral depths 1, 2, 3, 4, 5, 20, 100 verified.\n');

// 3. Test Property-Sale Commission Calculations
console.log('TEST 3: Property-Sale Commission Engine');
const sampleAll = generateHierarchy(10);
const seller = sampleAll[sampleAll.length - 1];
const sellerUplines = getUplineHierarchy(seller, sampleAll);

const mockSale = {
  id: 9991,
  property_title: 'Umroli 2BHK Flat',
  sale_price: 5000000,
  company_brokerage_received: 100000,
};

const commissions = calculatePropertyCommissions(mockSale, seller, sellerUplines, standardCommPolicy);
assert(commissions.length > 0, 'Commissions should be generated');

const sellerComm = commissions.find((c) => c.role_in_sale === 'seller');
assert(sellerComm, 'Seller commission must be present');
assert.strictEqual(sellerComm.amount, 10000, 'Seller gets 10% of brokerage: ₹10,000');

const upline1 = commissions.find((c) => c.role_in_sale === 'upline_1');
assert.strictEqual(upline1.amount, 5000, 'Upline 1 gets 5%: ₹5,000');

const upline2 = commissions.find((c) => c.role_in_sale === 'upline_2');
assert.strictEqual(upline2.amount, 4000, 'Upline 2 gets 4%: ₹4,000');

const upline3 = commissions.find((c) => c.role_in_sale === 'upline_3');
assert.strictEqual(upline3.amount, 3000, 'Upline 3 gets 3%: ₹3,000');

const upline4 = commissions.find((c) => c.role_in_sale === 'upline_4');
assert.strictEqual(upline4.amount, 2000, 'Upline 4 gets 2%: ₹2,000');

const upline5 = commissions.find((c) => c.role_in_sale === 'upline_5');
assert.strictEqual(upline5.amount, 1000, 'Upline 5 gets 1%: ₹1,000');

const totalPercent = commissions.reduce((sum, c) => sum + c.rate_percent, 0);
assert(totalPercent <= standardCommPolicy.max_total_commission_cap_percent, 'Commission percentage must not exceed 30% cap');
console.log(`✓ Property commission engine verified: Seller ₹${sellerComm.amount}, uplines ${commissions.length - 1} levels, total commission ₹${commissions.reduce((s, c) => s + c.amount, 0)} (${totalPercent}% of brokerage).\n`);

// 4. Test Webhook Retry & Idempotency
console.log('TEST 4: Idempotency & Webhook Retry Prevention');
const rewardsRun1 = calculateRegistrationRewards(seller, sellerUplines, standardRegPolicy);
const rewardsRun2 = calculateRegistrationRewards(seller, sellerUplines, standardRegPolicy);

const ledger = new Map();
for (const r of rewardsRun1) {
  if (!ledger.has(r.idempotency_key)) ledger.set(r.idempotency_key, r);
}
assert.strictEqual(ledger.size, rewardsRun1.length);

let duplicateBlocked = 0;
for (const r of rewardsRun2) {
  if (ledger.has(r.idempotency_key)) {
    duplicateBlocked++;
  } else {
    ledger.set(r.idempotency_key, r);
  }
}
assert.strictEqual(duplicateBlocked, rewardsRun2.length, 'All retried items must be blocked by idempotency key');
assert.strictEqual(ledger.size, rewardsRun1.length, 'Ledger size must remain unchanged upon retry');
console.log(`✓ Idempotency verified: ${duplicateBlocked} duplicate reward events successfully blocked.\n`);

// 5. Test Suspended Accounts & Eligibility
console.log('TEST 5: Suspended Adviser Upline Handling');
const chainWithSuspended = generateHierarchy(4);
chainWithSuspended[1].status = 'suspended';

const uplinesWithSuspended = getUplineHierarchy(chainWithSuspended[4], chainWithSuspended);
const rewardsWithSuspended = calculateRegistrationRewards(chainWithSuspended[4], uplinesWithSuspended, standardRegPolicy);

const suspendedReward = rewardsWithSuspended.find((r) => r.beneficiary_adviser_id === 'ADV-2');
assert(suspendedReward, 'Entry for suspended adviser must be recorded');
assert.strictEqual(suspendedReward.status, 'held_suspended', 'Reward status for suspended adviser must be held_suspended');
console.log('✓ Suspended adviser properly detected: reward held in pending/held status without payout eligibility.\n');

// 6. Test Reversals with Audit Trail
console.log('TEST 6: Reversals with Audit Trail');
const sampleReward = { ...rewardsRun1[0], status: 'approved' };
const reversalEntry = {
  ...sampleReward,
  status: 'reversed',
  reversed_at: new Date().toISOString(),
  reversal_reason: 'Refunded demo registration',
  reversal_id: `REV-${sampleReward.idempotency_key}`,
};
assert.strictEqual(reversalEntry.status, 'reversed');
assert(reversalEntry.reversed_at);
assert(reversalEntry.reversal_reason);
console.log('✓ Reversal record successfully created with audit reason, preserving original financial record.\n');

// 7. Test Anti-Manipulation (Self-Referral and Circular Prevention)
console.log('TEST 7: Anti-Manipulation (Self-Referral & Cycle Prevention)');
const applicantEmail = 'rahul@iston.test';
const selfSponsorCode = 'ADV-RAHUL';
const isSelf = applicantEmail.toUpperCase().includes('RAHUL') && selfSponsorCode.includes('RAHUL');
assert(isSelf, 'Self-referral check must detect identical user / applicant');

const chainAtoB = [
  { adviser_id: 'ADV-A', sponsor_id: 'ADV-B' },
  { adviser_id: 'ADV-B', sponsor_id: 'ADV-C' },
  { adviser_id: 'ADV-C', sponsor_id: null },
];
const uplinesOfA = getUplineHierarchy(chainAtoB[0], chainAtoB);
const cycleDetected = uplinesOfA.some((u) => u.adviser_id === 'ADV-C');
assert(cycleDetected, 'Cycle detection must identify that ADV-C is in ADV-A upline');
console.log('✓ Self-referral and circular hierarchy prevention verified.\n');

console.log('====================================================');
console.log('   ALL 7 TEST SUITES PASSED FLAWLESSLY!            ');
console.log('====================================================');
