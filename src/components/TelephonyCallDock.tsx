import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';

export interface TelephonyCandidate {
  id: string;
  name: string;
  phone: string;
  course?: string;
  quota?: string;
  studentId?: string;
  intakeStep?: number;
}

interface TelephonyCallDockProps {
  isOpen: boolean;
  onClose: () => void;
  activeCandidate: TelephonyCandidate | null;
  onDispositionSaved?: () => void;
}

export const TelephonyCallDock: React.FC<TelephonyCallDockProps> = ({
  isOpen,
  onClose,
  activeCandidate,
  onDispositionSaved,
}) => {
  // Call States: 'idle' | 'dialing' | 'ringing' | 'connected' | 'ended'
  const [callState, setCallState] = useState<'idle' | 'dialing' | 'ringing' | 'connected' | 'ended'>('idle');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Manual Dialing State
  const [dialedDigits, setDialedDigits] = useState('');

  // Disposition Sheet State
  const [showDisposition, setShowDisposition] = useState(false);
  const [dispositionOutcome, setDispositionOutcome] = useState('callback_requested');
  const [dispositionNotes, setDispositionNotes] = useState('');
  const [dispositionNextDate, setDispositionNextDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [dispositionPriority, setDispositionPriority] = useState('p1_high');
  const [savingDisposition, setSavingDisposition] = useState(false);

  // Web Audio Context Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringOsc1Ref = useRef<OscillatorNode | null>(null);
  const ringOsc2Ref = useRef<OscillatorNode | null>(null);
  const ringGainRef = useRef<GainNode | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Initialize Web Audio
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Play standard North American / Indian ringback tone (440Hz + 480Hz)
  const startRingbackTone = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = 440;
      osc2.frequency.value = 480;

      // Cadence: 2 sec on, 4 sec off
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.04, now);
      for (let i = 0; i < 6; i++) {
        const cycle = now + i * 6;
        gain.gain.setValueAtTime(0.05, cycle);
        gain.gain.setValueAtTime(0, cycle + 2);
      }

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      ringOsc1Ref.current = osc1;
      ringOsc2Ref.current = osc2;
      ringGainRef.current = gain;
    } catch (e) {
      console.warn('Audio tone play failed:', e);
    }
  };

  const stopRingbackTone = () => {
    try {
      if (ringOsc1Ref.current) {
        ringOsc1Ref.current.stop();
        ringOsc1Ref.current.disconnect();
        ringOsc1Ref.current = null;
      }
      if (ringOsc2Ref.current) {
        ringOsc2Ref.current.stop();
        ringOsc2Ref.current.disconnect();
        ringOsc2Ref.current = null;
      }
    } catch (e) {
      // Ignore audio cleanup
    }
  };

  // Play connect chime
  const playConnectChime = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.04, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.4);
      });
    } catch (e) {}
  };

  // Play DTMF keypad frequency tone
  const playDtmfTone = (digit: string) => {
    if (!soundEnabled) return;
    const dtmfFreqs: Record<string, [number, number]> = {
      '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
      '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
      '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
      '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
    };
    const freqs = dtmfFreqs[digit];
    if (!freqs) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.frequency.value = freqs[0];
      osc2.frequency.value = freqs[1];
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.16);
      osc2.stop(now + 0.16);
    } catch (e) {}
  };

  // Auto-start call when opened with an active candidate
  useEffect(() => {
    if (isOpen && activeCandidate) {
      startOutboundCall();
    }
    return () => {
      stopRingbackTone();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isOpen, activeCandidate]);

  const startOutboundCall = () => {
    setCallState('dialing');
    setDuration(0);
    setIsMuted(false);
    setIsOnHold(false);
    setShowDisposition(false);

    // Step 1: Leg A Dialing (Counselor station rings)
    setTimeout(() => {
      setCallState('ringing');
      startRingbackTone();

      // Step 2: Candidate phone rings & answers (Simulated 2-Leg Bridge)
      setTimeout(() => {
        stopRingbackTone();
        playConnectChime();
        setCallState('connected');

        // Start call duration counter
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);
      }, 3500);
    }, 1200);
  };

  const handleEndCall = () => {
    stopRingbackTone();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setCallState('ended');
    setShowDisposition(true);
  };

  const handleKeyPress = (digit: string) => {
    setDialedDigits(prev => prev + digit);
    playDtmfTone(digit);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const handleSaveDisposition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidate) return;
    setSavingDisposition(true);

    try {
      const notesFormatted = `[Cloud Telephony CTI Call • Duration: ${formatTime(duration)} • Masked DID: +91-172-500-EDUCORE] ${dispositionNotes.trim()}`;
      await api.logFollowup(activeCandidate.id, {
        interaction_type: 'call',
        outcome: dispositionOutcome,
        notes: notesFormatted,
        next_followup_date: dispositionNextDate || undefined,
        priority: dispositionPriority,
      });

      setShowDisposition(false);
      setCallState('idle');
      onDispositionSaved && onDispositionSaved();
      onClose();
    } catch (err) {
      console.error('Failed to log disposition:', err);
    } finally {
      setSavingDisposition(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ========================================================================= */}
      {/* SLEEK iPHONE CALLKIT / DYNAMIC ISLAND DOCKED CTI BAR                       */}
      {/* ========================================================================= */}
      {!isMinimized ? (
        <div
          id="iphone-telephony-dock"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="bg-slate-950/92 backdrop-blur-2xl border border-slate-700/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] text-white rounded-3xl p-4 md:px-6 md:py-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-all">
            
            {/* Left: Avatar & Candidate Info */}
            <div className="flex items-center gap-3.5 w-full md:w-auto">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#00236f] to-[#1e3a8a] text-white flex items-center justify-center font-bold text-base shadow-md border border-white/10">
                  {activeCandidate?.name ? activeCandidate.name.charAt(0) : 'P'}
                </div>
                {callState === 'connected' && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950"></span>
                  </span>
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm tracking-tight text-white truncate">
                    {activeCandidate?.name || 'Prospective Student'}
                  </h4>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    DID Masked
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-0.5">
                  <span>{activeCandidate?.phone || '+91 98765-XXXXX'}</span>
                  <span>•</span>
                  <span className="text-[11px] text-slate-300 truncate">{activeCandidate?.course || 'B.Tech CS'}</span>
                </div>
              </div>
            </div>

            {/* Center: Live Call Status & Audio Waveform */}
            <div className="flex flex-col items-center justify-center px-2 py-1 bg-slate-900/60 rounded-xl border border-white/5 min-w-[150px]">
              {callState === 'dialing' && (
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium animate-pulse">
                  
                  <span>Dialing Counselor Leg...</span>
                </div>
              )}

              {callState === 'ringing' && (
                <div className="flex items-center gap-1.5 text-sky-400 text-xs font-medium">
                  <span className="font-bold text-[10px]">[CALL]</span>
                  <span>Ringing Candidate...</span>
                </div>
              )}

              {callState === 'connected' && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-0.5 h-5 px-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(bar => (
                      <span
                        key={bar}
                        className={`w-0.5 rounded-full bg-emerald-400 transition-all ${isOnHold ? 'h-1 opacity-30' : 'h-4 animate-pulse'}`}
                        style={{
                          animationDuration: `${0.4 + (bar % 4) * 0.2}s`,
                          animationDelay: `${bar * 0.08}s`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-sm font-bold text-white tracking-wider">
                    {formatTime(duration)}
                  </span>
                  {isOnHold && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      On Hold
                    </span>
                  )}
                </div>
              )}

              {callState === 'ended' && (
                <span className="text-xs text-rose-400 font-medium">Call Finished</span>
              )}

              <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                Pilot: +91-172-500-EDUCORE
              </span>
            </div>

            {/* Right: Tactile iPhone Controls */}
            <div className="flex items-center gap-2">
              {/* Mute Mic */}
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                disabled={callState !== 'connected'}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isMuted
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 ring-2 ring-rose-500/30'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                
              </button>

              {/* Hold Call */}
              <button
                type="button"
                onClick={() => setIsOnHold(!isOnHold)}
                disabled={callState !== 'connected'}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isOnHold
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 ring-2 ring-amber-500/30'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title={isOnHold ? 'Resume Call' : 'Hold Call'}
              >
                
              </button>

              {/* DTMF Keypad */}
              <button
                type="button"
                onClick={() => setShowKeypad(!showKeypad)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  showKeypad
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
                }`}
                title="Dial Pad (DTMF)"
              >
                
              </button>

              {/* Sound FX Toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="w-10 h-10 rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center transition-all cursor-pointer"
                title={soundEnabled ? 'Call Sound FX Active' : 'Sound FX Muted'}
              >
                
              </button>

              {/* Minimize Dock */}
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="w-10 h-10 rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center transition-all cursor-pointer"
                title="Minimize Call Dock"
              >
                <span className="font-bold text-[10px]">▼</span>
              </button>

              {/* End Call / Red Button */}
              <button
                type="button"
                onClick={handleEndCall}
                className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-rose-900/50 transition-all cursor-pointer ml-1"
                title="End Telephony Call"
              >
                <span className="font-bold text-[10px]">[END]</span>
              </button>
            </div>
          </div>

          {/* Collapsible DTMF Dial Pad */}
          {showKeypad && (
            <div className="mt-2.5 mx-auto max-w-xs bg-slate-950/95 backdrop-blur-2xl border border-slate-800 rounded-2xl p-3 shadow-2xl text-center">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-[11px] font-mono text-slate-400">DTMF In-Call Keypad</span>
                <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded bg-slate-900">
                  {dialedDigits || 'Press keys'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeyPress(key)}
                    className="h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white font-mono font-bold text-sm flex items-center justify-center transition-all border border-slate-700/50 cursor-pointer"
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Compact Minimized Dynamic Island Pill */
        <div
          id="iphone-telephony-dock-minimized"
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-5 right-6 z-50 bg-slate-950/95 backdrop-blur-xl border border-emerald-500/40 shadow-2xl rounded-full px-4 py-2.5 flex items-center gap-3 text-white cursor-pointer hover:scale-105 transition-all group"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <div className="flex flex-col">
            <span className="text-xs font-bold truncate max-w-[130px]">
              {activeCandidate?.name || 'On Call'}
            </span>
            <span className="text-[10px] font-mono text-emerald-400">
              {callState === 'connected' ? formatTime(duration) : callState}
            </span>
          </div>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              handleEndCall();
            }}
            className="w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center text-white"
            title="Hang Up"
          >
            <span className="font-bold text-[10px]">[END]</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POST-CALL AUTO-DISPOSITION SHEET (MATCHES EDUCORE ERP DESIGN SYSTEM)       */}
      {/* ========================================================================= */}
      {showDisposition && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#e1e3e4] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-[#00236f] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                  
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight text-white">Log Call Disposition</h3>
                  <p className="text-xs text-blue-200">
                    Candidate: {activeCandidate?.name} • Call Duration: {formatTime(duration)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDisposition(false);
                  onClose();
                }}
                className="text-white/70 hover:text-white cursor-pointer"
              >
                <span className="font-bold text-[10px]">✕</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveDisposition} className="p-5 space-y-4 text-xs">
              {/* Telephony Metadata Box */}
              <div className="p-3 bg-[#f8f9fa] border border-[#e1e3e4] rounded-xl flex items-center justify-between text-[#444651]">
                <div>
                  <span className="text-[10px] text-[#757682] uppercase font-bold block">DID Bridge Pilot</span>
                  <span className="font-mono font-semibold text-[#191c1d]">+91-172-500-EDUCORE</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#757682] uppercase font-bold block">Call Duration</span>
                  <span className="font-mono font-bold text-emerald-700">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Quick Outcome Tags */}
              <div>
                <label className="block text-[#191c1d] font-bold mb-1.5">
                  Call Outcome / Stage <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'campus_visit_scheduled', label: '🏫 Campus Visit Scheduled' },
                    { key: 'callback_requested', label: '📞 Callback Requested' },
                    { key: 'punjab_quota_concession', label: '🎓 Quota / Fee Discussion' },
                    { key: 'documents_pending', label: '📄 Documents Pending' },
                    { key: 'busy_callback', label: '⏳ Busy / Callback Later' },
                    { key: 'not_interested', label: '❌ Not Interested' },
                  ].map(outcome => (
                    <button
                      key={outcome.key}
                      type="button"
                      onClick={() => setDispositionOutcome(outcome.key)}
                      className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                        dispositionOutcome === outcome.key
                          ? 'bg-[#00236f] text-white border-[#00236f] shadow-xs'
                          : 'bg-[#f8f9fa] border-[#e1e3e4] text-[#444651] hover:bg-white'
                      }`}
                    >
                      {outcome.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Follow-up Priority & Next Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#191c1d] font-bold mb-1">
                    Priority Flag
                  </label>
                  <select
                    value={dispositionPriority}
                    onChange={e => setDispositionPriority(e.target.value)}
                    className="w-full p-2.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs font-semibold text-[#191c1d] focus:bg-white focus:border-[#00236f] outline-none"
                  >
                    <option value="p1_high">🔥 P1 High (Hot Lead)</option>
                    <option value="p2_medium">⚡ P2 Medium (Follow-up)</option>
                    <option value="p3_low">💤 P3 Standard (Warm)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#191c1d] font-bold mb-1">
                    Next Follow-Up Date
                  </label>
                  <input
                    type="date"
                    value={dispositionNextDate}
                    onChange={e => setDispositionNextDate(e.target.value)}
                    className="w-full p-2.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs font-medium text-[#191c1d] focus:bg-white focus:border-[#00236f] outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[#191c1d] font-bold mb-1">
                  Counselor Conversation Notes
                </label>
                <textarea
                  rows={3}
                  value={dispositionNotes}
                  onChange={e => setDispositionNotes(e.target.value)}
                  placeholder="E.g., Candidate's father inquired about 1st semester tuition fee installment plan and hostel availability. Promised to visit campus on Saturday with original 10+2 marksheet."
                  className="w-full p-2.5 bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg text-xs text-[#191c1d] focus:bg-white focus:border-[#00236f] outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e1e3e4]">
                <button
                  type="button"
                  onClick={() => {
                    setShowDisposition(false);
                    onClose();
                  }}
                  className="px-4 py-2 border border-[#e1e3e4] hover:bg-[#f8f9fa] text-[#444651] rounded-lg font-bold cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={savingDisposition}
                  className="px-5 py-2 bg-[#006a61] hover:bg-[#004f48] text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingDisposition ? (
                    <>
                      
                      <span>Saving to Student CRM...</span>
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-[10px]">✓</span>
                      <span>Save & Update Lead</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
