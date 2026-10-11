import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Shield, Check, X, AlertCircle, Save, RefreshCw, Lock, Eye, Edit3 } from 'lucide-react';

interface FieldPermissionRule {
  id: string;
  entity_type: 'student' | 'staff';
  field_key: string;
  field_label: string;
  category: string;
  admin_view: boolean;
  admin_edit: boolean;
  staff_view: boolean;
  staff_edit: boolean;
  student_view: boolean;
  student_edit: boolean;
  updated_at: string;
}

export const FieldPermissionsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'student' | 'staff'>('student');
  const [permissions, setPermissions] = useState<FieldPermissionRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    loadPermissions();
  }, [activeTab]);

  const loadPermissions = async () => {
    setIsLoading(true);
    try {
      const res = await api.getFieldPermissions(activeTab);
      if (res.success) {
        setPermissions(res.permissions || []);
      }
    } catch (err) {
      console.error('Failed to load field permissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (permId: string, role: 'staff' | 'student' | 'admin', type: 'view' | 'edit') => {
    const perm = permissions.find(p => p.id === permId);
    if (!perm) return;

    let updates: Partial<FieldPermissionRule> = {};

    if (role === 'staff') {
      if (type === 'view') {
        const nextView = !perm.staff_view;
        updates.staff_view = nextView;
        // Karanvir Sir Rule: If View is unchecked, Edit must be false!
        if (!nextView) updates.staff_edit = false;
      } else {
        // Can only edit if view is true
        if (!perm.staff_view) return;
        updates.staff_edit = !perm.staff_edit;
      }
    } else if (role === 'student') {
      if (type === 'view') {
        const nextView = !perm.student_view;
        updates.student_view = nextView;
        if (!nextView) updates.student_edit = false;
      } else {
        if (!perm.student_view) return;
        updates.student_edit = !perm.student_edit;
      }
    } else if (role === 'admin') {
      if (type === 'edit') {
        updates.admin_edit = !perm.admin_edit;
      }
    }

    try {
      const res = await api.updateFieldPermission(permId, updates);
      if (res.success) {
        setPermissions(prev => prev.map(p => p.id === permId ? res.permission : p));
        setSaveStatus(`Saved rule for ${perm.field_label}`);
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (err: any) {
      alert('Error updating permission: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Shield className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">Granular Field-Level Permissions (RBAC)</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30 font-semibold">
                Lecture 3 Governance
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Control individual data visibility and editability across Student and Staff dossiers. Disabling View automatically locks and disables Edit.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('student')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'student'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Student Dossier Fields
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'staff'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Staff HRMS Fields
            </button>
            <button
              onClick={loadPermissions}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {saveStatus && (
          <div className="mt-4 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            {saveStatus}
          </div>
        )}
      </div>

      {/* Permissions Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>DATA ATTRIBUTE & CATEGORY</span>
          <div className="flex items-center gap-8 mr-4">
            <span className="w-24 text-center">CAMPUS ADMIN</span>
            <span className="w-36 text-center">FACULTY / STAFF ROLE</span>
            <span className="w-36 text-center">STUDENT PORTAL</span>
          </div>
        </div>

        <div className="divide-y divide-slate-800/80">
          {permissions.map(rule => (
            <div key={rule.id} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{rule.field_label}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {rule.field_key}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{rule.category}</span>
              </div>

              <div className="flex items-center gap-8 mr-4">
                {/* Admin Role (Always Views; Can toggle edit) */}
                <div className="w-24 flex items-center justify-center gap-2">
                  <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono px-1.5" title="Admin Always Views">
                    VIEW
                  </span>
                  <button
                    onClick={() => handleToggle(rule.id, 'admin', 'edit')}
                    className={`p-1.5 rounded-lg border text-xs transition-colors ${
                      rule.admin_edit
                        ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                    title="Toggle Admin Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Faculty / Staff Role (View & Edit) */}
                <div className="w-36 flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleToggle(rule.id, 'staff', 'view')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs transition-all ${
                      rule.staff_view
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span className="text-[11px] font-medium">View</span>
                  </button>

                  <button
                    disabled={!rule.staff_view}
                    onClick={() => handleToggle(rule.id, 'staff', 'edit')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs transition-all ${
                      !rule.staff_view
                        ? 'opacity-30 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-600'
                        : rule.staff_edit
                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                    title={!rule.staff_view ? 'Cannot enable edit when view is disabled' : 'Toggle Edit'}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span className="text-[11px] font-medium">Edit</span>
                  </button>
                </div>

                {/* Student Portal (View & Edit) */}
                <div className="w-36 flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleToggle(rule.id, 'student', 'view')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs transition-all ${
                      rule.student_view
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span className="text-[11px] font-medium">View</span>
                  </button>

                  <button
                    disabled={!rule.student_view}
                    onClick={() => handleToggle(rule.id, 'student', 'edit')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs transition-all ${
                      !rule.student_view
                        ? 'opacity-30 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-600'
                        : rule.student_edit
                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                    title={!rule.student_view ? 'Cannot enable edit when view is disabled' : 'Toggle Edit'}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span className="text-[11px] font-medium">Edit</span>
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
