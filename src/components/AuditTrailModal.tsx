import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { AuditLogItem } from '../types';

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

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
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        l.actor_name.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.target_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-5xl w-full h-[85vh] shadow-2xl border border-[#e1e3e4] flex flex-col overflow-hidden animate-scaleUp">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#e1e3e4] bg-[#f8f9fa] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00236f] text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[24px]">verified_user</span>
            </div>
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
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#757682] hover:bg-[#e1e3e4] hover:text-[#191c1d] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="px-6 py-3 border-b border-[#e1e3e4] bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#757682] text-[18px]">
                search
              </span>
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

            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="px-3 py-1.5 bg-[#00236f] text-white font-bold rounded-lg hover:brightness-110 flex items-center gap-1 cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[16px] ${isLoading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>Refresh</span>
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
              <span className="material-symbols-outlined text-4xl text-[#c5c5d3]">shield</span>
              <p>No audit logs matching current filter.</p>
            </div>
          ) : (
            <div className="border border-[#e1e3e4] rounded-xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[#444651] font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-4">Timestamp (IST)</th>
                    <th className="py-2.5 px-4">Actor</th>
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">Details</th>
                    <th className="py-2.5 px-4">Severity</th>
                    <th className="py-2.5 px-4 text-right">Payload Diff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3f4]">
                  {filteredLogs.map(log => {
                    const isCrit = log.severity === 'critical';
                    const isWarn = log.severity === 'warn';
                    return (
                      <tr key={log.id} className="hover:bg-[#f8f9fa] transition-colors">
                        <td className="py-2.5 px-4 font-mono text-[11px] text-[#757682] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'medium',
                          })}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-[#191c1d] flex items-center gap-1.5">
                            {log.actor_role === 'super_admin' && (
                              <span className="text-amber-500 text-xs" title="Super Admin universal lens">👑</span>
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

        {/* Diff Inspection Modal Sheet */}
        {selectedLog && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-6 z-10">
            <div className="bg-white rounded-xl max-w-lg w-full p-5 border border-[#e1e3e4] shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-[#f1f3f4] pb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00236f]">code</span>
                  <h4 className="font-bold text-sm text-[#191c1d]">Audit Log Change Diff</h4>
                </div>
                <button onClick={() => setSelectedLog(null)} className="text-[#757682] hover:text-[#191c1d]">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="text-xs space-y-1">
                <p><span className="font-bold">Action:</span> {selectedLog.action}</p>
                <p><span className="font-bold">Actor:</span> {selectedLog.actor_name} ({selectedLog.actor_role})</p>
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
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-1.5 bg-[#00236f] text-white font-bold rounded-lg text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#e1e3e4] bg-[#f8f9fa] flex items-center justify-between text-xs text-[#757682]">
          <span>Logged Records: {filteredLogs.length} events</span>
          <span>Standards: MRSPTU Security Ordinance & Punjab IT Act compliance</span>
        </div>
      </div>
    </div>
  );
};
