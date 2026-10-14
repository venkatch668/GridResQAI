import React, { useState } from 'react';
import { Ticket, AuditLogItem } from '../types';
import { realtimeClient } from '../services/realtimeClient';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Mail,
  History,
  Send,
  XCircle,
  ExternalLink,
} from 'lucide-react';

interface TicketDrawerProps {
  tickets: Ticket[];
  auditLogs: AuditLogItem[];
  activeTicket: Ticket | null;
}

export const TicketDrawer: React.FC<TicketDrawerProps> = ({
  tickets,
  auditLogs,
  activeTicket,
}) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(activeTicket || tickets[0] || null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveReason, setResolveReason] = useState(
    'Field inspection completed. Overcurrent breaker reset on Feeder F-04 and load normalized.'
  );

  const currentTicket = selectedTicket || activeTicket || tickets[0];

  const handleResolve = () => {
    if (currentTicket && resolveReason.trim()) {
      realtimeClient.resolveTicket(currentTicket.id, resolveReason);
      setShowResolveModal(false);
    }
  };

  const handleEscalate = () => {
    if (currentTicket) {
      realtimeClient.escalateTicket(currentTicket.id, 'Dispatched Emergency Mobile Substation van');
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Incident Tickets &amp; Audit Trail</h3>
            <p className="text-[10px] text-slate-400">Human-in-the-Loop Operational Decisions</p>
          </div>
        </div>

        {currentTicket && currentTicket.status === 'OPEN' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowResolveModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resolve Outage</span>
            </button>
            <button
              onClick={handleEscalate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-600/30 transition-all cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Escalate Crew</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Ticket Card */}
        {currentTicket ? (
          <div className="lg:col-span-2 bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white font-mono">
                    {currentTicket.ticketNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      currentTicket.priority === 'P1_CRITICAL'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : currentTicket.priority === 'P2_HIGH'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {currentTicket.priority}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    currentTicket.status === 'RESOLVED'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : currentTicket.status === 'ESCALATED'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {currentTicket.status}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-slate-200 mb-1">{currentTicket.summary}</h4>
              <p className="text-xs text-slate-400 mb-3">
                Locality: <span className="text-slate-200 font-medium">{currentTicket.locality}</span> | Asset:{' '}
                <span className="text-cyan-400 font-mono">{currentTicket.primaryAssetCode}</span>
              </p>

              {/* Automated Customer Acknowledgement Status */}
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="text-slate-300 font-medium block">
                      Customer Acknowledgement ({currentTicket.acknowledgementChannel})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Dispatched to: {currentTicket.recipientContact}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                  {currentTicket.acknowledgementStatus}
                </span>
              </div>

              {currentTicket.resolutionReason && (
                <div className="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-800/40 text-xs text-emerald-200 mb-2">
                  <span className="font-bold block mb-0.5">Operator Resolution Log:</span>
                  <p>{currentTicket.resolutionReason}</p>
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800 flex items-center justify-between">
              <span>Created at: {currentTicket.createdAt}</span>
              {currentTicket.resolvedAt && <span>Resolved at: {currentTicket.resolvedAt}</span>}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex items-center justify-center text-slate-500 text-xs">
            No incident tickets generated yet.
          </div>
        )}

        {/* Live Audit Log Stream */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col h-[230px]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2 pb-2 border-b border-slate-800">
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Immutable Audit Trail</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="text-xs bg-slate-900/80 p-2 rounded border border-slate-800/80">
                <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400 mb-0.5">
                  <span className="font-semibold text-cyan-300">{log.action}</span>
                  <span>{log.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-tight">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operator Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-md w-full shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Resolve Outage Ticket</span>
              </h3>
              <button
                onClick={() => setShowResolveModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              Provide justification for marking <strong className="text-white">{currentTicket?.ticketNumber}</strong> as resolved. This action updates the synthetic grid state to healthy and logs the operator decision in the audit repository.
            </p>
            <textarea
              rows={3}
              value={resolveReason}
              onChange={(e) => setResolveReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none mb-4"
              placeholder="Enter resolution notes..."
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowResolveModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

