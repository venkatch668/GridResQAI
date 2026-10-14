import React from 'react';
import { DashboardState } from '../services/realtimeClient';
import { LiveCallCard } from './LiveCallCard';
import { TranscriptStream } from './TranscriptStream';
import { DiagnosisCard } from './DiagnosisCard';
import { TicketDrawer } from './TicketDrawer';
import { ResourceAllocationPanel } from './ResourceAllocationPanel';
import {
  ChevronRight,
  ChevronLeft,
  AlertOctagon,
  Users,
  Phone,
  Sparkles,
  X,
  FileText,
} from 'lucide-react';

interface RightDrawerMenuProps {
  state: DashboardState;
  isOpen: boolean;
  activeTab: 'incidents' | 'calls' | 'diagnosis' | 'resources';
  onToggle: (open?: boolean) => void;
  onTabChange: (tab: 'incidents' | 'calls' | 'diagnosis' | 'resources') => void;
  onDispatchCrew: (crewId: string) => void;
}

export const RightDrawerMenu: React.FC<RightDrawerMenuProps> = ({
  state,
  isOpen,
  activeTab,
  onToggle,
  onTabChange,
  onDispatchCrew,
}) => {
  return (
    <>
      {/* Floating Toggle Button when Drawer is Closed */}
      {!isOpen && (
        <button
          onClick={() => onToggle(true)}
          className="fixed right-0 top-24 z-40 bg-gradient-to-l from-cyan-600 to-blue-600 text-white p-3 rounded-l-2xl shadow-2xl flex items-center gap-2 border-y border-l border-cyan-400 hover:from-cyan-500 hover:to-blue-500 transition-all cursor-pointer group animate-fade-in"
          title="Open Operations & Incidents Menu"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-amber-300" />
              Incidents &amp; Ops
            </span>
            <span className="text-[10px] text-cyan-100 font-mono">
              {state.callStatus === 'IN_PROGRESS' || state.callStatus === 'RINGING'
                ? '🔴 1 Active Call'
                : '1 Open Ticket'}
            </span>
          </div>
        </button>
      )}

      {/* Expanded Right Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-[440px] max-w-[95vw] bg-slate-900/95 border-l border-slate-800 shadow-2xl z-50 flex flex-col transition-transform duration-300 backdrop-blur-xl ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header & Tabs */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/80 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Operations &amp; Triage Hub</h3>
                <p className="text-[10px] text-slate-400">Live Telephony, Incidents &amp; Field Dispatch</p>
              </div>
            </div>

            <button
              onClick={() => onToggle(false)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Close Menu"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px] font-medium">
            <button
              onClick={() => onTabChange('incidents')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'incidents'
                  ? 'bg-cyan-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Incidents</span>
            </button>

            <button
              onClick={() => onTabChange('resources')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'resources'
                  ? 'bg-cyan-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Crews</span>
            </button>

            <button
              onClick={() => onTabChange('calls')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'calls'
                  ? 'bg-cyan-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call</span>
              {state.callStatus === 'IN_PROGRESS' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>

            <button
              onClick={() => onTabChange('diagnosis')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'diagnosis'
                  ? 'bg-cyan-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI</span>
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {activeTab === 'incidents' && (
            <div className="space-y-4 animate-fade-in">
              <TicketDrawer
                tickets={state.ticketsList}
                auditLogs={state.auditLogs}
                activeTicket={state.activeTicket}
              />
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-4 animate-fade-in">
              <ResourceAllocationPanel
                crews={state.crews}
                activeTicketNumber={state.activeTicket?.ticketNumber}
                onDispatchCrew={onDispatchCrew}
              />
            </div>
          )}

          {activeTab === 'calls' && (
            <div className="space-y-3 animate-fade-in">
              <LiveCallCard
                status={state.callStatus}
                duration={state.callDuration}
                callerNumber={state.currentScenario.callerNumber}
                locality={state.currentScenario.locality}
              />
              <TranscriptStream transcripts={state.transcripts} />
            </div>
          )}

          {activeTab === 'diagnosis' && (
            <div className="space-y-4 animate-fade-in">
              <DiagnosisCard diagnosis={state.activeIncidentDiagnosis} />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

