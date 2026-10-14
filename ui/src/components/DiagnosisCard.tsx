import React from 'react';
import { DiagnosisResult, ThemeMode } from '../types';
import { Sparkles, CheckCircle2, AlertOctagon, HelpCircle, ShieldCheck, ListChecks } from 'lucide-react';

interface DiagnosisCardProps {
  theme?: ThemeMode;
  diagnosis: DiagnosisResult | null;
}

export const DiagnosisCard: React.FC<DiagnosisCardProps> = ({ theme = 'light', diagnosis }) => {
  const isDark = theme === 'dark';

  if (!diagnosis) {
    return (
      <div
        className={`rounded-2xl border p-8 shadow-sm flex flex-col items-center justify-center text-center h-[340px] transition-colors ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div
          className={`p-4 rounded-full mb-3 ${
            isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'
          }`}
        >
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className={`text-base font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
          Gemini Bounded Diagnosis
        </h3>
        <p className={`text-xs md:text-sm max-w-sm mt-1.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          Awaiting caller location resolution and synthetic telemetry evidence extraction...
        </p>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (diagnosis.status) {
      case 'DIAGNOSED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30">
            <CheckCircle2 className="w-4 h-4 text-purple-500" />
            DIAGNOSED (GROUNDED)
          </span>
        );
      case 'INSUFFICIENT_EVIDENCE':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
            <AlertOctagon className="w-4 h-4 text-amber-500" />
            INSUFFICIENT EVIDENCE
          </span>
        );
      case 'NEEDS_CLARIFICATION':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30">
            <HelpCircle className="w-4 h-4 text-cyan-500" />
            NEEDS CLARIFICATION
          </span>
        );
    }
  };

  return (
    <div
      className={`rounded-2xl border p-4 md:p-5 shadow-sm flex flex-col transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      <div
        className={`flex items-center justify-between pb-3.5 border-b mb-4 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isDark ? 'bg-purple-950 text-purple-400 border-purple-800' : 'bg-purple-50 text-purple-600 border-purple-100'
            }`}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Gemini Evidence-Grounded Diagnosis
            </h3>
            <p className={`text-xs md:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Bounded Reasoning &amp; Strict Evidence Constraint
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Primary Hypotheses */}
      <div className="space-y-3 mb-4">
        {diagnosis.hypotheses.map((hypo, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border transition-all ${
              isDark
                ? 'bg-slate-950/70 border-slate-800/90 hover:border-purple-500/30'
                : 'bg-slate-50 border-slate-200 hover:border-purple-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {hypo.title}
              </span>
              <span className="text-xs md:text-sm font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20">
                {Math.round(hypo.confidenceScore * 100)}% Confidence
              </span>
            </div>
            <p className={`text-sm leading-relaxed mb-3.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {hypo.explanation}
            </p>

            {/* Clickable Evidence Badges */}
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs md:text-sm text-slate-500 font-bold">Verified Evidence:</span>
              {hypo.evidenceIds.map((evid) => (
                <span
                  key={evid}
                  className={`text-xs md:text-sm px-3 py-1 rounded-lg font-mono font-bold transition-colors ${
                    isDark
                      ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60 hover:bg-purple-900'
                      : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                  }`}
                  title="Verified telemetry artifact in synthetic grid state"
                >
                  {evid}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Customer vs Operator Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-4">
        <div
          className={`p-4 rounded-xl border ${
            isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <span className="text-xs uppercase font-bold text-cyan-600 dark:text-cyan-400 block mb-1.5 tracking-wider">
            Customer-Safe Explanation
          </span>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {diagnosis.customerSafeSummary}
          </p>
        </div>
        <div
          className={`p-4 rounded-xl border ${
            isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <span className="text-xs uppercase font-bold text-amber-600 dark:text-amber-400 block mb-1.5 tracking-wider">
            Operator Technical Brief
          </span>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {diagnosis.operatorSummary}
          </p>
        </div>
      </div>

      {/* Recommended Verification Steps */}
      <div
        className={`p-4 rounded-xl border ${
          isDark ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 mb-2.5">
          <ListChecks className="w-5 h-5 text-emerald-500" />
          <span>Recommended Field Verification Steps</span>
        </div>
        <ul className="space-y-2">
          {diagnosis.nextVerificationSteps.map((step, idx) => (
            <li key={idx} className={`text-sm flex items-start gap-2.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <span className="text-emerald-500 font-bold">•</span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Guardrail badge */}
      <div
        className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-between text-xs md:text-sm gap-2 ${
          isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
        }`}
      >
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero Hallucination Guard: All citations ground in synthetic grid truth</span>
        </div>
        <span className="font-mono">{diagnosis.generatedAt}</span>
      </div>
    </div>
  );
};
