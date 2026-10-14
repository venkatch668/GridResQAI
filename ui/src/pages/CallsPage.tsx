import React from 'react';
import { CallStatus, TranscriptSegment, ThemeMode } from '../types';
import { realtimeClient } from '../services/realtimeClient';
import { LiveCallCard } from '../components/LiveCallCard';
import { TranscriptStream } from '../components/TranscriptStream';
import { Play } from 'lucide-react';

interface CallsPageProps {
  theme: ThemeMode;
  callStatus: CallStatus;
  duration: number;
  callerNumber: string;
  locality: string;
  transcripts: TranscriptSegment[];
}

export const CallsPage: React.FC<CallsPageProps> = ({
  theme,
  callStatus,
  duration,
  callerNumber,
  locality,
  transcripts,
}) => {
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
            TSSPDCL 1912 Helpline &amp; Telephony Desk
          </h2>
          <p className={`text-xs md:text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Exotel Inbound Telephony Gate &amp; Realtime Conversational Voice Transcription
          </p>
        </div>

        <button
          onClick={() => realtimeClient.runScenario(realtimeClient.getState().currentScenario.id)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs md:text-sm font-semibold shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
        >
          <Play className="w-4 h-4" />
          <span>Simulate Consumer 1912 Call</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Live Telephony Gate Card (5 cols) */}
        <div className="lg:col-span-5">
          <LiveCallCard
            theme={theme}
            status={callStatus}
            duration={duration}
            callerNumber={callerNumber}
            locality={locality}
          />
        </div>

        {/* Live Voice Transcript Stream (7 cols) */}
        <div className="lg:col-span-7">
          <TranscriptStream theme={theme} transcripts={transcripts} />
        </div>
      </div>
    </div>
  );
};
