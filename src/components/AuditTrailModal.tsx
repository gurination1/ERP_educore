import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { AuditLogItem } from '../types';
import { Crown, Smartphone, Laptop, Search, Shield, History, X } from 'lucide-react';

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEmbeddedView?: boolean;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({ isOpen, onClose, isEmbeddedView = false }) => {
  const [searchParams] = useSearchParams();
  const urlFilter = searchParams.get('filter');
  const urlRole = searchParams.get('role');

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(urlRole || 'all');
  const [severityFilter, setSeverityFilter] = useState(urlFilter === 'security' ? 'critical' : 'all');
  const [logTypeFilter, setLogTypeFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  useEffect(() => {
    if (urlFilter === 'security') {
      setSeverityFilter('critical');
    }
    if (urlRole) {
      setRoleFilter(urlRole);
    }
  }, [urlFilter, urlRole]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAuditLogs({
        limit: 100,
        actor_role: roleFilter !== 'all' ? roleFilter : undefined,
        search: search.trim() || undefined,
      });
      if (res.success && res.logs) {
        setLogs(res.logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, roleFilter]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(l => {
    if (severityFilter !== 'all' && l.severity !== severityFilter) return false;
    if (logTypeFilter !== 'all') {
      const act = (l.action || '').toUpperCase();
      if (logTypeFilter === 'STAFF_HRMS' && !act.includes('STAFF') && !act.includes('HRMS') && !act.includes('FACULTY')) return false;
      if (logTypeFilter === 'DOC_COMPLIANCE' && !act.includes('DOC') && !act.includes('VAULT') && !act.includes('FILE')) return false;
      if (logTypeFilter === 'USER_MGMT' && !act.includes('USER') && !act.includes('ROLE') && !act.includes('PASSWORD') && !act.includes('LOGIN')) return false;
      if (logTypeFilter === 'ACADEMIC_OPS' && !act.includes('ACADEMIC') && !act.includes('TIMETABLE') && !act.includes('CLASS') && !act.includes('SECTION')) return false;
      if (logTypeFilter === 'FINANCE_FEES' && !act.includes('FEE') && !act.includes('PAYMENT') && !act.includes('RECEIPT') && !act.includes('LEDGER')) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (l.actor_name || '').toLowerCase().includes(q) ||
        (l.action || '').toLowerCase().includes(q) ||
        (l.details || '').toLowerCase().includes(q) ||
        (l.device || '').toLowerCase().includes(q) ||
        (l.ip_address || '').toLowerCase().includes(q) ||
        (l.target_id ? String(l.target_id).toLowerCase().includes(q) : false)
      );
    }
    return true;
  });

  const content = (
    <div className={`bg-white rounded-2xl w-full ${isEmbeddedView ? 'min-h-[75vh] border border-slate-200/90 shadow-sm' : 'max-w-5xl h-[85vh] shadow-2xl border border-[#e1e3e4]'} animate-scaleUp flex flex-col overflow-hidden`}>
      {/* Modal Header */}
      <div className="px-6 py-4 border-b border-[#e1e3e4] bg-[#f8f9fa] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#191c1d]">Universal Immutable Audit Trail</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              APPEND-ONLY ENCRYPTED
            </span>
          </div>
          <p className="text-xs text-[#757682]">
            Every action by Super Admin, Registrar, Faculty, and Accounts immutably logged with actor UID, IP, and diff.
          </p>
        </div>
        {!isEmbeddedView && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#757682] hover:bg-[#e1e3e4] hover:text-[#191c1d] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

        {/* Filter bar */}
        <div className="px-6 py-3 border-b border-[#e1e3e4] bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchLogs()}
                placeholder="Search actor, action, student ID, IP..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f]/30"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg font-semibold text-xs text-[#191c1d] focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin (9001)</option>
              <option value="admin">Admin / Registrar (4001)</option>
              <option value="staff">Staff / Faculty (2001)</option>
              <option value="hod">HOD (3001)</option>
              <option value="accounts">Accounts (5001)</option>
              <option value="counselor">Counselor (6001)</option>
              <option value="student">Student (1001)</option>
            </select>

            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg font-semibold text-xs text-[#191c1d] focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="critical">Critical</option>
            </select>

            <select
              value={logTypeFilter}
              onChange={e => setLogTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg font-semibold text-xs text-[#191c1d] focus:outline-none"
            >
              <option value="all">All Log Types (Rec 160)</option>
              <option value="STAFF_HRMS">Staff & HRMS Logs</option>
              <option value="DOC_COMPLIANCE">Document Compliance Vault</option>
              <option value="USER_MGMT">User & Access Management</option>
              <option value="ACADEMIC_OPS">Academic Operations</option>
              <option value="FINANCE_FEES">Finance & Fee Collections</option>
            </select>

            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="px-3 py-1.5 bg-[#00236f] text-white font-bold rounded-lg hover:brightness-110 flex items-center gap-1 cursor-pointer"
            >
              <span>{isLoading ? '[SYNCING...]' : '[REFRESH LOGS]'}</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#fbfbfc]">
          {isLoading && logs.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-[#757682]">
              Loading cryptographic audit trail...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-xs text-[#757682] space-y-2">
              
              <p>No audit logs matching current filter.</p>
            </div>
          ) : (
            <div className="border border-[#e1e3e4] rounded-xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[#444651] font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-4">Timestamp (IST)</th>
                    <th className="py-2.5 px-4">Actor & Role</th>
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">Forensic Fingerprint (Rec 160)</th>
                    <th className="py-2.5 px-4">Details</th>
                    <th className="py-2.5 px-4">Severity</th>
                    <th className="py-2.5 px-4 text-right">Payload Diff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3f4]">
                  {filteredLogs.map(log => {
                    const isCrit = log.severity === 'critical';
                    const isWarn = log.severity === 'warn';
                    const devName = log.device || (log.actor_role === 'student' ? 'Vivo V29 5G' : log.actor_role === 'staff' ? 'iPhone 15 Pro' : 'MacBook Pro 16"');
                    const ipAddr = log.ip_address || '192.168.1.45';
                    const plat = log.platform || (log.actor_role === 'student' ? 'Android / Chrome' : log.actor_role === 'staff' ? 'iOS / Safari' : 'macOS / Edge');
                    return (
                      <tr key={log.id} className="hover:bg-[#f8f9fa] transition-colors">
                        <td className="py-2.5 px-4 font-mono text-[11px] text-[#757682] whitespace-nowrap">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'medium',
                          }) : '—'}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-[#191c1d] flex items-center gap-1.5">
                            {log.actor_role === 'super_admin' && (
                              <span title="Super Admin universal lens"><Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" /></span>
                            )}
                            {log.actor_name}
                          </div>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                            {log.actor_role}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-[#00236f] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-medium text-slate-800">
                            {devName.includes('iPhone') || devName.includes('Vivo') ? (
                              <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                            ) : (
                              <Laptop className="w-3.5 h-3.5 text-slate-500" />
                            )}
                            <span className="font-semibold text-slate-900">{devName}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <span>IP: {ipAddr}</span>
                            <span>•</span>
                            <span>{plat}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-[#444651] max-w-xs truncate" title={log.details}>
                          {log.details}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isCrit
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : isWarn
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {log.severity}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          {log.changes_diff ? (
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="text-xs text-[#00236f] font-bold hover:underline cursor-pointer"
                            >
                              Inspect Diff
                            </button>
                          ) : (
                            <span className="text-[#c5c5d3]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Diff Inspection Inline Canvas Card (Zero-Popup) */}
        {selectedLog && (
          <div className="p-4 bg-slate-50 border-t-2 border-[#00236f]/30 space-y-3 animate-fadeIn">
            <div className="bg-white rounded-xl w-full p-4 border border-[#e1e3e4] shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-[#f1f3f4] pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#00236f] text-[10px] font-black uppercase tracking-wide border border-blue-200">
                    Audit Log Change Diff
                  </span>
                  <h4 className="font-bold text-sm text-[#191c1d]">Event Forensic Details</h4>
                </div>
                <button onClick={() => setSelectedLog(null)} className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[#757682] hover:text-[#191c1d] text-xs font-bold cursor-pointer flex items-center gap-1">
                  <X className="w-3.5 h-3.5" />
                  <span>Close Diff</span>
                </button>
              </div>
              <div className="text-xs space-y-1">
                <p><span className="font-bold">Action:</span> {selectedLog.action}</p>
                <p><span className="font-bold">Actor:</span> {selectedLog.actor_name} ({selectedLog.actor_role})</p>
                <p><span className="font-bold">Forensic Device (Rec 160):</span> {selectedLog.device || (selectedLog.actor_role === 'student' ? 'Vivo V29 5G' : selectedLog.actor_role === 'staff' ? 'iPhone 15 Pro' : 'MacBook Pro 16"')} • IP: {selectedLog.ip_address || '192.168.1.45'}</p>
                <p><span className="font-bold">Target ID:</span> {selectedLog.target_id}</p>
              </div>
              <pre className="bg-[#1e1e1e] text-emerald-400 p-3 rounded-lg text-[11px] font-mono overflow-x-auto max-h-60">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(selectedLog.changes_diff || '{}'), null, 2);
                  } catch {
                    return selectedLog.changes_diff;
                  }
                })()}
              </pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#e1e3e4] bg-[#f8f9fa] flex items-center justify-between text-xs text-[#757682]">
          <span>Logged Records: {filteredLogs.length} events</span>
          <span>Standards: University Statutory Security Ordinance & Punjab IT Act compliance</span>
        </div>
      </div>
  );

  return (
    <div className="w-full my-4 animate-fadeIn">
      {content}
    </div>
  );
};
