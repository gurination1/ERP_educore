import React, { useState, useEffect } from 'react';
import { api, setStoredToken, setStoredUser } from '../api/client';
import { User, ActiveScreen } from '../types';

interface SuperAdminDashboardViewProps {
  currentUser?: User | null;
  onNavigate: (screen: ActiveScreen) => void;
  onOpenMasterTables?: () => void;
  onOpenAuditLogs?: () => void;
}

interface Tenant {
  id: string;
  client_id: string;
  short_code: string;
  client_name: string;
  subdomain: string;
  entity_type: 'school' | 'college' | 'department' | 'university';
  db_name: string;
  is_functional: boolean;
  admin_username: string;
  admin_email: string;
  contact_person?: string;
  contact_phone?: string;
  subscription_tier: 'standard' | 'premium' | 'enterprise';
  created_at: string;
  last_impersonated_at?: string;
}

export const SuperAdminDashboardView: React.FC<SuperAdminDashboardViewProps> = ({
  currentUser,
  onNavigate,
  onOpenMasterTables,
  onOpenAuditLogs,
}) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [dbHealth, setDbHealth] = useState<any>(null);

  // Add Tenant Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({
    client_name: '',
    short_code: '',
    entity_type: 'college' as 'college' | 'school' | 'department' | 'university',
    subdomain: '',
    admin_username: '',
    admin_email: '',
    contact_person: '',
    contact_phone: '',
    subscription_tier: 'enterprise' as 'standard' | 'premium' | 'enterprise',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tenantsRes, healthRes] = await Promise.all([
        api.getTenants().catch(() => ({ success: false, tenants: [] })),
        fetch('/api/health').then(r => r.json()).catch(() => null),
      ]);
      if (tenantsRes.success && Array.isArray(tenantsRes.tenants)) {
        setTenants(tenantsRes.tenants);
      }
      setDbHealth(healthRes);
    } catch (err: any) {
      console.warn('Super Admin dashboard load error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFunctional = async (tenant: Tenant) => {
    try {
      const res = await api.toggleTenantFunctional(tenant.id, !tenant.is_functional);
      if (res.success) {
        setTenants(prev =>
          prev.map(t => (t.id === tenant.id ? { ...t, is_functional: !t.is_functional } : t))
        );
        setFeedback({
          type: 'success',
          message: `${tenant.client_name} operational status updated to ${!tenant.is_functional ? 'PRODUCTION ACTIVE' : 'INACTIVE'}.`,
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // ONE-CLICK DIRECT IMPERSONATION ("Open" button)
  const handleOneClickImpersonation = async (tenant: Tenant) => {
    if (!tenant.is_functional) {
      setFeedback({
        type: 'error',
        message: `Tenant ${tenant.client_name} is marked Inactive. Toggle 'Make Functional' prior to impersonation.`,
      });
      return;
    }

    setImpersonatingId(tenant.id);
    try {
      const res = await api.impersonateTenant(tenant.id);
      if (res.success && res.token && res.user) {
        setStoredToken(res.token);
        setStoredUser(res.user);
        setFeedback({
          type: 'success',
          message: `Direct Impersonation active: Logged into ${tenant.client_name} as Institutional Admin. Switching view...`,
        });
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 800);
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to generate impersonation token',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setImpersonatingId(null);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.client_name || !newTenant.short_code) {
      setFeedback({ type: 'error', message: 'Client Name and Short Code are mandatory.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.createTenant({
        ...newTenant,
        subdomain: newTenant.subdomain || `${newTenant.short_code.toLowerCase()}.gurudotcom`,
        admin_username: newTenant.admin_username || `admin_${newTenant.short_code.toLowerCase()}`,
        admin_email: newTenant.admin_email || `admin@${newTenant.short_code.toLowerCase()}.edu`,
      });
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Client ${newTenant.client_name} successfully provisioned! Isolated schema db_${newTenant.short_code.toLowerCase()} generated.`,
        });
        setIsAddModalOpen(false);
        setNewTenant({
          client_name: '',
          short_code: '',
          entity_type: 'college',
          subdomain: '',
          admin_username: '',
          admin_email: '',
          contact_person: '',
          contact_phone: '',
          subscription_tier: 'enterprise',
        });
        loadData();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to create tenant.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeTenantsCount = tenants.filter(t => t.is_functional).length;

  return (
    <div id="super-admin-cockpit" className="space-y-4 animate-fadeIn text-xs">
      {/* Apex SaaS Master Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00236f] to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md">
            SaaS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base text-[#00236f] tracking-tight">
                Universal Provost & SaaS Platform Master Cockpit
              </h2>
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md">
                APEX 9001
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Multi-tenant collegiate provisioning, cloud database topology, and global platform telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="h-8 px-3.5 bg-[#00236f] hover:bg-[#001b54] text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>+ Onboard New College</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800'
              : 'bg-rose-50/90 border-rose-200 text-rose-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="font-bold ml-2 text-slate-500 hover:text-slate-800">
            ✕
          </button>
        </div>
      )}

      {/* 4 Multi-Tenant SaaS Master KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Onboarded Client Campuses */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Client Institutions</span>
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full text-xs font-bold">
              {activeTenantsCount} ACTIVE
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#00236f] tracking-tight">{tenants.length}</span>
            <span className="text-xs text-slate-500">Campuses Managed</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Subdomain routing: <strong className="text-slate-700">*.gurudotcom</strong></span>
          </div>
        </div>

        {/* KPI 2: Multi-Tenant Database Health */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Database Engines</span>
            <span className="text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-full text-xs font-bold">
              MULTI-POOL
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-indigo-900 tracking-tight">PostgreSQL / MariaDB</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Status: <strong className="text-emerald-700">{dbHealth?.database || 'Active Pool'}</strong></span>
            <span className="font-mono text-[10px] text-slate-400">57 Tables</span>
          </div>
        </div>

        {/* KPI 3: Cross-Campus Scholar Census */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Global Scholar Census</span>
            <span className="text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full text-xs font-bold">
              ALL CAMPUSES
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-900 tracking-tight">12,450</span>
            <span className="text-xs text-slate-500">Enrolled Scholars</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            <span>Active cross-college user sessions: <strong className="text-slate-800">1,840</strong></span>
          </div>
        </div>

        {/* KPI 4: Platform Throughput & Security SLA */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Platform SLA & Latency</span>
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full text-xs font-bold">
              99.98%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">12ms</span>
            <span className="text-xs text-emerald-600 font-semibold">Fast Edge Cache</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            <span>Immutable audit events: <strong className="text-slate-800">4,289 logged</strong></span>
          </div>
        </div>
      </div>

      {/* Main Grid: Onboarded Colleges Table (8 cols) & Canonical Architecture Guide (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Onboarded Colleges & One-Click Impersonation (8 cols) */}
        <div className="lg:col-span-8 bg-white/95 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-xs font-bold text-[#00236f] uppercase tracking-wide">
                  Client Institutions & One-Click Direct Impersonation ("Open" Button)
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Select any college to instantly switch into its Institutional Principal console without login credentials
                </p>
              </div>
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full font-mono text-[11px] font-bold">
                {tenants.length} Registered
              </span>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                    <th className="py-2 px-2">Institution / Client Name</th>
                    <th className="py-2 px-2">Client Code & Subdomain</th>
                    <th className="py-2 px-2">Type</th>
                    <th className="py-2 px-2">Database Schema</th>
                    <th className="py-2 px-2 text-center">Status</th>
                    <th className="py-2 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenants.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-2">
                        <strong className="text-slate-900 block font-bold text-xs">{t.client_name}</strong>
                        <span className="text-slate-500 text-[11px]">{t.admin_email}</span>
                      </td>
                      <td className="py-2.5 px-2 font-mono">
                        <span className="font-bold text-[#00236f]">{t.client_id}</span>
                        <span className="block text-[11px] text-slate-500">{t.subdomain}</span>
                      </td>
                      <td className="py-2.5 px-2 capitalize">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200/60">
                          {t.entity_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-mono text-[11px] text-slate-600">
                        {t.db_name}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFunctional(t)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                            t.is_functional
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {t.is_functional ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <button
                          type="button"
                          disabled={!t.is_functional || impersonatingId === t.id}
                          onClick={() => handleOneClickImpersonation(t)}
                          className={`h-7 px-3 rounded-lg font-bold text-[11px] transition shadow-2xs flex items-center gap-1.5 ml-auto cursor-pointer ${
                            t.is_functional
                              ? 'bg-[#00236f] hover:bg-[#001b54] text-white'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {impersonatingId === t.id ? (
                            <span>Opening...</span>
                          ) : (
                            <>
                              <span>Open</span>
                              <span>&rarr;</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Karanvir Sir Mandate: Super Admin clicks <strong>Open</strong> to bypass login directly into tenant</span>
            <button
              onClick={() => onNavigate('tenants')}
              className="text-[#00236f] font-bold hover:underline cursor-pointer"
            >
              Full Tenants Directory &rarr;
            </button>
          </div>
        </div>

        {/* Canonical Pure-Digit UID Structure & Architecture Guide (4 cols) */}
        <div className="lg:col-span-4 bg-white/95 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Canonical Pure-Digit UID Architecture
                </h3>
                <p className="text-slate-500 text-[11px]">Formula defined by Senior Mentor Karanvir Sir</p>
              </div>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-mono text-[10px] font-bold">
                5-SEGMENT
              </span>
            </div>

            <div className="mt-3 p-3 bg-slate-50/90 rounded-xl border border-slate-200/70 font-mono text-xs space-y-2">
              <div className="text-[11px] text-slate-600 font-bold">
                [Type4] - [Seq2] - [Client2] - [State03] - [Inst01]
              </div>
              <div className="text-[11px] text-slate-500 space-y-1">
                <div>• <strong className="text-[#00236f]">9001</strong>: Universal Provost & Super Admin</div>
                <div>• <strong className="text-[#00236f]">4001</strong>: Institutional Admin / Principal</div>
                <div>• <strong className="text-[#00236f]">3001</strong>: Head of Department (HOD)</div>
                <div>• <strong className="text-[#00236f]">2001</strong>: Teaching Faculty / Professor</div>
                <div>• <strong className="text-[#00236f]">5001</strong>: Chief Accounts Officer / Bursar</div>
                <div>• <strong className="text-[#00236f]">6001</strong>: Admissions Counselor</div>
                <div>• <strong className="text-[#00236f]">1001</strong>: Enrolled College Student</div>
              </div>
              <div className="pt-2 border-t border-slate-200/80 text-[10px] text-slate-500">
                Example: <strong className="text-slate-800">4001-01-01-03-01</strong> = Principal of BFGI (Client 01, State 03 Punjab)
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Quick Management Desks</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('field-permissions')}
                  className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100 text-left transition"
                >
                  <strong className="block text-slate-800 text-[11px]">Field RBAC</strong>
                  <span className="text-[10px] text-slate-500">View &rarr; Edit rules</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('payment-gateways')}
                  className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100 text-left transition"
                >
                  <strong className="block text-slate-800 text-[11px]">Gateways</strong>
                  <span className="text-[10px] text-slate-500">Live vs Sandbox</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
            Platform Engine: <strong className="text-slate-800">PostgreSQL 18.6 + MariaDB High-Concurrency Pool</strong>
          </div>
        </div>
      </div>

      {/* Add New Tenant Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-[#00236f]">Onboard New Collegiate Client</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Institution Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Guru Nanak Dev Engineering College"
                  value={newTenant.client_name}
                  onChange={e => setNewTenant({ ...newTenant, client_name: e.target.value })}
                  className="w-full h-9 px-3 bg-slate-50 border rounded-lg text-xs focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Short Code (Prefix)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GNDEC"
                    value={newTenant.short_code}
                    onChange={e => setNewTenant({ ...newTenant, short_code: e.target.value.toUpperCase() })}
                    className="w-full h-9 px-3 bg-slate-50 border rounded-lg text-xs font-mono uppercase focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Entity Type</label>
                  <select
                    value={newTenant.entity_type}
                    onChange={e => setNewTenant({ ...newTenant, entity_type: e.target.value as any })}
                    className="w-full h-9 px-3 bg-slate-50 border rounded-lg text-xs focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                  >
                    <option value="college">College / Institute</option>
                    <option value="university">University</option>
                    <option value="school">School / Academy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subdomain</label>
                <input
                  type="text"
                  placeholder="e.g. gndec.gurudotcom"
                  value={newTenant.subdomain}
                  onChange={e => setNewTenant({ ...newTenant, subdomain: e.target.value })}
                  className="w-full h-9 px-3 bg-slate-50 border rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Dr. Harpreet Singh"
                    value={newTenant.contact_person}
                    onChange={e => setNewTenant({ ...newTenant, contact_person: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 border rounded-lg text-xs focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={newTenant.contact_phone}
                    onChange={e => setNewTenant({ ...newTenant, contact_phone: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 border rounded-lg text-xs focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#00236f] hover:bg-[#001b54] text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Provisioning...' : 'Provision Institution & Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
