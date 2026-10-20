import React, { useState, useEffect } from 'react';
import { api, setStoredToken, setStoredUser } from '../api/client';
import { User, ActiveScreen, MasterData, MasterDepartment, MasterDegree, MasterState } from '../types';
import { Settings, Sparkles, Building2, CheckCircle2, Plus, Check, ChevronDown, Layers, GraduationCap, X, AlertCircle } from 'lucide-react';

interface SuperAdminDashboardViewProps {
  currentUser?: User | null;
  onNavigate: (screen: ActiveScreen) => void;
  onOpenMasterTables?: (tab?: any) => void;
  onOpenAuditLogs?: () => void;
  selectedCampus?: 'campus_01' | 'campus_02' | 'all';
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
  selectedCampus,
}) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [masterData, setMasterData] = useState<MasterData | null>(null);
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
    selected_degrees: ['B.Tech', 'M.Tech', 'MBA'],
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
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tenantsRes, healthRes, masterRes] = await Promise.all([
        api.getTenants().catch(() => ({ success: false, tenants: [] })),
        fetch('/api/health').then(r => r.json()).catch(() => null),
        api.getMasterData().catch(() => ({ success: false, data: null })),
      ]);
      if (tenantsRes.success && Array.isArray(tenantsRes.tenants)) {
        setTenants(tenantsRes.tenants);
      }
      setDbHealth(healthRes);
      if (masterRes && (masterRes.data || (masterRes as any).states)) {
        setMasterData((masterRes.data || masterRes) as MasterData);
      }
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
    if (!newTenant.client_name || !newTenant.short_code) {
      setFeedback({ type: 'error', message: 'Client Name and Short Code are mandatory.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.createTenant({
        ...newTenant,
        client_id: `CL_${newTenant.short_code.toUpperCase()}`,
        subdomain: newTenant.subdomain || `${newTenant.short_code.toLowerCase()}.gurudotcom`,
        admin_username: newTenant.admin_username || `admin_${newTenant.short_code.toLowerCase()}`,
        admin_email: newTenant.admin_email || `admin@${newTenant.short_code.toLowerCase()}.edu`,
        admin_password: newTenant.admin_password || 'admin123',
      });
      if (res.success) {
        // Register newly provisioned institution's primary campus into campuses catalog
        await api.createCampus({
          tenant_id: res.tenant?.id || `ten-${Date.now()}`,
          campus_code: `${newTenant.short_code}01`,
          campus_name: `${newTenant.client_name} (Main Campus)`,
          city: newTenant.city || 'Punjab',
          state_code: newTenant.state_code || '03',
          is_main: true,
        }).catch(() => null);

        setFeedback({
          type: 'success',
          message: `Collegiate Client ${newTenant.client_name} successfully provisioned with ${newTenant.selected_departments.length} departments, ${newTenant.selected_degrees.length} degrees, and dedicated database tenant!`,
        });
        setIsAddModalOpen(false);
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
          selected_degrees: ['B.Tech', 'M.Tech', 'MBA'],
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
          {onOpenMasterTables && (
            <button
              type="button"
              onClick={() => onOpenMasterTables('institutions')}
              className="h-8 px-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-[#00236f] font-bold text-xs rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Master Tables & Architecture</span>
            </button>
          )}
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
        <div
          onClick={() => {
            const el = document.getElementById('tenants-table-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-white/95 backdrop-blur-xl border border-slate-200/80 hover:border-[#00236f]/60 rounded-2xl p-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] cursor-pointer transition-all hover:shadow-md group"
          title="Click to view all onboarded client institutions"
        >
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
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Subdomain routing: <strong className="text-slate-700">*.gurudotcom</strong></span>
            </span>
            <span className="text-slate-400 group-hover:text-[#00236f] text-xs font-bold transition-transform group-hover:translate-x-0.5">↓</span>
          </div>
        </div>

        {/* KPI 2: Multi-Tenant Database Health */}
        <div
          onClick={() => onNavigate('telemetry')}
          className="bg-white/95 backdrop-blur-xl border border-slate-200/80 hover:border-indigo-400 rounded-2xl p-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] cursor-pointer transition-all hover:shadow-md group"
          title="Click to inspect real-time database cluster telemetry & health"
        >
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
            <span className="text-slate-400 group-hover:text-indigo-600 text-xs font-bold transition-transform group-hover:translate-x-0.5">→</span>
          </div>
        </div>

        {/* KPI 3: Cross-Campus Scholar Census */}
        <div
          onClick={() => onNavigate('manage-students')}
          className="bg-white/95 backdrop-blur-xl border border-slate-200/80 hover:border-blue-400 rounded-2xl p-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] cursor-pointer transition-all hover:shadow-md group"
          title="Click to open cross-campus scholar directory and census"
        >
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
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Active cross-college user sessions: <strong className="text-slate-800">1,840</strong></span>
            <span className="text-slate-400 group-hover:text-blue-600 text-xs font-bold transition-transform group-hover:translate-x-0.5">→</span>
          </div>
        </div>

        {/* KPI 4: Platform Throughput & Security SLA */}
        <div
          onClick={onOpenAuditLogs}
          className="bg-white/95 backdrop-blur-xl border border-slate-200/80 hover:border-emerald-400 rounded-2xl p-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] cursor-pointer transition-all hover:shadow-md group"
          title="Click to inspect cryptographic audit trail & forensics"
        >
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
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Immutable audit events: <strong className="text-slate-800">4,289 logged</strong></span>
            <span className="text-slate-400 group-hover:text-emerald-600 text-xs font-bold transition-transform group-hover:translate-x-0.5">→</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Onboarded Colleges Table (8 cols) & Canonical Architecture Guide (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Onboarded Colleges & One-Click Impersonation (8 cols) */}
        <div id="tenants-table-section" className="lg:col-span-8 bg-white/95 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between">
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
                Example: <strong className="text-slate-800">4001-01-01-03-01</strong> = Principal of Main Institution (Campus 01, State 03)
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

      {/* Add New Tenant Modal (Karanvir Sir Lecture 3 & 4: Integrated Master Tables Provisioning) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#00236f] flex items-center justify-center font-black">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#00236f] tracking-tight">Onboard New Collegiate Institution</h3>
                  <p className="text-[11px] text-slate-500">Provision dedicated tenant database schema, master tables, and administrative access</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold transition"
              >
                ✕
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
                    <span className="text-[11px] text-slate-500 font-mono pl-2">.gurudotcom.erp</span>
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
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5"
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
                          className="w-full py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold"
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
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5"
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
                        className="w-full py-1 bg-[#00236f] hover:bg-[#001b54] text-white rounded text-[11px] font-bold"
                      >
                        Create Master Department & Include in College
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-slate-200 rounded-lg">
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
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5"
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
                        className="w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold"
                      >
                        Create Master Degree & Include in College
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-slate-200 rounded-lg">
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
                  Institutional Leadership & Admin Credentials
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Principal / Registrar Full Name</label>
                    <input
                      type="text"
                      placeholder="Dr. Harpreet Singh"
                      value={newTenant.contact_person}
                      onChange={e => setNewTenant({ ...newTenant, contact_person: e.target.value })}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={newTenant.contact_phone}
                      onChange={e => setNewTenant({ ...newTenant, contact_phone: e.target.value })}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Admin Username</label>
                    <input
                      type="text"
                      placeholder={`admin_${newTenant.short_code ? newTenant.short_code.toLowerCase() : 'gndec'}`}
                      value={newTenant.admin_username}
                      onChange={e => setNewTenant({ ...newTenant, admin_username: e.target.value })}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Admin Official Email *</label>
                    <input
                      type="email"
                      required
                      placeholder={`admin@${newTenant.short_code ? newTenant.short_code.toLowerCase() : 'gndec'}.edu`}
                      value={newTenant.admin_email}
                      onChange={e => setNewTenant({ ...newTenant, admin_email: e.target.value })}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password</label>
                    <input
                      type="text"
                      value={newTenant.admin_password}
                      onChange={e => setNewTenant({ ...newTenant, admin_password: e.target.value })}
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#00236f] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Database Infrastructure */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-200/80 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#00236f] block">Database Engine & Isolation:</span>
                  <span className="text-[11px] text-slate-600">
                    Allocating schema <strong className="font-mono text-indigo-900">db_{newTenant.short_code ? newTenant.short_code.toLowerCase() : 'new'}</strong> on PostgreSQL 18.6 Multi-Tenant Cluster with immutable audit stream.
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Isolated DB
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 border-t flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#00236f] hover:bg-[#001b54] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition disabled:opacity-50"
                >
                  <Building2 className="w-4 h-4" />
                  {isSubmitting ? 'Provisioning Database & Master Tables...' : 'Provision Institution & Database Engine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
