import React from 'react';
import { DiagnosisResult, ThemeMode } from '../types';
import { DiagnosisCard } from '../components/DiagnosisCard';
import { ShieldCheck, Database } from 'lucide-react';

interface DiagnosisPageProps {
  theme: ThemeMode;
  diagnosis: DiagnosisResult | null;
}

export const DiagnosisPage: React.FC<DiagnosisPageProps> = ({ theme, diagnosis }) => {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-4 animate-fade-in">
      <div
        className={`flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <div>
          <h2 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Gemini Bounded Outage Diagnosis Engine
          </h2>
          <p className={`text-xs md:text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Strict Evidence Verification Against TSSPDCL Cybercity Grid Telemetry
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs md:text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero Hallucination Guard Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <DiagnosisCard theme={theme} diagnosis={diagnosis} />
        </div>

        <div className="lg:col-span-4 space-y-3">
          <div
            className={`p-4 md:p-5 rounded-2xl border shadow-sm transition-colors ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-bold mb-2">
              <Database className="w-4 h-4 text-cyan-500" />
              <span className={isDark ? 'text-white' : 'text-slate-900'}>
                Grounded Evidence Contracts
              </span>
            </div>
            <p className={`text-xs md:text-sm leading-relaxed mb-3.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Gemini is strictly fed real-time sensor packets from the TSSPDCL synthetic repository:
            </p>
            <ul className="space-y-2 text-xs md:text-sm font-mono">
              <li
                className={`p-2.5 rounded-xl border flex items-center justify-between font-semibold ${
                  isDark ? 'bg-black/20 border-slate-800/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <span>EVID-SS-MDP-VCB07-TRIP</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">VERIFIED</span>
              </li>
              <li
                className={`p-2.5 rounded-xl border flex items-center justify-between font-semibold ${
                  isDark ? 'bg-black/20 border-slate-800/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <span>EVID-DTR101-ZERO-VOLT</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">VERIFIED</span>
              </li>
              <li
                className={`p-2.5 rounded-xl border flex items-center justify-between font-semibold ${
                  isDark ? 'bg-black/20 border-slate-800/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <span>EVID-DTR102-ZERO-VOLT</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">VERIFIED</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
