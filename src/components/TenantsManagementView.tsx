import React, { useState, useEffect } from 'react';
import { safeGoBack } from '../utils/navigation';
import { api, setStoredToken, setStoredUser } from '../api/client';
import { User } from '../types';

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

interface TenantsManagementViewProps {
  currentUser?: User | null;
  onNavigate?: (screen: string) => void;
}

export const TenantsManagementView: React.FC<TenantsManagementViewProps> = ({ currentUser, onNavigate }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<'all' | 'college' | 'school' | 'department'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Add Tenant Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({
    client_name: '',
    short_code: '',
    entity_type: 'college' as 'college' | 'school' | 'department',
    subdomain: '',
    admin_username: '',
    admin_email: '',
    contact_person: '',
    contact_phone: '',
    subscription_tier: 'enterprise' as 'standard' | 'premium' | 'enterprise',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTenants();
      if (res.success && Array.isArray(res.tenants)) {
        setTenants(res.tenants);
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to load tenants directory' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFunctional = async (tenant: Tenant) => {
    setTogglingId(tenant.id);
    try {
      const res = await api.toggleTenantFunctional(tenant.id, !tenant.is_functional);
      if (res.success) {
        setTenants(prev =>
          prev.map(t => (t.id === tenant.id ? { ...t, is_functional: !t.is_functional } : t))
        );
        setFeedback({
          type: 'success',
          message: `${tenant.client_name} is now ${!tenant.is_functional ? 'Active & Operational' : 'Deactivated'}.`,
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to toggle status' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setTogglingId(null);
    }
  };

  // ONE-CLICK DIRECT IMPERSONATION ("Open" button)
  const handleOneClickImpersonation = async (tenant: Tenant) => {
    if (!tenant.is_functional) {
      setFeedback({
        type: 'error',
        message: `Cannot launch ${tenant.client_name}. Campus database is marked non-functional.`,
      });
      return;
    }

    setImpersonatingId(tenant.id);
    try {
      const res = await api.impersonateTenant(tenant.id);
      if (res.success && res.token && res.user) {
        // Save new authentication credentials
        setStoredToken(res.token);
        setStoredUser(res.user);
        
        setFeedback({
          type: 'success',
          message: `Directly Impersonated as Institutional Admin for ${tenant.client_name}. Launching dashboard...`,
        });

        // Launch directly into institutional admin dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 800);
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to impersonate tenant.' });
        setImpersonatingId(null);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
      setImpersonatingId(null);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.client_name || !newTenant.short_code || !newTenant.admin_email) {
      setFeedback({ type: 'error', message: 'Institution Name, Short Code, and Admin Email are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...newTenant,
        client_id: `CL_${newTenant.short_code.toUpperCase()}`,
        short_code: newTenant.short_code.toUpperCase(),
        subdomain: newTenant.subdomain || `${newTenant.short_code.toLowerCase()}.gurudotcom`,
        admin_username: newTenant.admin_username || `admin_${newTenant.short_code.toLowerCase()}`,
      };

      const res = await api.createTenant(payload);
      if (res.success && res.tenant) {
        setTenants(prev => [res.tenant, ...prev]);
        setIsAddModalOpen(false);
        setFeedback({
          type: 'success',
          message: `Tenant ${res.tenant.client_name} provisioned with PostgreSQL catalog ${res.tenant.db_name}.`,
        });
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
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to create tenant' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered tenants
  const filteredTenants = tenants.filter(t => {
    const matchesSearch =
      t.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.short_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.db_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesEntity = entityFilter === 'all' || t.entity_type === entityFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && t.is_functional) ||
      (statusFilter === 'inactive' && !t.is_functional);

    return matchesSearch && matchesEntity && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-sm transition-all text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold px-2 py-0.5 rounded hover:bg-black/5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => safeGoBack()}
              className="mt-1 w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition-all cursor-pointer border border-slate-200/80 shrink-0"
              title="Return to Previous Screen (Alt + ←)"
            >
              ‹
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                  PostgreSQL Multi-Tenant Provisioning
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Senior Mentor Architecture (Lecture 3)
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Client Campuses & Institutional Tenants
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Apex Super Admin tenant directory. Manage multi-college schemas, toggle operational state, and launch direct one-click impersonation sessions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00236f] hover:bg-[#001950] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Provision New Client</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
            <span className="text-xs font-medium text-slate-500 block">Total Tenants</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">{tenants.length}</span>
          </div>
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
            <span className="text-xs font-medium text-slate-500 block">Active & Functional</span>
            <span className="text-xl font-bold text-emerald-600 mt-0.5 block">
              {tenants.filter(t => t.is_functional).length}
            </span>
          </div>
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
            <span className="text-xs font-medium text-slate-500 block">PostgreSQL Catalogs</span>
            <span className="text-xl font-bold text-indigo-600 mt-0.5 block">{tenants.length}</span>
          </div>
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
            <span className="text-xs font-medium text-slate-500 block">Apex Impersonations</span>
            <span className="text-xl font-bold text-blue-600 mt-0.5 block">
              {tenants.filter(t => t.last_impersonated_at).length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by institution name, code, subdomain, or db..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00236f]/20"
          >
            <option value="all">All Entity Types</option>
            <option value="college">Colleges</option>
            <option value="school">Schools</option>
            <option value="department">Departments</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00236f]/20"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Client & Institution</th>
                <th className="px-4 py-3">Subdomain & URL</th>
                <th className="px-4 py-3">Entity Type</th>
                <th className="px-4 py-3">PostgreSQL DB</th>
                <th className="px-4 py-3">Operational State</th>
                <th className="px-4 py-3 text-right">Direct Impersonation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Loading PostgreSQL tenants directory...
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    No matching tenants found.
                  </td>
                </tr>
              ) : (
                filteredTenants.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#00236f]/10 text-[#00236f] font-bold text-xs flex items-center justify-center shrink-0 border border-[#00236f]/20">
                          {(t.short_code || t.client_id || 'TNT').slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{t.client_name}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2">
                            <span>ID: {t.client_id}</span>
                            <span>•</span>
                            <span>Code: {t.short_code}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-mono text-[11px] text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100/70 inline-block">
                        https://{t.subdomain}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          t.entity_type === 'school'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : t.entity_type === 'department'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {t.entity_type}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700">
                        <svg className="w-3.5 h-3.5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                        <span>{t.db_name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleFunctional(t)}
                          disabled={togglingId === t.id}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            t.is_functional ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              t.is_functional ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span
                          className={`text-[11px] font-semibold ${
                            t.is_functional ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {t.is_functional ? 'Functional' : 'Disabled'}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {/* Senior Mentor Lecture 3: One-Click Direct Impersonation "Open" button */}
                      <button
                        onClick={() => handleOneClickImpersonation(t)}
                        disabled={!t.is_functional || impersonatingId === t.id}
                        title={
                          t.is_functional
                            ? 'One-Click Direct Impersonation: Bypass login and open client console'
                            : 'Enable client to launch'
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs ${
                          t.is_functional
                            ? 'bg-[#00236f] hover:bg-[#001950] text-white hover:shadow-xs active:scale-95'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        }`}
                      >
                        {impersonatingId === t.id ? (
                          <span className="flex items-center gap-1">
                            <svg className="animate-spin h-3 w-3 text-white" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <span>Opening...</span>
                          </span>
                        ) : (
                          <>
                            <span>Open</span>
                            <span className="text-[13px] leading-none">↗</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision New Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Provision New Institutional Client</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Creates client entry & PostgreSQL isolated database catalog
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institution Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Khalsa College of Technology & Business"
                  value={newTenant.client_name}
                  onChange={e => {
                    const name = e.target.value;
                    const words = (name || '').split(' ').filter(Boolean).map(w => w[0] || '').join('').slice(0, 6).toUpperCase();
                    setNewTenant(prev => ({
                      ...prev,
                      client_name: name,
                      short_code: prev.short_code || words,
                      subdomain: prev.subdomain || `${words.toLowerCase()}.gurudotcom`,
                    }));
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Short Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KCTB"
                    value={newTenant.short_code}
                    onChange={e =>
                      setNewTenant(prev => ({
                        ...prev,
                        short_code: e.target.value.toUpperCase(),
                        subdomain: `${e.target.value.toLowerCase()}.gurudotcom`,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Entity Type (Level 1)
                  </label>
                  <select
                    value={newTenant.entity_type}
                    onChange={e => setNewTenant(prev => ({ ...prev, entity_type: e.target.value as any }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="college">Collegiate Institution</option>
                    <option value="school">Public / Private School</option>
                    <option value="department">Autonomous Department</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Subdomain
                  </label>
                  <input
                    type="text"
                    placeholder="kctb.gurudotcom"
                    value={newTenant.subdomain}
                    onChange={e => setNewTenant(prev => ({ ...prev, subdomain: e.target.value.toLowerCase() }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PostgreSQL DB Schema
                  </label>
                  <input
                    type="text"
                    disabled
                    value={newTenant.short_code ? `db_${newTenant.short_code.toLowerCase()}` : 'db_client'}
                    className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Admin Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@kctb.edu.in"
                    value={newTenant.admin_email}
                    onChange={e => setNewTenant(prev => ({ ...prev, admin_email: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="Principal / Registrar Name"
                    value={newTenant.contact_person}
                    onChange={e => setNewTenant(prev => ({ ...prev, contact_person: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                <span className="font-bold text-amber-700">⚡ Note:</span>
                <span>
                  Universal Super Admin one-click impersonation is enabled by default. Default admin credentials and statutory schema clones are provisioned automatically.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#00236f] hover:bg-[#001950] rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Provisioning...' : 'Provision Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
