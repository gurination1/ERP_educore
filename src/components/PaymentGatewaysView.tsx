import React, { useState, useEffect } from 'react';
import { safeGoBack } from '../utils/navigation';
import { api } from '../api/client';
import { CreditCard, Shield, Plus, ToggleLeft, ToggleRight, CheckCircle2, AlertTriangle, Key, Landmark } from 'lucide-react';

interface PaymentGateway {
  id: string;
  tenant_id: string;
  gateway_name: string;
  account_title: string;
  credentials_json?: string;
  mode: 'live' | 'test';
  is_active: boolean;
  test_allowed_uids_json?: string;
  created_at: string;
}

export const PaymentGatewaysView: React.FC<{ tenantId?: string }> = ({ tenantId = 'ten-bfgi-01' }) => {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [gatewayName, setGatewayName] = useState('RAZORPAY');
  const [accountTitle, setAccountTitle] = useState('');
  const [keyId, setKeyId] = useState('');
  const [keySecret, setKeySecret] = useState('');
  const [mode, setMode] = useState<'live' | 'test'>('test');
  const [testUids, setTestUids] = useState('STU2024001, STU2024002');

  useEffect(() => {
    loadGateways();
  }, [tenantId]);

  const loadGateways = async () => {
    setIsLoading(true);
    try {
      const res = await api.getPaymentGateways(tenantId);
      if (res.success) {
        setGateways(res.gateways || []);
      }
    } catch (err) {
      console.error('Failed to load gateways:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMode = async (id: string) => {
    try {
      const res = await api.togglePaymentGatewayMode(id);
      if (res.success) {
        setGateways(prev => prev.map(g => g.id === id ? res.gateway : g));
      }
    } catch (err: any) {
      alert('Failed to toggle mode: ' + err.message);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const res = await api.activatePaymentGateway(id, tenantId);
      if (res.success) {
        setGateways(prev => prev.map(g => ({ ...g, is_active: g.id === id })));
      }
    } catch (err: any) {
      alert('Failed to activate gateway: ' + err.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const uidsArray = testUids.split(',').map(u => u.trim()).filter(Boolean);
      const res = await api.createPaymentGateway({
        tenant_id: tenantId,
        gateway_name: gatewayName,
        account_title: accountTitle,
        credentials_json: JSON.stringify({ key_id: keyId, key_secret: keySecret }),
        mode,
        is_active: false,
        test_allowed_uids_json: JSON.stringify(uidsArray),
      });
      if (res.success) {
        setShowAddModal(false);
        setAccountTitle('');
        setKeyId('');
        setKeySecret('');
        loadGateways();
      }
    } catch (err: any) {
      alert('Failed to create gateway: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => safeGoBack()}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-sm transition-all cursor-pointer border border-slate-700 shrink-0"
            title="Return to Previous Screen (Alt + ←)"
          >
            ‹
          </button>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              Dynamic Payment Gateways & Banking Accounts
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Manage distinct current accounts (e.g. Pharmacy vs Law Schools) and switch between Sandbox Test and Live modes dynamically.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Gateway / Current A/C
        </button>
      </div>

      {/* Gateway Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gateways.map(gw => (
          <div
            key={gw.id}
            className={`p-5 rounded-2xl border transition-all ${
              gw.is_active
                ? 'bg-slate-900 border-indigo-500/80 shadow-lg ring-1 ring-indigo-500/40'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${gw.is_active ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{gw.account_title}</h3>
                  <span className="text-xs font-mono font-semibold text-slate-400">{gw.gateway_name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  gw.mode === 'live'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {gw.mode} MODE
                </span>
                {gw.is_active && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500 text-white">
                    ACTIVE
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-4 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Mode Behavior:</span>
                <span className="text-slate-300 font-medium">
                  {gw.mode === 'live' ? 'Open to all students campus-wide' : 'Hidden from students; Test UIDs only'}
                </span>
              </div>
              {gw.mode === 'test' && (
                <div className="text-[11px] text-amber-400/90 flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Sandbox active: Normal students will not see Pay button.</span>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <button
                onClick={() => handleToggleMode(gw.id)}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
              >
                {gw.mode === 'live' ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-amber-400" />}
                <span>Switch to {gw.mode === 'live' ? 'Test' : 'Live'}</span>
              </button>

              {!gw.is_active ? (
                <button
                  onClick={() => handleActivate(gw.id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-semibold transition-colors"
                >
                  Make Active
                </button>
              ) : (
                <span className="text-xs text-indigo-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Routing Current Transactions
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Gateway Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100">
            <h3 className="text-base font-bold text-white mb-1">Add Payment Gateway & Account</h3>
            <p className="text-xs text-slate-400 mb-4">Register separate merchant account for distinct collegiate schools.</p>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Gateway Provider</label>
                <select
                  value={gatewayName}
                  onChange={e => setGatewayName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="RAZORPAY">Razorpay Gateway</option>
                  <option value="HDFC_PAYU">HDFC PayU Gateway</option>
                  <option value="ICICI_EPAY">ICICI ePay Merchant</option>
                  <option value="CASHFREE">Cashfree Payments</option>
                  <option value="STRIPE">Stripe Collegiate</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Current Account / School Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pharmacy School Separate Tuition A/C"
                  value={accountTitle}
                  onChange={e => setAccountTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Key ID / Merchant ID</label>
                  <input
                    type="text"
                    required
                    placeholder="rzp_live_xxx / HDFC_xxx"
                    value={keyId}
                    onChange={e => setKeyId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Key Secret / Salt</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={keySecret}
                    onChange={e => setKeySecret(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Initial Mode</label>
                <select
                  value={mode}
                  onChange={e => setMode(e.target.value as 'live' | 'test')}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="test">Test / Sandbox (Hidden from regular students)</option>
                  <option value="live">Live Production (Open campus-wide)</option>
                </select>
              </div>

              {mode === 'test' && (
                <div>
                  <label className="block text-slate-400 mb-1">Test Allowed Student UIDs (Comma separated)</label>
                  <input
                    type="text"
                    value={testUids}
                    onChange={e => setTestUids(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Save Gateway
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
