import React from 'react';
import { FieldCrew } from '../types';
import { Users, Truck, Wrench, Clock, CheckCircle2, Navigation } from 'lucide-react';

interface ResourceAllocationPanelProps {
  crews: FieldCrew[];
  activeTicketNumber?: string;
  onDispatchCrew: (crewId: string) => void;
}

export const ResourceAllocationPanel: React.FC<ResourceAllocationPanelProps> = ({
  crews,
  activeTicketNumber,
  onDispatchCrew,
}) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Emergency Field Crew Allocation</h4>
            <p className="text-[10px] text-slate-400">Skill-based Matching &amp; Vehicle Routing</p>
          </div>
        </div>
        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
          {crews.filter((c) => c.status === 'AVAILABLE').length} Available
        </span>
      </div>

      <div className="space-y-2.5">
        {crews.map((crew) => {
          const isDispatched = crew.status === 'DISPATCHED' || crew.status === 'EN_ROUTE';
          return (
            <div
              key={crew.id}
              className={`p-3 rounded-xl border transition-all ${
                isDispatched
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-white">{crew.name}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isDispatched
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {crew.status}
                </span>
              </div>

              <div className="text-[11px] text-slate-300 space-y-1 mb-2.5">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Wrench className="w-3 h-3 text-cyan-400" />
                  <span>Lead: <strong className="text-slate-200">{crew.leadTechnician}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Truck className="w-3 h-3 text-cyan-400" />
                  <span>Vehicle: <span className="text-slate-200">{crew.vehicleId}</span></span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-slate-500" />
                    <span>{crew.currentLocation}</span>
                  </span>
                  <span className="flex items-center gap-1 text-cyan-300 font-semibold font-mono">
                    <Clock className="w-3 h-3" />
                    <span>ETA ~ {crew.etaMinutes} mins</span>
                  </span>
                </div>
              </div>

              {isDispatched ? (
                <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg flex items-center justify-between text-xs text-amber-300">
                  <span>Assigned to: <strong>{crew.assignedIncidentId}</strong></span>
                  <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    En Route
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => onDispatchCrew(crew.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/30 transition-all cursor-pointer active:scale-95"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Dispatch Crew to {activeTicketNumber || 'Incident'}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

