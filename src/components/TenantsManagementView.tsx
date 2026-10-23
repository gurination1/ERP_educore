import React, { useState, useEffect } from 'react';
import { safeGoBack } from '../utils/navigation';
import { api, setStoredToken, setStoredUser } from '../api/client';
import { User, MasterData, MasterDepartment, MasterDegree, MasterState } from '../types';
import { MasterTablesModal } from './MasterTablesModal';
import { Building2, Plus, Check, Layers, ShieldCheck, ArrowRight } from 'lucide-react';

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
  const [masterData, setMasterData] = useState<MasterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<'all' | 'college' | 'school' | 'department'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ZERO POPUP INLINE TABS
  const [activeTab, setActiveTab] = useState<'list' | 'onboard' | 'masters'>('list');
  const [newTenant, setNewTenant] = useState({
    client_name: '',
    short_code: '',
    entity_type: 'college' as 'college' | 'school' | 'department' | 'university',
    state_code: '03',
    institution_type_code: 'ENG_COLLEGE',
    city: 'Bathinda',
    subdomain: '',
    admin_username: '',
    admin_email: '',
    admin_password: 'admin123',
    contact_person: '',
    contact_phone: '',
    subscription_tier: 'enterprise' as 'standard' | 'premium' | 'enterprise',
    selected_departments: ['CSE', 'ME', 'CE', 'ECE'],
    selected_degrees: ['BTECH_CSE', 'BTECH_ME', 'MBA'],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline Master Table Quick Add in Onboarding Modal (Senior Mentor Karanvir Sir Lecture 3 & 4)
  const [showAddDeptInline, setShowAddDeptInline] = useState(false);
  const [newDeptForm, setNewDeptForm] = useState({ dept_code: '', dept_name: '', head_of_dept: '' });

  const [showAddDegreeInline, setShowAddDegreeInline] = useState(false);
  const [newDegreeForm, setNewDegreeForm] = useState({ degree_code: '', degree_name: '', total_semesters: 8, statutory_body: 'AICTE' });

  const [showAddStateInline, setShowAddStateInline] = useState(false);
  const [newStateForm, setNewStateForm] = useState({ gst_code: '', state_name: '', state_short_code: '' });

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    setIsLoading(true);
    try {
      const [tenantsRes, masterRes] = await Promise.all([
        api.getTenants(),
        api.getMasterData().catch(() => ({ success: false, data: null })),
      ]);
      if (tenantsRes.success && Array.isArray(tenantsRes.tenants)) {
        setTenants(tenantsRes.tenants);
      } else {
        setFeedback({ type: 'error', message: tenantsRes.error || 'Failed to load tenants directory' });
      }
      if (masterRes && (masterRes.data || (masterRes as any).states)) {
        setMasterData((masterRes.data || masterRes) as MasterData);
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
        setStoredToken(res.token);
        setStoredUser(res.user);
        
        setFeedback({
          type: 'success',
          message: `Directly Impersonated as Institutional Admin for ${tenant.client_name}. Launching dashboard...`,
        });

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

  const handleInlineAddDepartment = async () => {
    if (!newDeptForm.dept_code.trim() || !newDeptForm.dept_name.trim()) return;
    try {
      const res = await api.addMasterDepartment({
        dept_code: newDeptForm.dept_code.trim().toUpperCase(),
        dept_name: newDeptForm.dept_name.trim(),
        head_of_dept: newDeptForm.head_of_dept.trim(),
      });
      if (res.success) {
        const code = newDeptForm.dept_code.trim().toUpperCase();
        const newDeptItem: MasterDepartment = {
          id: `dept-${Date.now()}`,
          dept_code: code,
          dept_name: newDeptForm.dept_name.trim(),
          head_of_dept: newDeptForm.head_of_dept.trim(),
          tags: ['Engineering'],
          is_active: true,
        };
        setMasterData(prev => prev ? {
          ...prev,
          departments: [...(prev.departments || []), newDeptItem]
        } : prev);
        setNewTenant(prev => ({
          ...prev,
          selected_departments: [...(prev.selected_departments || []), code]
        }));
        setNewDeptForm({ dept_code: '', dept_name: '', head_of_dept: '' });
        setShowAddDeptInline(false);
        setFeedback({ type: 'success', message: `Master Department ${code} created in database and added to college profile!` });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleInlineAddDegree = async () => {
    if (!newDegreeForm.degree_code.trim() || !newDegreeForm.degree_name.trim()) return;
    try {
      const res = await api.addMasterDegree({
        degree_code: newDegreeForm.degree_code.trim().toUpperCase(),
        degree_name: newDegreeForm.degree_name.trim(),
        total_semesters: Number(newDegreeForm.total_semesters) || 8,
        statutory_body: newDegreeForm.statutory_body || 'AICTE',
      });
      if (res.success) {
        const code = newDegreeForm.degree_code.trim().toUpperCase();
        const newDegItem: MasterDegree = {
          degree_code: code,
          degree_name: newDegreeForm.degree_name.trim(),
          total_semesters: Number(newDegreeForm.total_semesters) || 8,
          duration_years: Math.round((Number(newDegreeForm.total_semesters) || 8) / 2),
          statutory_body: (newDegreeForm.statutory_body as any) || 'AICTE',
          level: (Number(newDegreeForm.total_semesters) || 8) <= 4 ? 'postgraduate' : 'undergraduate',
        };
        setMasterData(prev => prev ? {
          ...prev,
          degrees: [...(prev.degrees || []), newDegItem]
        } : prev);
        setNewTenant(prev => ({
          ...prev,
          selected_degrees: [...(prev.selected_degrees || []), code]
        }));
        setNewDegreeForm({ degree_code: '', degree_name: '', total_semesters: 8, statutory_body: 'AICTE' });
        setShowAddDegreeInline(false);
        setFeedback({ type: 'success', message: `Master Degree ${code} created in database and added to college profile!` });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleInlineAddState = async () => {
    if (!newStateForm.gst_code.trim() || !newStateForm.state_name.trim()) return;
    try {
      const res = await api.addMasterState({
        gst_code: newStateForm.gst_code.trim(),
        state_name: newStateForm.state_name.trim(),
        state_short_code: (newStateForm.state_short_code || newStateForm.gst_code).trim().toUpperCase(),
      });
      if (res.success) {
        const code = newStateForm.gst_code.trim();
        const newStateItem: MasterState = {
          gst_code: code,
          state_name: newStateForm.state_name.trim(),
          state_short_code: (newStateForm.state_short_code || newStateForm.gst_code).trim().toUpperCase(),
          is_union_territory: false,
        };
        setMasterData(prev => prev ? {
          ...prev,
          states: [...(prev.states || []), newStateItem]
        } : prev);
        setNewTenant(prev => ({
          ...prev,
          state_code: code
        }));
        setNewStateForm({ gst_code: '', state_name: '', state_short_code: '' });
        setShowAddStateInline(false);
        setFeedback({ type: 'success', message: `GST State Code ${code} created in database and selected!` });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
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
        admin_password: newTenant.admin_password || 'admin123',
      };

      const res = await api.createTenant(payload);
      if (res.success && res.tenant) {
        await api.createCampus({
          tenant_id: res.tenant.id || `ten-${Date.now()}`,
          campus_code: `${newTenant.short_code}01`,
          campus_name: `${newTenant.client_name} (Main Campus)`,
          city: newTenant.city || 'Punjab',
          state_code: newTenant.state_code || '03',
          is_main: true,
        }).catch(() => null);

        setTenants(prev => [res.tenant, ...prev]);
        setActiveTab('list');
        setFeedback({
          type: 'success',
          message: `Collegiate Client ${newTenant.client_name} successfully provisioned with ${newTenant.selected_departments.length} departments, ${newTenant.selected_degrees.length} degrees, and dedicated database tenant!`,
        });
        setNewTenant({
          client_name: '',
          short_code: '',
          entity_type: 'college',
          state_code: '03',
          institution_type_code: 'ENG_COLLEGE',
          city: 'Bathinda',
          subdomain: '',
          admin_username: '',
          admin_email: '',
          admin_password: 'admin123',
          contact_person: '',
          contact_phone: '',
          subscription_tier: 'enterprise',
          selected_departments: ['CSE', 'ME', 'CE', 'ECE'],
          selected_degrees: ['BTECH_CSE', 'BTECH_ME', 'MBA'],
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
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (t.client_name || '').toLowerCase().includes(q) ||
      (t.short_code || '').toLowerCase().includes(q) ||
      (t.subdomain || '').toLowerCase().includes(q) ||
      (t.db_name || '').toLowerCase().includes(q);

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

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`h-8 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-white text-[#00236f] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Colleges Registry ({tenants.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('onboard')}
              className={`h-8 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'onboard'
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Provision College</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('masters')}
              className={`h-8 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'masters'
                  ? 'bg-white text-[#00236f] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Master Tables</span>
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

      {/* Filter and Search Bar & Table (When Tab === 'list') */}
      {activeTab === 'list' && (
        <>
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
      </>
      )}

      {/* Provision New Client Workspace (Full-Width Inline Form - Zero Popups!) */}
      {activeTab === 'onboard' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/90 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#00236f] flex items-center justify-center font-black">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#00236f] tracking-tight">Onboard New Collegiate Institution (Inline Canvas)</h3>
                <p className="text-[11px] text-slate-500">Provision dedicated tenant database schema, master tables, and administrative access directly on canvas</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Back to Directory
            </button>
          </div>

          <form onSubmit={handleCreateTenant} className="space-y-4">
              {/* SECTION 1: Institutional Identity */}
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <span className="w-5 h-5 rounded-full bg-[#00236f] text-white flex items-center justify-center text-[10px]">1</span>
                  Institutional Identity & Domain Scope
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Institution Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Guru Nanak Dev Engineering College"
                    value={newTenant.client_name}
                    onChange={e => setNewTenant({ ...newTenant, client_name: e.target.value })}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Prefix / Short Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GNDEC"
                      value={newTenant.short_code}
                      onChange={e => setNewTenant({ ...newTenant, short_code: e.target.value.toUpperCase() })}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-mono uppercase font-bold focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Entity Category</label>
                    <select
                      value={newTenant.entity_type}
                      onChange={e => setNewTenant({ ...newTenant, entity_type: e.target.value as any })}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                    >
                      <option value="college">College / Institute</option>
                      <option value="university">University Campus</option>
                      <option value="school">Polytechnic / School</option>
                      <option value="department">Autonomous Faculty</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City / Region</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ludhiana"
                      value={newTenant.city}
                      onChange={e => setNewTenant({ ...newTenant, city: e.target.value })}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">SaaS Subdomain</label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        placeholder="e.g. gndec"
                        value={newTenant.subdomain}
                        onChange={e => setNewTenant({ ...newTenant, subdomain: e.target.value.toLowerCase() })}
                        className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-500 font-mono pl-2 shrink-0">.gurudotcom</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person (Registrar / Dean)</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. H.S. Rai"
                      value={newTenant.contact_person}
                      onChange={e => setNewTenant({ ...newTenant, contact_person: e.target.value })}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Master Tables Provisioning */}
              <div className="bg-blue-50/40 p-3.5 rounded-xl border border-blue-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#00236f]">
                    <span className="w-5 h-5 rounded-full bg-[#00236f] text-white flex items-center justify-center text-[10px]">2</span>
                    Master Tables Configuration & Regulatory Setup
                  </div>
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-100/80 px-2 py-0.5 rounded-md">
                    Dynamic Master Data
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">GST State Code *</label>
                      <button
                        type="button"
                        onClick={() => setShowAddStateInline(!showAddStateInline)}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        {showAddStateInline ? 'Close Form' : '+ New State'}
                      </button>
                    </div>
                    <select
                      value={newTenant.state_code}
                      onChange={e => setNewTenant({ ...newTenant, state_code: e.target.value })}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                    >
                      {masterData?.states && masterData.states.length > 0 ? (
                        masterData.states.map(s => {
                          const code = s.gst_code || (s as any).code;
                          const name = s.state_name || (s as any).name;
                          const short = s.state_short_code || (s as any).zone || 'Region';
                          return (
                            <option key={code} value={code}>
                              {code} - {name} ({short})
                            </option>
                          );
                        })
                      ) : (
                        <>
                          <option value="03">03 - Punjab (North)</option>
                          <option value="06">06 - Haryana (North)</option>
                          <option value="07">07 - Delhi (North)</option>
                          <option value="08">08 - Rajasthan (North)</option>
                          <option value="02">02 - Himachal Pradesh (North)</option>
                          <option value="01">01 - Jammu & Kashmir (North)</option>
                          <option value="09">09 - Uttar Pradesh (North)</option>
                          <option value="27">27 - Maharashtra (West)</option>
                        </>
                      )}
                    </select>

                    {/* Inline Quick Add State Form */}
                    {showAddStateInline && (
                      <div className="mt-2 p-2.5 bg-white border border-blue-200 rounded-lg space-y-2 animate-fadeIn shadow-2xs">
                        <div className="text-[10px] font-bold text-[#00236f]">Add New GST State Code to Master DB:</div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="GST Code (e.g. 19)"
                            value={newStateForm.gst_code}
                            onChange={e => setNewStateForm({ ...newStateForm, gst_code: e.target.value })}
                            className="h-7 px-2 text-[11px] border rounded bg-slate-50"
                          />
                          <input
                            type="text"
                            placeholder="State Name (e.g. West Bengal)"
                            value={newStateForm.state_name}
                            onChange={e => setNewStateForm({ ...newStateForm, state_name: e.target.value })}
                            className="h-7 px-2 text-[11px] border rounded bg-slate-50"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleInlineAddState}
                          className="w-full py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold cursor-pointer"
                        >
                          Save State & Select
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Institution Type & Regulatory Body</label>
                    <select
                      value={newTenant.institution_type_code}
                      onChange={e => setNewTenant({ ...newTenant, institution_type_code: e.target.value })}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                    >
                      {masterData?.institutionTypes && masterData.institutionTypes.length > 0 ? (
                        masterData.institutionTypes.map(it => (
                          <option key={it.code} value={it.code}>
                            {it.name} ({it.regulatory_authority || (it as any).regulatory_body || 'Statutory'})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="ENG_COLLEGE">Engineering College (AICTE / PTU)</option>
                          <option value="MED_COLLEGE">Medical & Allied Sciences (NMC)</option>
                          <option value="PHARMACY_INST">Pharmacy Institute (PCI)</option>
                          <option value="MGMT_INST">Management Institute (AICTE)</option>
                          <option value="POLYTECHNIC">Polytechnic / Diploma (PSBTE)</option>
                          <option value="UNIV_CAMPUS">University Main Campus (UGC)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Master Academic Departments Provisioning */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700">Provision Master Departments</label>
                      <span className="text-[10px] text-slate-500">Toggle departments to be activated for this collegiate instance</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddDeptInline(!showAddDeptInline)}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      {showAddDeptInline ? 'Close Form' : '+ Add Master Department'}
                    </button>
                  </div>

                  {showAddDeptInline && (
                    <div className="mb-2.5 p-2.5 bg-white border border-blue-200 rounded-lg space-y-2 animate-fadeIn shadow-2xs">
                      <div className="text-[10px] font-bold text-[#00236f]">Add New Master Department into Platform DB:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Dept Code (e.g. AIML)"
                          value={newDeptForm.dept_code}
                          onChange={e => setNewDeptForm({ ...newDeptForm, dept_code: e.target.value.toUpperCase() })}
                          className="h-7 px-2 text-[11px] border rounded bg-slate-50 font-mono"
                        />
                        <input
                          type="text"
                          placeholder="Dept Name (e.g. AI & Machine Learning)"
                          value={newDeptForm.dept_name}
                          onChange={e => setNewDeptForm({ ...newDeptForm, dept_name: e.target.value })}
                          className="h-7 px-2 text-[11px] border rounded bg-slate-50"
                        />
                        <input
                          type="text"
                          placeholder="HOD Name (Optional)"
                          value={newDeptForm.head_of_dept}
                          onChange={e => setNewDeptForm({ ...newDeptForm, head_of_dept: e.target.value })}
                          className="h-7 px-2 text-[11px] border rounded bg-slate-50"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleInlineAddDepartment}
                        className="w-full py-1 bg-[#00236f] hover:bg-[#001b54] text-white rounded text-[11px] font-bold cursor-pointer"
                      >
                        Create Master Department & Include in College
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-slate-200 rounded-lg max-h-36 overflow-y-auto">
                    {(masterData?.departments && masterData.departments.length > 0 ? masterData.departments : [
                      { dept_code: 'CSE', dept_name: 'Computer Science & Engineering' },
                      { dept_code: 'ME', dept_name: 'Mechanical Engineering' },
                      { dept_code: 'CE', dept_name: 'Civil Engineering' },
                      { dept_code: 'ECE', dept_name: 'Electronics & Communication' },
                      { dept_code: 'EE', dept_name: 'Electrical Engineering' },
                      { dept_code: 'MBA', dept_name: 'Business Administration' },
                      { dept_code: 'MCA', dept_name: 'Computer Applications' },
                      { dept_code: 'PHARM', dept_name: 'Pharmaceutical Sciences' },
                      { dept_code: 'AGRI', dept_name: 'Agricultural Sciences' },
                    ]).map(dept => {
                      const code = dept.dept_code || (dept as any).code;
                      const name = dept.dept_name || (dept as any).name;
                      const isSelected = newTenant.selected_departments?.includes(code);
                      return (
                        <button
                          type="button"
                          key={code}
                          onClick={() => {
                            const current = newTenant.selected_departments || [];
                            const updated = isSelected
                              ? current.filter(c => c !== code)
                              : [...current, code];
                            setNewTenant({ ...newTenant, selected_departments: updated });
                          }}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-[#00236f] text-white shadow-xs'
                              : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                          <span>{code}</span>
                          <span className="text-[9px] opacity-75 font-normal hidden sm:inline">({name})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Master Degrees Provisioning */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700">Provision Master Degrees & Ordinances</label>
                      <span className="text-[10px] text-slate-500">Select academic degree streams offered at this institution</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddDegreeInline(!showAddDegreeInline)}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      {showAddDegreeInline ? 'Close Form' : '+ Add Master Degree'}
                    </button>
                  </div>

                  {showAddDegreeInline && (
                    <div className="mb-2.5 p-2.5 bg-white border border-blue-200 rounded-lg space-y-2 animate-fadeIn shadow-2xs">
                      <div className="text-[10px] font-bold text-[#00236f]">Add New Master Degree to Platform Registry:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <input
                          type="text"
                          placeholder="Code (e.g. BCA)"
                          value={newDegreeForm.degree_code}
                          onChange={e => setNewDegreeForm({ ...newDegreeForm, degree_code: e.target.value.toUpperCase() })}
                          className="h-7 px-2 text-[11px] border rounded bg-slate-50 font-mono"
                        />
                        <input
                          type="text"
                          placeholder="Degree Title (e.g. Bachelor of Computer Apps)"
                          value={newDegreeForm.degree_name}
                          onChange={e => setNewDegreeForm({ ...newDegreeForm, degree_name: e.target.value })}
                          className="h-7 px-2 text-[11px] border rounded bg-slate-50"
                        />
                        <select
                          value={newDegreeForm.total_semesters}
                          onChange={e => setNewDegreeForm({ ...newDegreeForm, total_semesters: Number(e.target.value) })}
                          className="h-7 px-2 text-[11px] border rounded bg-slate-50"
                        >
                          <option value={4}>4 Semesters (2 Yrs)</option>
                          <option value={6}>6 Semesters (3 Yrs)</option>
                          <option value={8}>8 Semesters (4 Yrs)</option>
                          <option value={10}>10 Semesters (5 Yrs)</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Body (e.g. UGC / AICTE)"
                          value={newDegreeForm.statutory_body}
                          onChange={e => setNewDegreeForm({ ...newDegreeForm, statutory_body: e.target.value })}
                          className="h-7 px-2 text-[11px] border rounded bg-slate-50"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleInlineAddDegree}
                        className="w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                      >
                        Create Master Degree & Include in College
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-slate-200 rounded-lg max-h-36 overflow-y-auto">
                    {(masterData?.degrees && masterData.degrees.length > 0 ? masterData.degrees : [
                      { degree_code: 'BTECH_CSE', degree_name: 'B.Tech (CSE)', total_semesters: 8 },
                      { degree_code: 'BTECH_ME', degree_name: 'B.Tech (ME)', total_semesters: 8 },
                      { degree_code: 'MTECH_CSE', degree_name: 'M.Tech (CSE)', total_semesters: 4 },
                      { degree_code: 'MBA', degree_name: 'Master of Business Administration', total_semesters: 4 },
                      { degree_code: 'BCA', degree_name: 'Bachelor of Computer Applications', total_semesters: 6 },
                      { degree_code: 'MCA', degree_name: 'Master of Computer Applications', total_semesters: 4 },
                      { degree_code: 'BSC_PHY', degree_name: 'B.Sc (Physics)', total_semesters: 6 },
                      { degree_code: 'BCA-AI', degree_name: 'BCA (AI & Cloud)', total_semesters: 6 },
                    ]).map(deg => {
                      const code = deg.degree_code || (deg as any).code;
                      const name = deg.degree_name || (deg as any).name;
                      const sems = deg.total_semesters || (deg as any).sems || 8;
                      const isSelected = newTenant.selected_degrees?.includes(code);
                      return (
                        <button
                          type="button"
                          key={code}
                          onClick={() => {
                            const current = newTenant.selected_degrees || [];
                            const updated = isSelected
                              ? current.filter(c => c !== code)
                              : [...current, code];
                            setNewTenant({ ...newTenant, selected_degrees: updated });
                          }}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-emerald-200" />}
                          <span>{code}</span>
                          <span className="text-[9px] opacity-75 font-normal hidden sm:inline">({sems} Sems)</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 3: Administrative Access & Security */}
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <span className="w-5 h-5 rounded-full bg-[#00236f] text-white flex items-center justify-center text-[10px]">3</span>
                  Root Institutional Administrator Account
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Admin Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@college.edu.in"
                      value={newTenant.admin_email}
                      onChange={e => setNewTenant({ ...newTenant, admin_email: e.target.value })}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Admin Username</label>
                    <input
                      type="text"
                      placeholder="e.g. admin_gndec"
                      value={newTenant.admin_username}
                      onChange={e => setNewTenant({ ...newTenant, admin_username: e.target.value })}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={newTenant.admin_password}
                      onChange={e => setNewTenant({ ...newTenant, admin_password: e.target.value })}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg text-[11px] text-[#00236f] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#00236f] shrink-0" />
                  <span>
                    <strong>Universal Super Admin Bypass:</strong> Super Admin has instant one-click impersonation authorization for all institutional databases without entering password.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#00236f] hover:bg-[#001b54] text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Provisioning Database & Master Tables...' : 'Provision Institution & Database Engine'}
                </button>
              </div>
            </form>
          </div>
      )}

      {/* Master Relational Architecture Workspace (Full-Width Inline Table - Zero Popups!) */}
      {activeTab === 'masters' && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/90 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b pb-2.5">
            <div>
              <h3 className="text-base font-extrabold text-[#00236f] tracking-tight">
                Tenant-Agnostic Master Relational System (Zero Popups)
              </h3>
              <p className="text-[11px] text-slate-500">
                View, audit, and configure canonical master schemas (States, Departments, Degrees, Document Types, Hostel, Fee Heads)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Back to Directory
            </button>
          </div>

          <MasterTablesModal
            isOpen={true}
            isEmbeddedView={true}
            onClose={() => setActiveTab('list')}
          />
        </div>
      )}
    </div>
  );
};
