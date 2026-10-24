import React from 'react';
import { User } from '../types';
import {
  X, Shield, User as UserIcon, Mail, Building, KeyRound, LogOut,
  Calendar, CheckCircle2, Award, Briefcase, GraduationCap, MapPin, Hash, Sparkles
} from 'lucide-react';

interface UserProfileModalProps {
  currentUser: User | null;
  displayUid: string;
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
  onResetPassword?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  displayUid,
  isOpen,
  onClose,
  onLogout,
  onResetPassword,
}) => {
  if (!isOpen || !currentUser) return null;

  const roleTitleMap: Record<string, string> = {
    super_admin: 'Universal Provost & SaaS Platform Operator',
    admin: 'Dean & Institutional Executive Administrator',
    staff: 'Assistant Professor & Faculty Mentor',
    hod: 'Head of Department (HOD & Academic Chair)',
    accounts: 'Bursar & Chief Financial Officer',
    counselor: 'Senior Admissions Lead Counselor',
    partner: 'Corporate Recruitment & Placement Partner',
    hr: 'Chief HR & Establishment Officer',
    hostel: 'Chief Hostel Warden & Residence Officer',
    student: 'Undergraduate Scholar & Degree Candidate',
  };

  const roleTitle = currentUser.designation || roleTitleMap[currentUser.role] || 'Campus Institutional Member';

  const cleanDigits = displayUid.replace(/[^0-9]/g, '');
  const is12Digit = cleanDigits.length === 12;
  const serverNode = is12Digit ? cleanDigits.slice(0, 2) : (cleanDigits.slice(0, 1) || '1');
  const clientCode = is12Digit ? cleanDigits.slice(2, 4) : (cleanDigits.slice(1, 3) || '01');
  const sessionCode = is12Digit ? cleanDigits.slice(4, 6) : (cleanDigits.slice(3, 5) || '26');
  const roleCode = is12Digit ? cleanDigits.slice(6, 8) : (cleanDigits.slice(5, 7) || '01');
  const sequenceNum = is12Digit ? cleanDigits.slice(8, 12) : (cleanDigits.slice(7, 11) || '0001');
  const pureDigitsUid = cleanDigits || displayUid.replace(/-/g, '');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#00236f] via-[#001744] to-[#1e1b4b] p-6 text-white relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-[#00236f] font-black text-2xl flex items-center justify-center shadow-lg ring-4 ring-white/20 shrink-0">
                {(currentUser.full_name || currentUser.username || 'U')[0].toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white tracking-tight">
                    {(currentUser.full_name || currentUser.username).replace(/\s*\(\d+\)\s*$/, '')}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Active Account</span>
                  </span>
                </div>
                <p className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>{roleTitle}</span>
                </p>
                <p className="text-[11px] text-slate-300">
                  {currentUser.department || 'Baba Farid Group of Institutions'} • Main Campus 01
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              title="Close Profile"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Canonical Pure-Digit UID Structural Breakdown Banner */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#00236f]" />
                <span>Canonical 12-Digit Permanent Enterprise UID</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Verified Master Database Key
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-base font-black text-[#00236f] text-center tracking-widest shadow-2xs">
              {pureDigitsUid}
            </div>

            <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
              <div className="p-2 bg-white rounded-lg border border-slate-100">
                <span className="block text-slate-400 uppercase">Server</span>
                <span className="font-mono font-bold text-slate-800 text-xs">Node {serverNode}</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-100">
                <span className="block text-slate-400 uppercase">Client</span>
                <span className="font-mono font-bold text-slate-800 text-xs">#{clientCode} (BFGI)</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-100">
                <span className="block text-slate-400 uppercase">Session</span>
                <span className="font-mono font-bold text-slate-800 text-xs">20{sessionCode}</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-100">
                <span className="block text-slate-400 uppercase">Role / Course</span>
                <span className="font-mono font-bold text-slate-800 text-xs">Code {roleCode}</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-100">
                <span className="block text-slate-400 uppercase">Sequence</span>
                <span className="font-mono font-bold text-slate-800 text-xs">#{sequenceNum}</span>
              </div>
            </div>
          </div>

          {/* Institutional Credentials Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserIcon className="w-3 h-3 text-slate-400" />
                <span>Single Sign-On Username</span>
              </span>
              <p className="font-mono font-bold text-xs text-slate-900">{currentUser.username}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-slate-400" />
                <span>Official Institutional Email</span>
              </span>
              <p className="font-mono font-bold text-xs text-slate-900 truncate">{currentUser.email || `${currentUser.username}@educore.edu`}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3 h-3 text-slate-400" />
                <span>Department / Academic Unit</span>
              </span>
              <p className="font-bold text-xs text-slate-900 truncate">{currentUser.department || 'Executive Directorate'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>Campus Location</span>
              </span>
              <p className="font-bold text-xs text-slate-900">Bathinda Main Campus (Campus 01)</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3 h-3 text-slate-400" />
                <span>Employee / Scholar ID</span>
              </span>
              <p className="font-mono font-bold text-xs text-slate-900">{currentUser.employee_id || pureDigitsUid}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-slate-400" />
                <span>Security Governance Tier</span>
              </span>
              <p className="font-bold text-xs text-slate-900">
                {currentUser.role === 'super_admin'
                  ? 'Apex Level 0 (Universal Bypass)'
                  : currentUser.role === 'admin'
                  ? 'Apex Level 1 (Institutional Dean)'
                  : currentUser.role === 'student'
                  ? 'Standard Level 5 (Undergraduate Candidate)'
                  : 'Faculty Level 2 (Administrative Operator)'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onResetPassword?.();
              }}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              <span>Change Password</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Sign Out</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#00236f] hover:bg-[#001744] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
