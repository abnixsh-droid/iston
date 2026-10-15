import { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Building,
  TrendingUp,
  Wallet,
  Settings,
  Shield,
  Loader2,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import { api, useApi } from '../lib/api';
import { fmtDate, inr } from '../lib/format';
import { useSeo } from '../lib/seo';

export default function AdvisersAdmin() {
  useSeo('Advisers Program Admin', 'Manage advisers, referral trees, rewards, and commissions.', null, true);

  const [tab, setTab] = useState<'advisers' | 'tree' | 'policies' | 'rewards' | 'commissions' | 'sales' | 'payouts' | 'audit'>('advisers');
  const [advisers, setAdvisers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Policy states
  const [policies, setPolicies] = useState<any>(null);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policyMsg, setPolicyMsg] = useState('');

  // Tree states
  const [treeRootId, setTreeRootId] = useState('');
  const [treeData, setTreeData] = useState<any>(null);
  const [treeLoading, setTreeLoading] = useState(false);

  // Financials / Ledgers
  const [financials, setFinancials] = useState<any>(null);
  const [financialsLoading, setFinancialsLoading] = useState(false);

  // Sale Verification Modal
  const [saleModal, setSaleModal] = useState(false);
  const [saleSellerId, setSaleSellerId] = useState('');
  const [saleTitle, setSaleTitle] = useState('Umroli Project Flat');
  const [salePrice, setSalePrice] = useState('4500000');
  const [saleBrokerage, setSaleBrokerage] = useState('90000');
  const [saleBuyerName, setSaleBuyerName] = useState('');
  const [submittingSale, setSubmittingSale] = useState(false);

  const loadAdvisers = async () => {
    try {
      setLoading(true);
      const res = await api<any>(`/api/advisers?action=admin_list&q=${encodeURIComponent(query)}&status=${statusFilter}`, { auth: true });
      if (res.ok) {
        setAdvisers(res.advisers || []);
        if (!treeRootId && res.advisers?.[0]) {
          setTreeRootId(res.advisers[0].adviser_id);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPolicies = async () => {
    try {
      const res = await api<any>('/api/advisers?action=admin_get_policies', { auth: true });
      if (res.ok) setPolicies(res.policies);
    } catch (err) {
      console.error(err);
    }
  };

  const loadFinancials = async () => {
    try {
      setFinancialsLoading(true);
      const res = await api<any>('/api/advisers?action=admin_get_financials', { auth: true });
      if (res.ok) setFinancials(res);
    } catch (err) {
      console.error(err);
    } finally {
      setFinancialsLoading(false);
    }
  };

  const loadTree = async (rootId: string) => {
    if (!rootId) return;
    try {
      setTreeLoading(true);
      const res = await api<any>(`/api/advisers?action=admin_get_tree&adviser_id=${encodeURIComponent(rootId)}`, { auth: true });
      if (res.ok) setTreeData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setTreeLoading(false);
    }
  };

  useEffect(() => {
    loadAdvisers();
    loadPolicies();
    loadFinancials();
  }, [query, statusFilter]);

  useEffect(() => {
    if (tab === 'tree' && treeRootId) {
      loadTree(treeRootId);
    }
  }, [tab, treeRootId]);

  // Update adviser status
  const updateAdviserStatus = async (adviserId: string, status: string) => {
    try {
      await api('/api/advisers', {
        method: 'POST',
        auth: true,
        body: { action: 'admin_update_status', adviser_id: adviserId, status },
      });
      loadAdvisers();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Verify registration & distribute rewards
  const verifyRegistration = async (adviserId: string) => {
    if (!confirm(`Verify payment for ${adviserId}? This will activate the adviser and distribute tier referral rewards to their sponsor hierarchy.`)) return;
    try {
      const res = await api<any>('/api/advisers', {
        method: 'POST',
        auth: true,
        body: { action: 'admin_verify_registration', adviser_id: adviserId },
      });
      alert(res.message || 'Verified successfully!');
      loadAdvisers();
      loadFinancials();
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    }
  };

  // Update ledger status / reverse
  const updateLedgerStatus = async (type: 'reward' | 'commission', id: string, status: string) => {
    let reason = '';
    if (status === 'reversed') {
      reason = prompt('Enter reason for reversal (will be permanently recorded in audit trail):') || '';
      if (!reason) return;
    }
    try {
      await api('/api/advisers', {
        method: 'POST',
        auth: true,
        body: { action: 'admin_update_ledger_status', type, id, status, reason },
      });
      loadFinancials();
    } catch (err: any) {
      alert(err.message || 'Failed to update ledger item');
    }
  };

  // Update payout status
  const updatePayoutStatus = async (payoutId: number, status: string) => {
    let ref = '';
    if (status === 'completed') {
      ref = prompt('Enter bank transaction reference / UTR number:') || `NEFT-${Date.now()}`;
    }
    try {
      await api('/api/advisers', {
        method: 'POST',
        auth: true,
        body: { action: 'admin_update_payout_status', payout_id: payoutId, status, transaction_reference: ref },
      });
      loadFinancials();
    } catch (err: any) {
      alert(err.message || 'Failed to update payout');
    }
  };

  // Verify property sale
  const handleVerifySale = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingSale(true);
    try {
      await api('/api/advisers', {
        method: 'POST',
        auth: true,
        body: {
          action: 'admin_verify_sale',
          seller_adviser_id: saleSellerId,
          property_title: saleTitle,
          sale_price: Number(salePrice),
          company_brokerage_received: Number(saleBrokerage),
          buyer_name: saleBuyerName || 'Verified Buyer',
        },
      });
      alert('Sale verified and commissions distributed successfully!');
      setSaleModal(false);
      loadFinancials();
    } catch (err: any) {
      alert(err.message || 'Error verifying sale');
    } finally {
      setSubmittingSale(false);
    }
  };

  // Render tree node recursively
  const renderTreeNode = (node: any) => {
    if (!node) return null;
    return (
      <div key={node.adviser_id} className="ml-4 pl-4 border-l-2 border-line my-2">
        <div className="flex items-center gap-2 text-xs py-1">
          <span className="font-mono font-bold text-navy bg-mist px-2 py-0.5 rounded">
            L{node.depth_level}: {node.adviser_id}
          </span>
          <span className="font-semibold text-navy">{node.full_name}</span>
          <span className="text-muted">({node.email})</span>
          <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold uppercase ${node.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
            {node.status}
          </span>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="space-y-1">
            {node.children.map((child: any) => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold text-muted">Management & Financial Controls</p>
          <h1 className="font-display text-4xl text-navy">Advisers Program Admin</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSaleModal(true)}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> Verify Property Sale
          </button>
        </div>
      </div>

      {/* ADMIN NAVIGATION TABS */}
      <div className="border-b border-line flex gap-2 overflow-x-auto pb-px mb-8">
        {[
          ['advisers', `Advisers (${advisers.length})`],
          ['tree', 'Referral Hierarchy Tree'],
          ['rewards', `Registration Rewards (${financials?.registrationRewards?.length || 0})`],
          ['commissions', `Property Commissions (${financials?.propertyCommissions?.length || 0})`],
          ['sales', `Property Sales (${financials?.propertySales?.length || 0})`],
          ['payouts', `Payouts (${financials?.payoutRequests?.length || 0})`],
          ['policies', 'Policies & Rules'],
          ['audit', `Audit Logs (${financials?.auditLogs?.length || 0})`],
        ].map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition border-b-2 ${
              tab === t ? 'border-navy text-navy font-bold' : 'border-transparent text-muted hover:text-navy hover:border-line'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 1. ADVISERS LIST */}
      {tab === 'advisers' && (
        <section className="rounded-3xl border border-line bg-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row gap-3 justify-between mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted" />
              <input
                type="text"
                placeholder="Search by name, email, adviser ID or code..."
                className="input pl-9 text-xs"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Status:</span>
              <select
                className="input text-xs py-1.5 w-auto"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-navy" /></div>
          ) : advisers.length === 0 ? (
            <div className="py-12 text-center text-muted text-xs">No advisers matching search criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-mist/60 text-muted uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Adviser ID</th>
                    <th className="py-3 px-4">Name & Email</th>
                    <th className="py-3 px-4">Sponsor ID</th>
                    <th className="py-3 px-4">Referral Code</th>
                    <th className="py-3 px-4">Level</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {advisers.map((a) => (
                    <tr key={a.adviser_id} className="hover:bg-mist/30 transition">
                      <td className="py-3 px-4 font-mono font-bold text-navy">{a.adviser_id}</td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-navy">{a.full_name}</p>
                        <p className="text-[11px] text-muted">{a.email} · {a.phone}</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-muted">{a.sponsor_id || 'Root'}</td>
                      <td className="py-3 px-4 font-mono">{a.referral_code}</td>
                      <td className="py-3 px-4">L{a.depth_level || 1}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                          a.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                          a.status === 'suspended' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] text-muted uppercase font-mono">{a.payment_status}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {a.status !== 'active' && (
                            <button
                              onClick={() => verifyRegistration(a.adviser_id)}
                              className="px-2 py-1 rounded bg-emerald-600 text-white font-semibold text-[10px] hover:bg-emerald-700"
                            >
                              Verify & Activate
                            </button>
                          )}
                          {a.status === 'active' ? (
                            <button
                              onClick={() => updateAdviserStatus(a.adviser_id, 'suspended')}
                              className="px-2 py-1 rounded bg-rose-50 text-rose-700 font-semibold text-[10px] hover:bg-rose-100 border border-rose-200"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => updateAdviserStatus(a.adviser_id, 'active')}
                              className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px] hover:bg-emerald-100 border border-emerald-200"
                            >
                              Set Active
                            </button>
                          )}
                          <button
                            onClick={() => { setTreeRootId(a.adviser_id); setTab('tree'); }}
                            className="px-2 py-1 rounded bg-mist text-navy font-semibold text-[10px] hover:bg-line"
                          >
                            Inspect Tree
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* 2. REFERRAL HIERARCHY TREE */}
      {tab === 'tree' && (
        <section className="rounded-3xl border border-line bg-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl text-navy">Unlimited-Depth Referral Tree</h2>
              <p className="text-xs text-muted mt-1">
                Inspect downward referral network for any root adviser. Supports unlimited depth traversal.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Root Adviser ID:</span>
              <input
                type="text"
                className="input text-xs py-1.5 font-mono uppercase w-40"
                value={treeRootId}
                onChange={(e) => setTreeRootId(e.target.value.toUpperCase())}
              />
              <button onClick={() => loadTree(treeRootId)} className="btn btn-sm btn-primary">
                Inspect
              </button>
            </div>
          </div>

          {treeLoading ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-navy" /></div>
          ) : !treeData ? (
            <div className="py-12 text-center text-muted text-xs">Enter an Adviser ID to inspect their referral tree.</div>
          ) : (
            <div>
              <div className="grid grid-cols-3 gap-3 mb-6 p-4 rounded-2xl bg-mist border border-line text-xs">
                <div>
                  <span className="text-muted">Direct Referrals:</span>
                  <p className="font-bold text-navy text-lg">{treeData.stats?.directCount}</p>
                </div>
                <div>
                  <span className="text-muted">Total Downline Network:</span>
                  <p className="font-bold text-navy text-lg">{treeData.stats?.totalTeam}</p>
                </div>
                <div>
                  <span className="text-muted">Levels Active:</span>
                  <p className="font-bold text-navy text-lg">{Object.keys(treeData.stats?.levelCounts || {}).length}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-mist/20 p-5 overflow-x-auto font-sans">
                {renderTreeNode(treeData.tree)}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 3. REGISTRATION REWARDS LEDGER */}
      {tab === 'rewards' && (
        <section className="rounded-3xl border border-line bg-white p-6 shadow-xs">
          <h2 className="font-display text-2xl text-navy mb-4">Registration Referral Rewards Ledger</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-mist/60 text-muted uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">New Adviser</th>
                  <th className="py-3 px-4">Beneficiary</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(financials?.registrationRewards || []).map((r: any) => (
                  <tr key={r.idempotency_key || r.id} className="hover:bg-mist/30 transition">
                    <td className="py-3 px-4 font-mono">{fmtDate(r.created_at)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-navy">{r.new_adviser_id}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-navy">{r.beneficiary_adviser_id}</p>
                      <p className="text-[11px] text-muted">{r.beneficiary_email}</p>
                    </td>
                    <td className="py-3 px-4">Level {r.level}</td>
                    <td className="py-3 px-4 font-bold text-navy text-sm">{inr(r.amount)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                        r.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        r.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                        r.status === 'reversed' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status === 'pending' && (
                          <button
                            onClick={() => updateLedgerStatus('reward', r.idempotency_key, 'approved')}
                            className="px-2 py-1 rounded bg-emerald-600 text-white font-semibold text-[10px]"
                          >
                            Approve
                          </button>
                        )}
                        {r.status !== 'reversed' && (
                          <button
                            onClick={() => updateLedgerStatus('reward', r.idempotency_key, 'reversed')}
                            className="px-2 py-1 rounded bg-rose-50 text-rose-700 font-semibold text-[10px] hover:bg-rose-100 border border-rose-200"
                          >
                            Reverse
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 4. PROPERTY COMMISSIONS LEDGER */}
      {tab === 'commissions' && (
        <section className="rounded-3xl border border-line bg-white p-6 shadow-xs">
          <h2 className="font-display text-2xl text-navy mb-4">Property-Sale Commissions Ledger</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-mist/60 text-muted uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Property Title</th>
                  <th className="py-3 px-4">Beneficiary</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Rate %</th>
                  <th className="py-3 px-4">Base Amount</th>
                  <th className="py-3 px-4">Commission</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(financials?.propertyCommissions || []).map((c: any) => (
                  <tr key={c.idempotency_key || c.id} className="hover:bg-mist/30 transition">
                    <td className="py-3 px-4 font-mono">{fmtDate(c.created_at)}</td>
                    <td className="py-3 px-4 font-semibold text-navy">{c.property_title}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-navy">{c.beneficiary_adviser_id}</p>
                      <p className="text-[11px] text-muted">{c.beneficiary_email}</p>
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] font-bold">{c.role_in_sale}</td>
                    <td className="py-3 px-4 font-semibold">{c.rate_percent}%</td>
                    <td className="py-3 px-4 text-muted">{inr(c.commission_base_amount)}</td>
                    <td className="py-3 px-4 font-bold text-navy text-sm">{inr(c.amount)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                        c.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        c.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                        c.status === 'reversed' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.status === 'pending' && (
                          <button
                            onClick={() => updateLedgerStatus('commission', c.idempotency_key, 'approved')}
                            className="px-2 py-1 rounded bg-emerald-600 text-white font-semibold text-[10px]"
                          >
                            Approve
                          </button>
                        )}
                        {c.status !== 'reversed' && (
                          <button
                            onClick={() => updateLedgerStatus('commission', c.idempotency_key, 'reversed')}
                            className="px-2 py-1 rounded bg-rose-50 text-rose-700 font-semibold text-[10px] hover:bg-rose-100 border border-rose-200"
                          >
                            Reverse
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 5. PROPERTY SALES */}
      {tab === 'sales' && (
        <section className="rounded-3xl border border-line bg-white p-6 shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-2xl text-navy">Verified Property Sales</h2>
            <button onClick={() => setSaleModal(true)} className="btn btn-primary btn-sm flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4" /> Record & Verify Sale
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-mist/60 text-muted uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Sale ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Seller Adviser</th>
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">Buyer</th>
                  <th className="py-3 px-4">Sale Price</th>
                  <th className="py-3 px-4">Company Brokerage</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(financials?.propertySales || []).map((s: any) => (
                  <tr key={s.id} className="hover:bg-mist/30 transition">
                    <td className="py-3 px-4 font-mono">{s.id}</td>
                    <td className="py-3 px-4">{fmtDate(s.created_at)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-navy">{s.seller_adviser_id}</td>
                    <td className="py-3 px-4 font-semibold text-navy">{s.property_title}</td>
                    <td className="py-3 px-4">{s.buyer_name}</td>
                    <td className="py-3 px-4 font-bold text-navy">{inr(s.sale_price)}</td>
                    <td className="py-3 px-4 text-emerald-700 font-bold">{inr(s.company_brokerage_received)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase text-[9px]">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 6. PAYOUT REQUESTS */}
      {tab === 'payouts' && (
        <section className="rounded-3xl border border-line bg-white p-6 shadow-xs">
          <h2 className="font-display text-2xl text-navy mb-4">Adviser Payout Requests</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-mist/60 text-muted uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Adviser ID</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(financials?.payoutRequests || []).map((p: any) => (
                  <tr key={p.id} className="hover:bg-mist/30 transition">
                    <td className="py-3 px-4 font-mono">{fmtDate(p.created_at)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-navy">{p.adviser_id}</td>
                    <td className="py-3 px-4 font-bold text-navy text-sm">{inr(p.amount)}</td>
                    <td className="py-3 px-4 uppercase">{p.payment_method}</td>
                    <td className="py-3 px-4 font-mono text-muted">{p.transaction_reference || 'None'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                        p.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        p.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.status === 'pending' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => updatePayoutStatus(p.id, 'completed')}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold text-[10px]"
                          >
                            Mark Completed
                          </button>
                          <button
                            onClick={() => updatePayoutStatus(p.id, 'rejected')}
                            className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 font-semibold text-[10px] border border-rose-200"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 7. POLICIES & LIABILITY PREVIEW */}
      {tab === 'policies' && policies && (
        <section className="space-y-8">
          {/* Policy 1: Registration Referral Rewards */}
          <div className="rounded-3xl border border-line bg-white p-6 md:p-8 shadow-xs">
            <h2 className="font-display text-2xl text-navy">Registration Referral Reward Policy</h2>
            <p className="text-xs text-muted mt-1">Configurable settings for ₹1,100 registration reward distribution.</p>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-mist border border-line">
                <span className="text-muted">Registration Fee</span>
                <p className="font-display text-2xl text-navy mt-1">₹{policies.registration_reward?.registration_fee || 1100}</p>
              </div>
              <div className="p-4 rounded-2xl bg-mist border border-line">
                <span className="text-muted">Direct Referrer (L1)</span>
                <p className="font-display text-2xl text-emerald-700 mt-1">₹{policies.registration_reward?.tiers?.['1'] || 300}</p>
              </div>
              <div className="p-4 rounded-2xl bg-mist border border-line">
                <span className="text-muted">2nd Upline (L2)</span>
                <p className="font-display text-2xl text-emerald-700 mt-1">₹{policies.registration_reward?.tiers?.['2'] || 200}</p>
              </div>
              <div className="p-4 rounded-2xl bg-mist border border-line">
                <span className="text-muted">3rd Upline (L3)</span>
                <p className="font-display text-2xl text-emerald-700 mt-1">₹{policies.registration_reward?.tiers?.['3'] || 100}</p>
              </div>
            </div>

            {/* Total payout liability preview */}
            <div className="mt-6 p-5 rounded-2xl bg-navy text-white text-xs space-y-2">
              <p className="font-bold text-sm text-brass-light uppercase tracking-wider">Payout Liability Breakdown Preview:</p>
              <p>• Max Eligible Upline Levels: <b>{policies.registration_reward?.max_eligible_levels || 10}</b> levels.</p>
              <p>• Cumulative Reward for 5-level upline chain: <b>₹300 + ₹200 + ₹100 + ₹100 + ₹100 = ₹800</b>.</p>
              <p>• Maximum Total Reward Cap: <b>₹{policies.registration_reward?.max_total_reward_cap || 1100}</b> per registration.</p>
              <p>• Net Company Retention per registration: <b>₹1,100 - Total Rewards</b> (guaranteed non-negative by cap).</p>
            </div>
          </div>

          {/* Policy 2: Property-Sale Commissions */}
          <div className="rounded-3xl border border-line bg-white p-6 md:p-8 shadow-xs">
            <h2 className="font-display text-2xl text-navy">Property-Sale Commission Policy</h2>
            <p className="text-xs text-muted mt-1">Independent commission engine for verified property sales.</p>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-mist border border-line">
                <span className="text-muted">Commission Base</span>
                <p className="font-bold text-navy text-sm uppercase mt-1">{policies.property_commission?.commission_base}</p>
              </div>
              <div className="p-4 rounded-2xl bg-mist border border-line">
                <span className="text-muted">Seller Rate</span>
                <p className="font-display text-2xl text-emerald-700 mt-1">{policies.property_commission?.seller_rate_percent}%</p>
              </div>
              <div className="p-4 rounded-2xl bg-mist border border-line">
                <span className="text-muted">Level 1 Upline</span>
                <p className="font-display text-2xl text-emerald-700 mt-1">{policies.property_commission?.upline_rates_percent?.['1']}%</p>
              </div>
              <div className="p-4 rounded-2xl bg-mist border border-line">
                <span className="text-muted">Levels 2, 3, 4, 5</span>
                <p className="font-bold text-navy text-sm mt-2">4%, 3%, 2%, 1%</p>
              </div>
            </div>

            <div className="mt-6 p-5 rounded-2xl bg-navy text-white text-xs space-y-2">
              <p className="font-bold text-sm text-brass-light uppercase tracking-wider">Property Commission Liability Preview:</p>
              <p>• Total upline override percentage across all levels: <b>5% + 4% + 3% + 2% + 1% = 15%</b>.</p>
              <p>• Combined Seller (10%) + Upline Overrides (15%): <b>25% of company brokerage</b>.</p>
              <p>• Total Commission Cap: <b>{policies.property_commission?.max_total_commission_cap_percent}%</b> max cap enforced.</p>
            </div>
          </div>
        </section>
      )}

      {/* 8. AUDIT LOGS */}
      {tab === 'audit' && (
        <section className="rounded-3xl border border-line bg-white p-6 shadow-xs">
          <h2 className="font-display text-2xl text-navy mb-4">Immutable Audit Trail</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-mist/60 text-muted uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Entity ID</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(financials?.auditLogs || []).map((l: any) => (
                  <tr key={l.id} className="hover:bg-mist/30 transition">
                    <td className="py-3 px-4 font-mono">{fmtDate(l.created_at)}</td>
                    <td className="py-3 px-4 font-bold text-navy uppercase text-[10px]">{l.action}</td>
                    <td className="py-3 px-4 font-mono">{l.entity_type}</td>
                    <td className="py-3 px-4 font-mono">{l.entity_id}</td>
                    <td className="py-3 px-4 font-semibold text-navy">{l.performed_by}</td>
                    <td className="py-3 px-4 text-muted font-mono truncate max-w-xs">{JSON.stringify(l.details)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* RECORD SALE MODAL */}
      {saleModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-line">
            <h3 className="font-display text-2xl text-navy">Record & Verify Property Sale</h3>
            <p className="text-xs text-muted mt-1">
              Verifying a sale calculates and distributes commissions to the seller and their uplines with idempotency.
            </p>

            <form onSubmit={handleVerifySale} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="label">Seller Adviser ID *</label>
                <select
                  required
                  className="input text-xs font-mono"
                  value={saleSellerId}
                  onChange={(e) => setSaleSellerId(e.target.value)}
                >
                  <option value="">Select seller adviser...</option>
                  {advisers.map((a) => (
                    <option key={a.adviser_id} value={a.adviser_id}>
                      {a.adviser_id} — {a.full_name} ({a.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Property Title *</label>
                <input
                  type="text"
                  required
                  className="input text-xs"
                  value={saleTitle}
                  onChange={(e) => setSaleTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Total Sale Price (₹) *</label>
                  <input
                    type="number"
                    required
                    className="input text-xs font-bold"
                    value={salePrice}
                    onChange={(e) => {
                      const sp = Number(e.target.value);
                      setSalePrice(e.target.value);
                      setSaleBrokerage(String(Math.round(sp * 0.02)));
                    }}
                  />
                </div>
                <div>
                  <label className="label">Brokerage Received (₹) *</label>
                  <input
                    type="number"
                    required
                    className="input text-xs font-bold text-emerald-700"
                    value={saleBrokerage}
                    onChange={(e) => setSaleBrokerage(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Buyer Full Name</label>
                <input
                  type="text"
                  className="input text-xs"
                  placeholder="e.g. Amit Verma"
                  value={saleBuyerName}
                  onChange={(e) => setSaleBuyerName(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSaleModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSale || !saleSellerId}
                  className="btn btn-primary flex-1"
                >
                  {submittingSale ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify Sale & Distribute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
