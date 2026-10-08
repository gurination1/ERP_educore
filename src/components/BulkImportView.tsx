import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../api/client';

interface BulkImportViewProps {
  currentUser: User | null;
  onNavigateToCRM?: () => void;
}

export const BulkImportView: React.FC<BulkImportViewProps> = ({ currentUser, onNavigateToCRM }) => {
  const [csvRawText, setCsvRawText] = useState('');
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [sourceLabel, setSourceLabel] = useState('Punjab State Education Fair 2025');
  const [fileName, setFileName] = useState('leads_import.csv');

  // Column Mapping: Left = System Field, Right = Uploaded Header
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    student_name: '',
    mobile: '',
    email: '',
    selected_course: '',
    father_name: '',
    gender: '',
    course_fee: '',
    admission_probability: '',
  });

  // Validation Results
  const [validationResult, setValidationResult] = useState<{
    total_rows: number;
    fresh_count: number;
    duplicate_count: number;
    wrong_count: number;
    freshRows: any[];
    duplicateRows: any[];
    wrongRows: any[];
  } | null>(null);

  const [batches, setBatches] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'mapper' | 'preview' | 'history'>('upload');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sample CSV loader for quick testing
  const loadDemoCSV = () => {
    const demo = `Full Name,Phone Number,Applicant Email,Target Degree,Guardian Name,Gender,Tentative Probability
Jaspreet Singh,9876543210,jaspreet.singh@gmail.com,B.Tech CSE,S. Baldev Singh,male,85
Amanat Sharma,9812345678,amanat.s@outlook.com,B.Sc Agriculture,Sh. Deshraj Sharma,female,70
Gurpreet Brar,9876543210,gurpreet.brar@gmail.com,B.Tech Civil,S. Jagtar Singh,male,90
,9914099881,incomplete.lead@mail.com,B.Tech CSE,Unknown,male,50
Maninder Kaur,9845,mani.kaur@yahoo.com,B.Pharm,S. Ranjit Singh,female,60
Navkiran Gill,9872011223,navkiran.gill@gmail.com,B.Tech CSE,S. Harnek Singh,female,95`;
    setCsvRawText(demo);
    setFileName('punjab_school_leads_demo.csv');
    handleParseText(demo);
  };

  const handleParseText = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return;

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    setParsedHeaders(headers);

    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = vals[idx] || '';
      });
      rows.push(rowObj);
    }
    setParsedRows(rows);

    // Auto-detect mapping heuristics
    const autoMap: Record<string, string> = { ...columnMapping };
    headers.forEach(h => {
      const lower = h.toLowerCase();
      if (lower.includes('name') && !lower.includes('guardian') && !lower.includes('father')) autoMap.student_name = h;
      else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact')) autoMap.mobile = h;
      else if (lower.includes('email') || lower.includes('mail')) autoMap.email = h;
      else if (lower.includes('course') || lower.includes('degree') || lower.includes('branch')) autoMap.selected_course = h;
      else if (lower.includes('father') || lower.includes('guardian')) autoMap.father_name = h;
      else if (lower.includes('gender')) autoMap.gender = h;
      else if (lower.includes('fee')) autoMap.course_fee = h;
      else if (lower.includes('prob') || lower.includes('chance') || lower.includes('score')) autoMap.admission_probability = h;
    });
    setColumnMapping(autoMap);
    setActiveTab('mapper');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = evt => {
      const text = String(evt.target?.result || '');
      setCsvRawText(text);
      handleParseText(text);
    };
    reader.readAsText(file);
  };

  const handleValidate = async () => {
    if (!columnMapping.student_name || !columnMapping.mobile) {
      alert('Please map both "Candidate Name" and "Mobile Number" to proceed with validation.');
      return;
    }

    setIsProcessing(true);
    const res = await api.validateBulkEnquiries(parsedRows, columnMapping);
    setIsProcessing(false);

    if (res.success) {
      setValidationResult(res);
      setActiveTab('preview');
      setStatusMessage(`Validation Complete: ${res.fresh_count} Fresh, ${res.duplicate_count} Probable Duplicates, ${res.wrong_count} Wrong Data.`);
    } else {
      alert(res.error || 'Validation failed.');
    }
  };

  const handleCommit = async () => {
    if (!validationResult || validationResult.fresh_count === 0) {
      alert('No fresh records available to commit.');
      return;
    }

    setIsProcessing(true);
    const res = await api.commitBulkEnquiries({
      freshRows: validationResult.freshRows,
      duplicateRows: validationResult.duplicateRows,
      wrongRows: validationResult.wrongRows,
      source_label: sourceLabel,
      filename: fileName,
    });
    setIsProcessing(false);

    if (res.success) {
      setStatusMessage(`Successfully imported ${res.insertedCount} fresh leads into CRM! Batch ID #${res.batch.id}`);
      fetchBatches();
      setActiveTab('history');
    } else {
      alert(res.error || 'Commit failed.');
    }
  };

  const downloadErrorReport = () => {
    if (!validationResult) return;
    const errors = [
      ...validationResult.wrongRows.map(w => ({
        type: 'WRONG_DATA',
        reason: w.error_reason,
        ...w.original_data,
      })),
      ...validationResult.duplicateRows.map(d => ({
        type: 'DUPLICATE',
        reason: d.duplicate_field,
        ...d.original_data,
      })),
    ];

    if (errors.length === 0) {
      alert('No error or duplicate records to download!');
      return;
    }

    const headers = Object.keys(errors[0]);
    const csvContent = [
      headers.join(','),
      ...errors.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `error_report_${fileName}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchBatches = async () => {
    const res = await api.getBulkBatches();
    if (res.success && res.batches) {
      setBatches(res.batches);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 font-sans text-[11px] text-[#00236f]">
      {/* Top Banner */}
      <div className="bg-white border border-[#00236f]/20 rounded p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
                window.history.back();
              } else {
                window.location.href = '/dashboard';
              }
            }}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-[#00236f] flex items-center justify-center font-bold text-sm transition-all cursor-pointer border border-slate-200/80 shrink-0"
            title="Return to Previous (Alt + ←)"
          >
            ‹
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[13px] tracking-wide text-[#00236f]">
                FLEXIBLE BULK CSV/EXCEL IMPORTER & COLUMN MAPPER
              </span>
              <span className="bg-[#ea580c] text-white px-2 py-0.5 rounded text-[10px] font-bold">
                3-TIER PRE-IMPORT CHECK
              </span>
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Accepts any arbitrary column order. 2-Column visual mapper categorizes leads into Fresh, Probable Duplicates, and Wrong Data.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToCRM && (
            <button
              onClick={onNavigateToCRM}
              className="border border-[#00236f] text-[#00236f] bg-white hover:bg-[#00236f]/5 font-bold px-3 py-1.5 rounded-full text-[11px] transition flex items-center gap-1 cursor-pointer"
            >
              <span className="text-sm leading-none font-bold">‹</span>
              <span>Return to CRM</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-2.5 rounded text-[11px] font-medium flex justify-between items-center">
          <span>[SYSTEM FEEDBACK] {statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-gray-500 hover:text-black">
            [DISMISS]
          </button>
        </div>
      )}

      {/* Workflow Tabs */}
      <div className="flex border-b border-gray-200 text-[11px] font-bold gap-2 bg-white px-3 pt-2 rounded-t border border-[#00236f]/20 border-b-0">
        {[
          { id: 'upload', label: '1. FILE UPLOAD & PASTE' },
          { id: 'mapper', label: `2. DYNAMIC COLUMN MAPPER (${parsedHeaders.length} HEADERS)` },
          { id: 'preview', label: `3. 3-TIER VALIDATION RESULTS` },
          { id: 'history', label: `4. UPLOAD BATCH HISTORY (${batches.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3 py-1.5 border-b-2 transition ${
              activeTab === t.id
                ? 'border-[#00236f] text-[#00236f] bg-gray-50'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: FILE UPLOAD */}
      {activeTab === 'upload' && (
        <div className="bg-white border border-[#00236f]/20 rounded p-4 space-y-3 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <span className="font-bold text-[#00236f] block">UPLOAD CSV / EXCEL FILE:</span>
              <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center space-y-2 bg-gray-50">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="block mx-auto text-[11px]"
                />
                <p className="text-gray-500 text-[10px]">
                  Supports comma-delimited files (.csv). Column names can be arbitrary.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-0.5 text-gray-700">SOURCE CAMPAIGN LABEL:</label>
                  <input
                    type="text"
                    value={sourceLabel}
                    onChange={e => setSourceLabel(e.target.value)}
                    className="w-full border p-1.5 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-0.5 text-gray-700">FILE NAME:</label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={e => setFileName(e.target.value)}
                    className="w-full border p-1.5 rounded"
                  />
                </div>
              </div>

              <button
                onClick={loadDemoCSV}
                className="w-full py-2 bg-amber-50 border border-amber-300 text-amber-900 font-bold rounded hover:bg-amber-100 transition"
              >
                [LOAD MALWA REGION SCHOOL FAIR DEMO DATA]
              </button>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-[#00236f] block">OR PASTE RAW CSV CONTENT:</span>
              <textarea
                rows={10}
                placeholder="Candidate Name,Contact Number,Course..."
                value={csvRawText}
                onChange={e => {
                  setCsvRawText(e.target.value);
                  handleParseText(e.target.value);
                }}
                className="w-full border p-2 rounded font-mono text-[10px]"
              />
              <div className="flex justify-between items-center text-[10px] text-gray-500">
                <span>PARSED: {parsedRows.length} ROWS</span>
                {parsedRows.length > 0 && (
                  <button
                    onClick={() => setActiveTab('mapper')}
                    className="bg-[#00236f] text-white font-bold px-3 py-1 rounded"
                  >
                    CONTINUE TO MAPPER &rarr;
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DYNAMIC COLUMN MAPPER */}
      {activeTab === 'mapper' && (
        <div className="bg-white border border-[#00236f]/20 rounded p-4 space-y-4 shadow-sm">
          <div className="border-b pb-2 flex justify-between items-center">
            <div>
              <span className="font-bold text-[#00236f]">TWO-COLUMN DYNAMIC FIELD MAPPER</span>
              <p className="text-[10px] text-gray-500">
                Map each canonical system field on the left to the corresponding header found in your uploaded file on the right.
              </p>
            </div>
            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-mono">
              TOTAL ROWS: {parsedRows.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="font-bold text-[#00236f] block border-b pb-1">CANONICAL SYSTEM FIELDS (LEFT)</span>

              {[
                { key: 'student_name', label: 'CANDIDATE FULL NAME *', required: true },
                { key: 'mobile', label: 'MOBILE NUMBER (10+ DIGITS) *', required: true },
                { key: 'email', label: 'EMAIL ADDRESS', required: false },
                { key: 'selected_course', label: 'TARGET COURSE / DEGREE', required: false },
                { key: 'father_name', label: 'FATHER / GUARDIAN NAME', required: false },
                { key: 'gender', label: 'GENDER', required: false },
                { key: 'course_fee', label: 'TENTATIVE COURSE FEE (INR)', required: false },
                { key: 'admission_probability', label: 'INITIAL PROBABILITY (%)', required: false },
              ].map(f => (
                <div key={f.key} className="border p-2 rounded bg-gray-50 flex items-center justify-between text-[10px]">
                  <div>
                    <span className="font-bold text-gray-800">{f.label}</span>
                    {f.required && <span className="text-rose-600 font-bold ml-1">[MANDATORY]</span>}
                  </div>
                  <select
                    value={columnMapping[f.key] || ''}
                    onChange={e => setColumnMapping({ ...columnMapping, [f.key]: e.target.value })}
                    className="border p-1 rounded bg-white font-mono text-[10px] w-48"
                  >
                    <option value="">-- UNMAPPED --</option>
                    {parsedHeaders.map(h => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <span className="font-bold text-[#00236f] block border-b pb-1">UPLOADED DATA PREVIEW (SAMPLE 3 ROWS)</span>
              <div className="space-y-1.5 max-h-[380px] overflow-y-auto">
                {parsedRows.slice(0, 3).map((r, i) => (
                  <div key={i} className="border p-2 rounded bg-white text-[9px] font-mono space-y-0.5">
                    <span className="font-bold text-[#00236f] block">ROW #{i + 1}:</span>
                    {Object.entries(r).map(([k, v]: any) => (
                      <div key={k} className="flex justify-between border-b border-gray-100 py-0.5">
                        <span className="text-gray-500">{k}:</span>
                        <strong className="text-gray-800">{String(v)}</strong>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  onClick={() => setActiveTab('upload')}
                  className="px-3 py-1.5 border rounded text-gray-600"
                >
                  &lt;- BACK TO UPLOAD
                </button>
                <button
                  onClick={handleValidate}
                  disabled={isProcessing}
                  className="px-4 py-1.5 bg-[#ea580c] hover:bg-[#ea580c]/90 text-white font-bold rounded"
                >
                  {isProcessing ? 'VALIDATING...' : 'EXECUTE 3-TIER VALIDATION ->'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 3-TIER VALIDATION PREVIEW */}
      {activeTab === 'preview' && (
        <div className="bg-white border border-[#00236f]/20 rounded p-4 space-y-4 shadow-sm">
          {validationResult ? (
            <>
              {/* Stat Counters */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="border p-2.5 rounded bg-gray-50">
                  <span className="text-gray-500 text-[10px] block">TOTAL ROWS PARSED</span>
                  <strong className="text-[16px] text-[#00236f]">{validationResult.total_rows}</strong>
                </div>
                <div className="border p-2.5 rounded bg-emerald-50 border-emerald-300">
                  <span className="text-emerald-700 text-[10px] block font-bold">1. FRESH (READY TO COMMIT)</span>
                  <strong className="text-[16px] text-emerald-800">{validationResult.fresh_count}</strong>
                </div>
                <div className="border p-2.5 rounded bg-amber-50 border-amber-300">
                  <span className="text-amber-700 text-[10px] block font-bold">2. PROBABLE DUPLICATES</span>
                  <strong className="text-[16px] text-amber-800">{validationResult.duplicate_count}</strong>
                </div>
                <div className="border p-2.5 rounded bg-rose-50 border-rose-300">
                  <span className="text-rose-700 text-[10px] block font-bold">3. WRONG DATA (REJECTED)</span>
                  <strong className="text-[16px] text-rose-800">{validationResult.wrong_count}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded border">
                <div>
                  <span className="font-bold text-[#00236f]">VALIDATION STATUS SUMMARY:</span>
                  <p className="text-[10px] text-gray-500">
                    Only 'Fresh' rows will be written to CRM. Duplicates & Wrong Data can be exported for offline correction.
                  </p>
                </div>

                <div className="flex gap-2">
                  {(validationResult.duplicate_count > 0 || validationResult.wrong_count > 0) && (
                    <button
                      onClick={downloadErrorReport}
                      className="border border-rose-600 text-rose-700 bg-white hover:bg-rose-50 px-3 py-1.5 rounded font-bold transition text-[10px]"
                    >
                      [DOWNLOAD CSV ERROR REPORT ({validationResult.duplicate_count + validationResult.wrong_count})]
                    </button>
                  )}

                  <button
                    onClick={handleCommit}
                    disabled={validationResult.fresh_count === 0 || isProcessing}
                    className="bg-[#00236f] hover:bg-[#00236f]/90 text-white px-4 py-1.5 rounded font-bold transition text-[11px]"
                  >
                    {isProcessing ? 'COMMITTING...' : `COMMIT ${validationResult.fresh_count} FRESH LEADS TO CRM ->`}
                  </button>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px]">
                {/* Fresh Rows */}
                <div className="border p-3 rounded bg-emerald-50/40 space-y-1.5">
                  <span className="font-bold text-emerald-900 block border-b pb-1">
                    [TIER 1] FRESH LEADS SAMPLE ({validationResult.freshRows.length})
                  </span>
                  <div className="space-y-1 max-h-[260px] overflow-y-auto">
                    {validationResult.freshRows.slice(0, 5).map((r, i) => (
                      <div key={i} className="border border-emerald-200 bg-white p-1.5 rounded flex justify-between items-center">
                        <div>
                          <strong className="text-gray-800">{r.student_name}</strong>
                          <span className="text-gray-500 block">{r.selected_course}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-gray-700">{r.mobile}</span>
                          <span className="text-emerald-700 block font-bold">{r.admission_probability}% PROB</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Duplicates and Errors */}
                <div className="border p-3 rounded bg-rose-50/40 space-y-1.5">
                  <span className="font-bold text-rose-900 block border-b pb-1">
                    [TIER 2 & 3] DUPLICATES & WRONG DATA SAMPLE
                  </span>
                  <div className="space-y-1 max-h-[260px] overflow-y-auto">
                    {validationResult.wrongRows.map((w, i) => (
                      <div key={i} className="border border-rose-300 bg-white p-1.5 rounded">
                        <span className="text-rose-800 font-bold block">[WRONG DATA]: {w.error_reason}</span>
                        <span className="text-gray-500 font-mono text-[9px]">Row #{w.row_index}: {JSON.stringify(w.original_data)}</span>
                      </div>
                    ))}
                    {validationResult.duplicateRows.map((d, i) => (
                      <div key={i} className="border border-amber-300 bg-white p-1.5 rounded">
                        <span className="text-amber-800 font-bold block">[PROBABLE DUPLICATE]: {d.duplicate_field}</span>
                        <span className="text-gray-500 font-mono text-[9px]">Row #{d.row_index}: {JSON.stringify(d.original_data)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-gray-400">
              No validation runs completed yet. Upload and map columns first.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BATCH HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white border border-[#00236f]/20 rounded p-4 space-y-3 shadow-sm">
          <div className="border-b pb-2 flex justify-between items-center">
            <span className="font-bold text-[#00236f]">BULK CAMPAIGN UPLOAD AUDIT TRAIL</span>
            <button onClick={fetchBatches} className="text-[#00236f] font-bold hover:underline">
              [REFRESH LOGS]
            </button>
          </div>

          <div className="space-y-2">
            {batches.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No bulk batches uploaded yet.</div>
            ) : (
              batches.map(b => (
                <div key={b.id} className="border p-3 rounded bg-gray-50 flex justify-between items-center text-[10px]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#00236f] text-[11px]">{b.filename}</span>
                      <span className="bg-gray-200 text-gray-800 px-1.5 py-0.2 rounded font-mono">
                        {b.source_label}
                      </span>
                    </div>
                    <span className="text-gray-500 block mt-0.5">Uploaded by {b.uploaded_by} on {b.upload_date}</span>
                  </div>

                  <div className="flex gap-3 text-right">
                    <div>
                      <span className="text-gray-500 block">TOTAL</span>
                      <strong>{b.total_rows}</strong>
                    </div>
                    <div>
                      <span className="text-emerald-700 block">FRESH</span>
                      <strong className="text-emerald-800">{b.fresh_count}</strong>
                    </div>
                    <div>
                      <span className="text-amber-700 block">DUPLICATES</span>
                      <strong className="text-amber-800">{b.duplicate_count}</strong>
                    </div>
                    <div>
                      <span className="text-rose-700 block">REJECTED</span>
                      <strong className="text-rose-800">{b.wrong_count}</strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
