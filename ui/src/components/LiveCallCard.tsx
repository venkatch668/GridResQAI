import React from 'react';
import { CallStatus, ThemeMode } from '../types';
import { Phone, PhoneIncoming, PhoneOff, Mic, Volume2, ShieldCheck, Clock } from 'lucide-react';

interface LiveCallCardProps {
  theme?: ThemeMode;
  status: CallStatus;
  duration: number;
  callerNumber: string;
  locality: string;
}

export const LiveCallCard: React.FC<LiveCallCardProps> = ({
  theme = 'light',
  status,
  duration,
  callerNumber,
  locality,
}) => {
  const isDark = theme === 'dark';

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'RINGING':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30 animate-pulse">
            <PhoneIncoming className="w-4 h-4 animate-bounce" />
            RINGING...
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            LIVE VOICE CALL
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <PhoneOff className="w-4 h-4" />
            CALL FINALIZED
          </span>
        );
      default:
        return (
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <Phone className="w-4 h-4" />
            IDLE / READY
          </span>
        );
    }
  };

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isDark ? 'bg-slate-800 text-cyan-400 border-slate-700' : 'bg-cyan-50 text-cyan-600 border-cyan-100'
            }`}
          >
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Telephony Gate
            </h3>
            <p className={`text-xs md:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Exotel Virtual Voice Inbound
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div
        className={`grid grid-cols-2 gap-4 p-4 rounded-xl border mb-4 ${
          isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div>
          <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">
            Caller ID (Masked)
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-500 shrink-0" />
            <span className={`text-base font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {status !== 'IDLE' ? callerNumber : '—'}
            </span>
          </div>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">
            Duration
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span className={`text-base font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {status === 'IN_PROGRESS' || status === 'COMPLETED' ? formatDuration(duration) : '00:00'}
            </span>
          </div>
        </div>
      </div>

      {/* Audio Wave Visualizer Simulation */}
      {status === 'IN_PROGRESS' && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
            isDark ? 'bg-slate-950 border-cyan-500/30' : 'bg-cyan-50/70 border-cyan-200'
          }`}
        >
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
            <Mic className="w-4 h-4 animate-pulse" />
            <span className="text-xs md:text-sm font-bold uppercase tracking-wider">Live Audio Stream</span>
          </div>
          {/* Animated Wave Bars */}
          <div className="flex items-center gap-1.5 h-6">
            {[40, 70, 95, 60, 85, 45, 90, 75, 50, 80].map((height, i) => (
              <span
                key={i}
                className="w-1.5 bg-cyan-500 rounded-full animate-pulse"
                style={{
                  height: `${height}%`,
                  animationDelay: `${i * 120}ms`,
                  animationDuration: '800ms',
                }}
              />
            ))}
          </div>
          <Volume2 className="w-4 h-4 text-slate-400" />
        </div>
      )}

      {status === 'RINGING' && (
        <div className="text-center py-3 text-sm font-bold text-amber-600 dark:text-amber-300 bg-amber-500/10 rounded-xl border border-amber-500/20 animate-pulse">
          Connecting inbound call from {locality}...
        </div>
      )}
    </div>
  );
};
