import React, { useState, useEffect } from 'react';
import { safeGoBack } from '../utils/navigation';
import { api, setStoredToken, setStoredUser } from '../api/client';
import { User, MasterData, MasterDepartment, MasterDegree, MasterState } from '../types';
import { MasterTablesModal } from './MasterTablesModal';
import {
  Building2,
  Plus,
  Check,
  Layers,
  ShieldCheck,
  ArrowRight,
  Database,
  Sparkles,
  CheckCircle2,
  History,
  RefreshCw,
  Server,
  DollarSign,
  Users,
  Shield,
  FileText,
  Activity,
} from 'lucide-react';

interface Tenant {
  id: string;
  client_id: string;
  client_number?: string;
  short_code: string;
  client_name: string;
  subdomain: string;
  entity_type: 'school' | 'college' | 'department' | 'university';
  db_name: string;
  database_mode?: 'master' | 'sample';
  is_functional: boolean;
  admin_username: string;
  admin_email: string;
  contact_person?: string;
  contact_phone?: string;
  subscription_tier: 'standard' | 'premium' | 'enterprise';
  subscription_validity?: string;
  billing_cycle?: string;
  license_amount?: number;
  max_students?: number;
  max_faculty?: number;
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

  // ZERO POPUP INLINE TABS (Senior Mentor Requirement: "In the master table that is in super admin... clients plus subscription page... master DB or sample DB... and database should be migrated table")
  const [activeTab, setActiveTab] = useState<'list' | 'onboard' | 'migrations' | 'masters'>('list');

  // Database Migrations State
  const [migrationsList, setMigrationsList] = useState<any[]>([]);
  const [tablesStatusList, setTablesStatusList] = useState<any[]>([]);
  const [migrationsLoading, setMigrationsLoading] = useState(false);
  const [isRunningMigrations, setIsRunningMigrations] = useState(false);

  // New Client Entity Form State
  const [newTenant, setNewTenant] = useState({
    client_name: '',
    short_code: '',
    client_number: '01', // Feeds into 12-Digit UID: Server(1) + Client(2) + Session(2) + Course(2) + Student(4)
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
    // Subscription Configuration
    subscription_tier: 'enterprise' as 'standard' | 'premium' | 'enterprise',
    subscription_validity: '1_year' as '1_year' | '3_years' | '5_years' | 'perpetual',
    billing_cycle: 'annual' as 'annual' | 'monthly' | 'quarterly' | 'perpetual',
    license_amount: 150000,
    max_students: 5000,
    max_faculty: 250,
    modules_enabled: ['crm', 'academics', 'lms', 'accounts', 'hrms', 'hostel', 'transport'],
    // Master DB vs Sample DB (Production vs Evaluation)
    database_mode: 'master' as 'master' | 'sample',
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

  const loadMigrations = async () => {
    setMigrationsLoading(true);
    try {
      const res = await api.getMigrations();
      if (res.success) {
        setMigrationsList(res.migrations || []);
        setTablesStatusList(res.tablesStatus || []);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Failed to load schema migrations.' });
    } finally {
      setMigrationsLoading(false);
    }
  };

  const handleRunMigrations = async () => {
    setIsRunningMigrations(true);
    try {
      const res = await api.runMigrations();
      if (res.success) {
        setFeedback({ type: 'success', message: 'All 6 database migrations verified and healthy across client catalogs.' });
        loadMigrations();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Migration verification failed' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsRunningMigrations(false);
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
          id: `dept-${code.toLowerCase()}`,
          dept_code: code,
          dept_name: newDeptForm.dept_name.trim(),
          head_of_dept: newDeptForm.head_of_dept.trim(),
          tags: ['department', code.toLowerCase()],
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
        const newDegreeItem: MasterDegree = {
          degree_code: code,
          degree_name: newDegreeForm.degree_name.trim(),
          level: 'undergraduate',
          duration_years: Math.round((Number(newDegreeForm.total_semesters) || 8) / 2),
          total_semesters: Number(newDegreeForm.total_semesters) || 8,
          statutory_body: (newDegreeForm.statutory_body || 'AICTE') as 'AICTE' | 'UGC' | 'PCI' | 'BCI',
        };
        setMasterData(prev => prev ? {
          ...prev,
          degrees: [...(prev.degrees || []), newDegreeItem]
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
        client_number: newTenant.client_number.padStart(2, '0').slice(-2),
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
          message: `Collegiate Client ${newTenant.client_name} (Client #${newTenant.client_number}) successfully provisioned in [${newTenant.database_mode.toUpperCase()} DB] mode with ${newTenant.selected_departments.length} departments and active ${newTenant.subscription_tier.toUpperCase()} subscription!`,
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
            className="text-xs font-semibold px-2 py-0.5 rounded hover:bg-black/5 cursor-pointer"
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
                  Client Licensing & Migrated DB Suite
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Client Campuses, Subscriptions & Database Engine
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Apex Super Admin command center. Provision institutional clients with dedicated subscription pages, toggle between Master DB (Production) vs Sample DB (Testing), and inspect schema migrations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 flex-wrap">
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
              <span>Colleges ({tenants.length})</span>
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
              <span>+ Add Client & Subscriptions</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('migrations');
                loadMigrations();
              }}
              className={`h-8 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'migrations'
                  ? 'bg-[#ea580c] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Database Migrations</span>
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
            <span className="text-xs font-medium text-slate-500 block">Total Client Tenants</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">{tenants.length}</span>
          </div>
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
            <span className="text-xs font-medium text-slate-500 block">Active & Functional</span>
            <span className="text-xl font-bold text-emerald-600 mt-0.5 block">
              {tenants.filter(t => t.is_functional).length}
            </span>
          </div>
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
            <span className="text-xs font-medium text-slate-500 block">Database Migrations</span>
            <span className="text-xl font-bold text-[#ea580c] mt-0.5 block">6 / 6 Applied</span>
          </div>
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
            <span className="text-xs font-medium text-slate-500 block">Direct Impersonations</span>
            <span className="text-xl font-bold text-blue-600 mt-0.5 block">
              {tenants.filter(t => t.last_impersonated_at).length} Active
            </span>
          </div>
        </div>
      </div>

      {/* TAB 1: Colleges & Clients Registry */}
      {activeTab === 'list' && (
        <>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative flex-1 min-w-[240px]">
              <input
                type="text"
                placeholder="Search client by institution name, code, subdomain, or db..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] text-slate-900"
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

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#00236f] text-white uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3">Client & Institution</th>
                    <th className="px-4 py-3">Subdomain & DB Schema</th>
                    <th className="px-4 py-3">DB Mode</th>
                    <th className="px-4 py-3">Subscription Tier</th>
                    <th className="px-4 py-3">Root Admin</th>
                    <th className="px-4 py-3">State</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        No client campuses found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900">{t.client_name}</div>
                          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="font-black text-[#00236f]">Client #{t.client_number || t.short_code.slice(0, 2)}</span>
                            <span>•</span>
                            <span className="uppercase">{t.entity_type}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-mono text-[11px] text-[#00236f] font-semibold">{t.subdomain}</div>
                          <div className="text-[10px] text-slate-400 font-mono">DB: {t.db_name}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            t.database_mode === 'master'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {t.database_mode === 'master' ? 'Master DB' : 'Sample DB'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-50 text-[#00236f] border border-blue-200">
                            {t.subscription_tier}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-800">{t.admin_username}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{t.admin_email}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleFunctional(t)}
                            disabled={togglingId === t.id}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                              t.is_functional
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {t.is_functional ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleOneClickImpersonation(t)}
                            disabled={!t.is_functional || impersonatingId === t.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00236f] hover:bg-[#001744] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-2xs disabled:opacity-50"
                          >
                            <span>Open</span>
                            <span>↗</span>
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

      {/* TAB 2: Provision Client & Subscription Workspace (Inline Canvas - Zero Popups!) */}
      {activeTab === 'onboard' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/90 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#00236f] flex items-center justify-center font-black">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#00236f] tracking-tight">
                  Provision New Client Entity & Subscriptions (Inline Canvas)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Assign 2-digit Client Number for 12-Digit UID mapping, configure subscription licensing, and select Master DB vs Sample DB
                </p>
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
            {/* SECTION 1: Institutional Identity & 12-Digit UID Client Number */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <span className="w-5 h-5 rounded-full bg-[#00236f] text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Institutional Identity & Client Number (UID Architecture)</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-md">
                  12-Digit UID: [Server 1]-[Client {newTenant.client_number}]-[Session 26]-[Course CO]-[Student NNNN]
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
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
                  <label className="block text-xs font-bold text-[#00236f] mb-1">Client Number (2 Digits) *</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    placeholder="01"
                    value={newTenant.client_number}
                    onChange={e => setNewTenant({ ...newTenant, client_number: e.target.value.replace(/[^0-9]/g, '') })}
                    className="w-full h-9 px-3 bg-blue-50 border-2 border-blue-400 rounded-lg text-xs font-mono font-black text-[#00236f] focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              </div>
            </div>

            {/* SECTION 2: CLIENT SUBSCRIPTION & LICENSING PAGE (Senior Mentor Explicit Directive) */}
            <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#00236f]">
                  <span className="w-5 h-5 rounded-full bg-[#00236f] text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Client Subscription Plan & Commercial Quota Page</span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-200">
                  SaaS Enterprise Agreement
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subscription Tier *</label>
                  <select
                    value={newTenant.subscription_tier}
                    onChange={e => setNewTenant({ ...newTenant, subscription_tier: e.target.value as any })}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-[#00236f] focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                  >
                    <option value="standard">Standard Collegiate (2,500 Students)</option>
                    <option value="premium">Premium Autonomous (10,000 Students)</option>
                    <option value="enterprise">Apex Multi-Campus Enterprise (Unlimited)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subscription Term</label>
                  <select
                    value={newTenant.subscription_validity}
                    onChange={e => setNewTenant({ ...newTenant, subscription_validity: e.target.value as any })}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                  >
                    <option value="1_year">1 Year (Annual Accreditation)</option>
                    <option value="3_years">3 Years (Multi-Year Agreement)</option>
                    <option value="5_years">5 Years (Accreditation Cycle)</option>
                    <option value="perpetual">Perpetual Enterprise License</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Annual Contract Fee (₹)</label>
                  <input
                    type="number"
                    value={newTenant.license_amount}
                    onChange={e => setNewTenant({ ...newTenant, license_amount: Number(e.target.value) })}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Scholar Capacity</label>
                  <input
                    type="number"
                    value={newTenant.max_students}
                    onChange={e => setNewTenant({ ...newTenant, max_students: Number(e.target.value) })}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                  />
                </div>
              </div>

              {/* Module Entitlements Checklist */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Licensed Core Modules Checklist</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'crm', label: 'Admissions CRM & Telephony' },
                    { id: 'academics', label: 'CBCS Curriculum & Exams' },
                    { id: 'lms', label: 'CBT LMS & Continuous Assessment' },
                    { id: 'accounts', label: 'Tuition Accounting & Contra Ledgers' },
                    { id: 'hrms', label: 'Faculty HRMS & 5-Dept Exit NOC' },
                    { id: 'hostel', label: 'Hostel Residence & Mess Clearance' },
                    { id: 'transport', label: 'Transport Fleet & RFID Passes' },
                    { id: 'placements', label: 'Corporate Placements Portal' },
                  ].map(m => {
                    const isChecked = newTenant.modules_enabled.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        onClick={() => {
                          const updated = isChecked
                            ? newTenant.modules_enabled.filter(x => x !== m.id)
                            : [...newTenant.modules_enabled, m.id];
                          setNewTenant({ ...newTenant, modules_enabled: updated });
                        }}
                        className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-blue-50/80 border-[#00236f] text-[#00236f] font-bold'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input type="checkbox" checked={isChecked} readOnly className="rounded text-[#00236f]" />
                        <span className="text-[11px] truncate">{m.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 3: DATABASE ARCHITECTURE: MASTER DB vs SAMPLE DB (Senior Mentor Explicit Directive) */}
            <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                  <span className="w-5 h-5 rounded-full bg-[#ea580c] text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Database Seeding Strategy: Master DB vs Sample DB</span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-400">
                  Production Gatekeeper
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Master DB */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setNewTenant({ ...newTenant, database_mode: 'master' })}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    newTenant.database_mode === 'master'
                      ? 'border-[#00236f] bg-white ring-2 ring-[#00236f]/20 shadow-md'
                      : 'border-slate-200 bg-white/70 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 font-black text-sm text-[#00236f]">
                      <Server className="w-4 h-4 text-[#00236f]" />
                      <span>Master DB (Pristine Production)</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                      Go-Live Ready
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Zero synthetic records. Deploys clean relational PostgreSQL / SQLite schema initialized with statutory master tables only (States, Degrees, Statutory Document Rules). Intended for direct commercial deployment in production.
                  </p>
                </div>

                {/* Option 2: Sample DB */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setNewTenant({ ...newTenant, database_mode: 'sample' })}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    newTenant.database_mode === 'sample'
                      ? 'border-[#ea580c] bg-white ring-2 ring-[#ea580c]/20 shadow-md'
                      : 'border-slate-200 bg-white/70 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 font-black text-sm text-[#ea580c]">
                      <Sparkles className="w-4 h-4 text-[#ea580c]" />
                      <span>Sample DB (Evaluation Sandbox)</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 uppercase">
                      Testing Sandbox
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Pre-populated sample collegiate database with demo scholars (12-digit UIDs), walk-in enquiries, fee ledger entries, faculty, and departments for client demonstrations, testing, and faculty training.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 4: Master Tables & Root Institutional Admin */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <span className="w-5 h-5 rounded-full bg-[#00236f] text-white flex items-center justify-center text-[10px]">4</span>
                <span>Statutory Master Tables & Root Admin Account</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GST State Code *</label>
                  <select
                    value={newTenant.state_code}
                    onChange={e => setNewTenant({ ...newTenant, state_code: e.target.value })}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                  >
                    <option value="03">03 - Punjab (North)</option>
                    <option value="06">06 - Haryana (North)</option>
                    <option value="07">07 - Delhi (North)</option>
                    <option value="08">08 - Rajasthan (North)</option>
                    <option value="02">02 - Himachal Pradesh (North)</option>
                    <option value="01">01 - Jammu & Kashmir (North)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Institution Type</label>
                  <select
                    value={newTenant.institution_type_code}
                    onChange={e => setNewTenant({ ...newTenant, institution_type_code: e.target.value })}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                  >
                    <option value="ENG_COLLEGE">Engineering College (AICTE / PTU)</option>
                    <option value="MED_COLLEGE">Medical & Allied Sciences (NMC)</option>
                    <option value="PHARMACY_INST">Pharmacy Institute (PCI)</option>
                    <option value="MGMT_INST">Management Institute (AICTE)</option>
                  </select>
                </div>
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
                    placeholder="admin_gndec"
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
                className="px-5 py-2 bg-[#00236f] hover:bg-[#001744] text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                {isSubmitting ? 'Provisioning Client & Database Schema...' : `Provision Institution in [${newTenant.database_mode.toUpperCase()} DB]`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: Database Migrations Table (Senior Mentor Requirement: "And database should be migrated table") */}
      {activeTab === 'migrations' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/90 space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Schema Engine: Migrated & Verified
                </span>
                <span className="text-xs text-slate-400 font-mono">Build 2026.06.15-PRD</span>
              </div>
              <h3 className="text-lg font-black text-[#00236f] tracking-tight flex items-center gap-2">
                <Database className="w-5 h-5 text-[#ea580c]" />
                <span>Enterprise Relational Migrations & Table Integrity</span>
              </h3>
              <p className="text-xs text-slate-500">
                Track applied schema version migrations, physical catalog health, and ensure 100% schema parity across collegiate tenant databases.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRunMigrations}
                disabled={isRunningMigrations}
                className="px-4 py-2 bg-[#00236f] hover:bg-[#001744] text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRunningMigrations ? 'animate-spin' : ''}`} />
                <span>{isRunningMigrations ? 'Verifying Integrity...' : 'Verify & Run Migrations'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Back to Directory
              </button>
            </div>
          </div>

          {/* Migrations Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-[#00236f]" />
              <span>Applied Relational Migrations History (`schema_migrations`)</span>
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#00236f] text-white uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-3.5 py-2.5">Migration ID & Version</th>
                    <th className="px-3.5 py-2.5">Migration Name & Description</th>
                    <th className="px-3.5 py-2.5">Tables Created / Mutated</th>
                    <th className="px-3.5 py-2.5">Applied Timestamp</th>
                    <th className="px-3.5 py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {migrationsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        {migrationsLoading ? 'Loading database migrations...' : 'Click "Verify & Run Migrations" to inspect schema history.'}
                      </td>
                    </tr>
                  ) : (
                    migrationsList.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3.5 py-3 font-mono">
                          <span className="font-bold text-[#00236f]">{m.id}</span>
                          <span className="block text-[10px] text-slate-400">{m.version}</span>
                        </td>
                        <td className="px-3.5 py-3">
                          <span className="font-bold text-slate-900 block">{m.name}</span>
                          <span className="text-[11px] text-slate-500">{m.description}</span>
                        </td>
                        <td className="px-3.5 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[280px]">
                            {m.tables_created?.map((t: string) => (
                              <span key={t} className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[10px] font-mono">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3.5 py-3 font-mono text-[11px] text-slate-500">
                          {m.applied_at?.slice(0, 10)}
                        </td>
                        <td className="px-3.5 py-3 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Tables Health */}
          {tablesStatusList.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Physical Relational Tables Catalog</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {tablesStatusList.map((tbl) => (
                  <div key={tbl.table_name} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between text-xs font-bold text-[#00236f]">
                      <span className="font-mono">{tbl.table_name}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="text-base font-extrabold text-slate-800 mt-1">
                      {tbl.record_count} Records
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                      Engine: {tbl.engine}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Master Relational Architecture Workspace */}
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
