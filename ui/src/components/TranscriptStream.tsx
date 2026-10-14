import React, { useEffect, useRef } from 'react';
import { TranscriptSegment, ThemeMode } from '../types';
import { MessageSquare, Bot, User, Cpu } from 'lucide-react';

interface TranscriptStreamProps {
  theme?: ThemeMode;
  transcripts: TranscriptSegment[];
}

export const TranscriptStream: React.FC<TranscriptStreamProps> = ({ theme = 'light', transcripts }) => {
  const isDark = theme === 'dark';
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm flex flex-col h-[320px] transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      <div
        className={`flex items-center justify-between pb-3.5 border-b ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isDark ? 'bg-slate-800 text-cyan-400 border-slate-700' : 'bg-cyan-50 text-cyan-600 border-cyan-100'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Live Voice Transcript
            </h3>
            <p className={`text-xs md:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Turn-based Speech Normalization
            </p>
          </div>
        </div>
        <span
          className={`text-xs md:text-sm font-mono font-bold px-3 py-1 rounded-xl border ${
            isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          {transcripts.length} segments
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto pt-3.5 space-y-3.5 pr-1">
        {transcripts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
            <MessageSquare className="w-10 h-10 mb-2 stroke-[1.5] text-slate-300 dark:text-slate-600" />
            <span className="font-semibold text-base">Awaiting speech input...</span>
            <span className="text-xs md:text-sm text-slate-400 mt-1">Click &quot;Simulate Consumer 1912 Call&quot; to begin dialog</span>
          </div>
        ) : (
          transcripts.map((segment) => {
            if (segment.speaker === 'SYSTEM') {
              return (
                <div key={segment.id} className="flex justify-center my-2">
                  <div
                    className={`text-xs md:text-sm px-3.5 py-1.5 rounded-full border flex items-center gap-2 font-mono font-medium ${
                      isDark
                        ? 'bg-slate-800/80 text-cyan-300 border-cyan-500/20'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Cpu className="w-4 h-4 text-cyan-500" />
                    <span>{segment.text}</span>
                  </div>
                </div>
              );
            }

            const isAgent = segment.speaker === 'AI_AGENT';
            return (
              <div
                key={segment.id}
                className={`flex gap-3 items-start ${isAgent ? 'flex-row' : 'flex-row-reverse'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs ${
                    isAgent
                      ? 'bg-cyan-600/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30'
                      : 'bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30'
                  }`}
                >
                  {isAgent ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-sm md:text-base shadow-sm ${
                    isAgent
                      ? isDark
                        ? 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none'
                        : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-tl-none'
                      : isDark
                      ? 'bg-cyan-950/50 text-cyan-100 border border-cyan-500/30 rounded-tr-none'
                      : 'bg-cyan-50 text-slate-900 border border-cyan-200 rounded-tr-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-xs md:text-sm text-slate-400 mb-1">
                    <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {isAgent ? 'GridResQ Voice AI' : 'Customer'}
                    </span>
                    <span className="font-mono text-xs">{segment.timestamp}</span>
                  </div>
                  <p className="leading-relaxed font-normal">{segment.text}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
