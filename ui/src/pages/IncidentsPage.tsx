import React, { useState } from 'react';
import { Ticket, AuditLogItem, ThemeMode, IncidentComment } from '../types';
import { realtimeClient } from '../services/realtimeClient';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Mail,
  History,
  XCircle,
  Search,
  Filter,
  Clock,
  UserCheck,
  Truck,
  Phone,
  Building2,
  MessageSquare,
  Send,
  Zap,
  ArrowUpRight,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';

interface IncidentsPageProps {
  theme: ThemeMode;
  tickets: Ticket[];
  auditLogs: AuditLogItem[];
  activeTicket: Ticket | null;
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({
  theme,
  tickets,
  auditLogs,
  activeTicket,
}) => {
  const isDark = theme === 'dark';

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Ticket State
  const [selectedTicketId, setSelectedTicketId] = useState<string>(
    activeTicket?.id || (tickets[0]?.id ?? '')
  );

  // New Comment Form State
  const [commentText, setCommentText] = useState<string>('');
  const [commentAuthor, setCommentAuthor] = useState<string>('Operator Ramesh Varma');
  const [commentRole, setCommentRole] = useState<IncidentComment['role']>('OPERATOR');

  // Resolution Modal State
  const [showResolveModal, setShowResolveModal] = useState<boolean>(false);
  const [resolveCategory, setResolveCategory] = useState<string>(
    '11kV Line Patrol & Vegetation Clearance'
  );
  const [resolveReason, setResolveReason] = useState<string>(
    'Madhapur Section line patrol completed. Tree branch cleared from 11kV Feeder F-07. VCB-07 vacuum breaker recharged at Madhapur 33kV Substation.'
  );

  // Technician Assignment Modal State
  const [showAssignTechModal, setShowAssignTechModal] = useState<boolean>(false);

  // Derive Current Ticket
  const currentTicket =
    tickets.find((t) => t.id === selectedTicketId) ||
    tickets[0] ||
    null;

  // Filter Logic
  const filteredTickets = tickets.filter((t) => {
    // Status Filter
    if (statusFilter === 'ACTIVE' && t.status !== 'OPEN' && t.status !== 'IN_PROGRESS') return false;
    if (statusFilter === 'OPEN' && t.status !== 'OPEN') return false;
    if (statusFilter === 'IN_PROGRESS' && t.status !== 'IN_PROGRESS') return false;
    if (statusFilter === 'RESOLVED' && t.status !== 'RESOLVED') return false;
    if (statusFilter === 'ESCALATED' && t.status !== 'ESCALATED') return false;

    // Priority Filter
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;

    // Section Filter
    if (sectionFilter !== 'ALL' && t.sectionOffice && !t.sectionOffice.includes(sectionFilter))
      return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        t.ticketNumber.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.locality.toLowerCase().includes(q) ||
        t.primaryAssetCode.toLowerCase().includes(q) ||
        t.serviceConnectionNo.toLowerCase().includes(q) ||
        (t.assignedTechnicianName && t.assignedTechnicianName.toLowerCase().includes(q)) ||
        (t.assignedCrewName && t.assignedCrewName.toLowerCase().includes(q)) ||
        (t.assignedCrewLead && t.assignedCrewLead.toLowerCase().includes(q)) ||
        (t.recipientContact && t.recipientContact.includes(q));
      if (!match) return false;
    }

    return true;
  });

  // KPI Counts
  const totalCount = tickets.length;
  const activeCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED').length;
  const escalatedCount = tickets.filter((t) => t.status === 'ESCALATED').length;

  const handleResolveConfirm = () => {
    if (currentTicket && resolveReason.trim()) {
      realtimeClient.resolveTicket(currentTicket.id, resolveReason, resolveCategory);
      setShowResolveModal(false);
    }
  };

  const handleReopen = () => {
    if (currentTicket) {
      realtimeClient.reopenTicket(currentTicket.id, 'Consumer callback: persistent low voltage.');
    }
  };

  const handleEscalate = () => {
    if (currentTicket) {
      realtimeClient.escalateTicket(
        currentTicket.id,
        'Escalated to TSSPDCL Cybercity Divisional Engineer for heavy breakdown equipment.'
      );
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentTicket && commentText.trim()) {
      realtimeClient.addComment(currentTicket.id, commentAuthor, commentRole, commentText);
      setCommentText('');
    }
  };

  const handleAssignTechnician = (techId: string) => {
    if (currentTicket) {
      realtimeClient.assignTechnicianToTicket(currentTicket.id, techId);
      setShowAssignTechModal(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Header & KPI Summary */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              TSSPDCL Outage Incident Management
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 font-mono">
              NOC ITIL Triage
            </span>
          </div>
          <p className={`text-xs md:text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Cybercity Circle Operational Outages, Live Field Crews, and Immutable Activity Logs
          </p>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs md:text-sm font-semibold ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <span className="text-slate-500 text-xs">Total:</span>
            <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{totalCount}</span>
          </div>
          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs md:text-sm font-semibold ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-slate-500 text-xs">Active:</span>
            <span className="font-mono text-red-600 dark:text-red-400 font-bold">{activeCount}</span>
          </div>
          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs md:text-sm font-semibold ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-500 text-xs">In Progress:</span>
            <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{inProgressCount}</span>
          </div>
          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs md:text-sm font-semibold ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-500 text-xs">Resolved:</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{resolvedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className={`p-3.5 rounded-2xl border shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Incidents', count: totalCount },
            { id: 'ACTIVE', label: 'Active & In Progress', count: activeCount + inProgressCount },
            { id: 'OPEN', label: 'Open', count: activeCount },
            { id: 'IN_PROGRESS', label: 'In Progress', count: inProgressCount },
            { id: 'RESOLVED', label: 'Resolved', count: resolvedCount },
            { id: 'ESCALATED', label: 'Escalated', count: escalatedCount },
          ].map((tab) => {
            const isSel = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSel
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                    : isDark
                    ? 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                    isSel
                      ? 'bg-cyan-700 text-white'
                      : isDark
                      ? 'bg-slate-800/80 text-slate-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Priority & Section Selectors and Search Box */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Priority Filter */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={`text-xs rounded-xl px-2.5 py-1.5 border outline-none cursor-pointer ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              <option value="ALL">All Priorities</option>
              <option value="P1_CRITICAL">P1 - Critical</option>
              <option value="P2_HIGH">P2 - High</option>
              <option value="P3_MEDIUM">P3 - Medium</option>
              <option value="P4_LOW">P4 - Low</option>
            </select>
          </div>

          {/* Section Filter */}
          <div className="relative">
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className={`text-xs rounded-xl px-2.5 py-1.5 border outline-none cursor-pointer ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              <option value="ALL">All Section Offices</option>
              <option value="Madhapur">Madhapur Section</option>
              <option value="Kondapur">Kondapur Section</option>
              <option value="Gachibowli">Gachibowli Section</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Ticket, Asset, USC..."
              className={`w-full text-xs rounded-xl pl-8 pr-3 py-1.5 border outline-none ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-800 placeholder:text-slate-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Main Split Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Ticket Master List (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5 flex flex-col">
          <div className="flex items-center justify-between text-xs px-1 text-slate-400">
            <span>Showing {filteredTickets.length} Incident Tickets</span>
            {(statusFilter !== 'ALL' || priorityFilter !== 'ALL' || sectionFilter !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setStatusFilter('ALL');
                  setPriorityFilter('ALL');
                  setSectionFilter('ALL');
                  setSearchQuery('');
                }}
                className="text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset Filters
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {filteredTickets.length === 0 ? (
              <div
                className={`p-8 rounded-2xl border text-center text-xs ${
                  isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
                <p className="font-semibold">No incidents match the selected filters</p>
                <p className="text-[11px] mt-1">Try clearing filters or search terms.</p>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = t.id === currentTicket?.id;
                const isResolved = t.status === 'RESOLVED';
                const isP1 = t.priority === 'P1_CRITICAL';

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-sm relative ${
                      isSelected
                        ? isDark
                          ? 'bg-slate-800/90 border-cyan-500 shadow-cyan-500/10'
                          : 'bg-cyan-50/70 border-cyan-500 shadow-md'
                        : isDark
                        ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-mono text-cyan-600 dark:text-cyan-400">{t.ticketNumber}</span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            isP1
                              ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                              : t.priority === 'P2_HIGH'
                              ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                              : 'bg-slate-500/20 text-slate-500 border border-slate-500/30'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isResolved
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : t.status === 'ESCALATED'
                            ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                            : 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    {/* Summary */}
                    <h4 className="text-base font-bold leading-snug line-clamp-2 mb-1">{t.summary}</h4>
                    <p className={`text-sm mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {t.locality}
                    </p>

                    {/* Asset & Consumers Meta */}
                    <div
                      className={`p-2.5 rounded-xl border text-sm flex items-center justify-between mb-2.5 ${
                        isDark ? 'bg-slate-950/70 border-slate-800/90' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-cyan-500" />
                        <span className="font-mono font-bold">{t.primaryAssetCode}</span>
                      </div>
                      <span className={t.consumersAffected ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-500 font-medium'}>
                        {t.consumersAffected ? `${t.consumersAffected} meters` : 'Isolated Meter'}
                      </span>
                    </div>

                    {/* Timestamps & Personnel Footer */}
                    <div
                      className={`flex items-center justify-between text-xs md:text-sm pt-2 border-t ${
                        isDark ? 'border-slate-800/60 text-slate-400' : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>Created: {t.createdAt}</span>
                      </div>

                      {isResolved ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Resolved ({t.durationText || 'Done'})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold">
                          <MessageSquare className="w-4 h-4" />
                          <span>{t.comments?.length || 0} notes</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Incident Deep-Dive View (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          {currentTicket ? (
            <div
              className={`p-5 rounded-2xl border shadow-sm flex-1 flex flex-col justify-between overflow-y-auto ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="space-y-4">
                {/* Header & Status Actions */}
                <div
                  className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                      <span className="text-2xl md:text-3xl font-black font-mono tracking-tight text-cyan-600 dark:text-cyan-400">
                        {currentTicket.ticketNumber}
                      </span>
                      <span
                        className={`text-xs md:text-sm font-bold px-3 py-1 rounded-full uppercase ${
                          currentTicket.priority === 'P1_CRITICAL'
                            ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                            : currentTicket.priority === 'P2_HIGH'
                            ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                            : 'bg-slate-500/20 text-slate-500 border border-slate-500/30'
                        }`}
                      >
                        {currentTicket.priority}
                      </span>
                      <span
                        className={`text-xs md:text-sm font-bold px-3 py-1 rounded-full ${
                          currentTicket.status === 'RESOLVED'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : currentTicket.status === 'IN_PROGRESS'
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : currentTicket.status === 'ESCALATED'
                            ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                            : 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {currentTicket.status}
                      </span>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold leading-relaxed">{currentTicket.summary}</h3>
                  </div>

                  {/* Operator Controls */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {currentTicket.status !== 'RESOLVED' ? (
                      <>
                        <button
                          onClick={() => setShowResolveModal(true)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Resolve Incident</span>
                        </button>

                        <button
                          onClick={() => setShowAssignTechModal(true)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-bold shadow-md transition-all cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Assign Technician</span>
                        </button>

                        {currentTicket.status !== 'ESCALATED' && (
                          <button
                            onClick={handleEscalate}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/80 hover:bg-red-500 text-white text-sm font-bold shadow-md shadow-red-600/30 transition-all cursor-pointer"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            <span>Escalate DE</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={handleReopen}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold shadow-md shadow-amber-600/30 transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reopen Incident</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Lifecycle Timestamps & Section Meta Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                  <div
                    className={`p-3.5 rounded-xl border ${
                      isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-xs text-slate-500 block uppercase font-bold">Created At</span>
                    <span className="text-sm md:text-base font-mono font-bold mt-0.5 block">{currentTicket.createdAt}</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border ${
                      isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-xs text-slate-500 block uppercase font-bold">Resolved At</span>
                    <span
                      className={`text-sm md:text-base font-mono font-bold mt-0.5 block ${
                        currentTicket.resolvedAt ? 'text-emerald-500' : 'text-amber-500'
                      }`}
                    >
                      {currentTicket.resolvedAt || 'Active / Triage'}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border ${
                      isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-xs text-slate-500 block uppercase font-bold">Duration / MTTR</span>
                    <span className="text-sm md:text-base font-mono font-bold mt-0.5 block">
                      {currentTicket.durationText || (currentTicket.resolvedAt ? '45m' : 'In Progress')}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border ${
                      isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-xs text-slate-500 block uppercase font-bold">TSSPDCL Section</span>
                    <span className="text-sm md:text-base font-bold text-cyan-600 dark:text-cyan-400 mt-0.5 block truncate">
                      {currentTicket.sectionOffice || 'Cybercity Circle'}
                    </span>
                  </div>
                </div>

                {/* Who Worked On It: Personnel & Assigned Field Gang */}
                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold flex items-center gap-1.5 text-cyan-500 dark:text-cyan-400">
                      <UserCheck className="w-4 h-4" />
                      <span>Personnel &amp; Field Lineman Assigned</span>
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      TSSPDCL Operation &amp; Maintenance
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-cyan-500 shrink-0" />
                        <span className="text-slate-500 dark:text-slate-400">Assigned Tech:</span>
                        <strong className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {currentTicket.assignedTechnicianName || currentTicket.assignedCrewLead || 'K. Ramulu'}
                        </strong>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-500 dark:text-slate-400">Role:</span>
                        <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                          {currentTicket.assignedTechnicianRole || 'Senior Lineman'}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 ml-2">Phone:</span>
                        <span className="font-mono font-medium">
                          {currentTicket.assignedTechnicianPhone || currentTicket.assignedCrewPhone || '+91 94408 12301'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-cyan-500 shrink-0" />
                        <span className="text-slate-500 dark:text-slate-400">Squad &amp; Fleet:</span>
                        <span className="truncate font-medium">
                          {currentTicket.assignedCrewName || 'Madhapur Emergency Gang'} ({currentTicket.assignedCrewVehicle || 'TS-09-EA-4412'})
                        </span>
                      </div>
                    </div>

                    <div
                      className={`space-y-1.5 border-t md:border-t-0 md:border-l md:pl-4 pt-2 md:pt-0 ${
                        isDark ? 'border-slate-800' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 dark:text-slate-400">NOC Dispatcher:</span>
                        <strong className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {currentTicket.assignedOperatorName || 'Operator Ramesh Varma (OP-842)'}
                        </strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-cyan-500 shrink-0" />
                        <span className="text-slate-500 dark:text-slate-400">Substation:</span>
                        <span className="font-medium">{currentTicket.substationName || 'Madhapur 33/11kV Substation'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 dark:text-slate-400">Consumer USC:</span>
                        <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{currentTicket.serviceConnectionNo}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resolution Report (Highlighted if resolved) */}
                {currentTicket.resolvedAt && (
                  <div className="bg-emerald-950/30 border border-emerald-800/60 p-4 rounded-xl text-sm text-emerald-300">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="font-bold text-emerald-200 text-sm md:text-base">Official TSSPDCL Restoration Report</span>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {currentTicket.resolutionCategory || 'Restoration Verified'}
                      </span>
                    </div>
                    <p className="leading-relaxed text-sm">{currentTicket.resolutionReason}</p>
                    <div className="mt-2 text-xs text-emerald-400 flex items-center justify-between border-t border-emerald-800/40 pt-2 font-medium">
                      <span>Restored at: {currentTicket.resolvedAt}</span>
                      <span>Verified by: {currentTicket.assignedOperatorName || 'NOC Operator'}</span>
                    </div>
                  </div>
                )}

                {/* Consumer SMS Dispatch Gate */}
                <div
                  className={`p-3.5 rounded-xl border text-sm flex items-center justify-between ${
                    isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-cyan-500 shrink-0" />
                    <div>
                      <span className="font-bold block text-sm">
                        TSSPDCL Automated Consumer Notice ({currentTicket.acknowledgementChannel})
                      </span>
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Sent to: {currentTicket.recipientContact}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded">
                    {currentTicket.acknowledgementStatus}
                  </span>
                </div>

                {/* Activity & Comments Thread (Work Log) */}
                <div
                  className={`p-4 rounded-xl border space-y-3.5 ${
                    isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div
                    className={`flex items-center justify-between border-b pb-2.5 ${
                      isDark ? 'border-slate-800' : 'border-slate-200'
                    }`}
                  >
                    <span className="text-sm font-bold flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                      <MessageSquare className="w-4 h-4" />
                      <span>Activity Log &amp; Work Comments ({currentTicket.comments?.length || 0})</span>
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Immutable Thread</span>
                  </div>

                  {/* Chronological Comments Stream */}
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {currentTicket.comments && currentTicket.comments.length > 0 ? (
                      currentTicket.comments.map((comm) => (
                        <div
                          key={comm.id}
                          className={`p-3 rounded-xl border text-sm ${
                            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5 text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{comm.author}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  comm.role === 'AI_SYSTEM'
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                    : comm.role === 'FIELD_CREW'
                                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                    : comm.role === 'SUPERVISOR'
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                {comm.role}
                              </span>
                            </div>
                            <span className="text-slate-400 text-xs font-mono">{comm.timestamp}</span>
                          </div>
                          <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{comm.content}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-4 text-sm text-slate-500">No work notes yet.</p>
                    )}
                  </div>

                  {/* Add Work Note Form */}
                  <form
                    onSubmit={handleAddComment}
                    className={`pt-3 border-t space-y-2.5 ${
                      isDark ? 'border-slate-800' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <select
                        value={commentRole}
                        onChange={(e) => {
                          const role = e.target.value as IncidentComment['role'];
                          setCommentRole(role);
                          if (role === 'OPERATOR') setCommentAuthor('Operator Ramesh Varma');
                          if (role === 'FIELD_CREW') setCommentAuthor('K. Ramulu (Gang Lead)');
                          if (role === 'SUPERVISOR') setCommentAuthor('DE / Technical Cybercity');
                        }}
                        className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border outline-none ${
                          isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      >
                        <option value="OPERATOR">NOC Operator</option>
                        <option value="FIELD_CREW">Field Gang Lineman</option>
                        <option value="SUPERVISOR">Section AE / DE</option>
                      </select>
                      <span className="text-xs text-slate-400">Author: {commentAuthor}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add internal note, crew update, or patrol remark..."
                        className={`flex-1 text-sm rounded-xl px-3.5 py-2.5 border outline-none ${
                          isDark
                            ? 'bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-500'
                            : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'
                        }`}
                      />
                      <button
                        type="submit"
                        disabled={!commentText.trim()}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-sm font-bold cursor-pointer shadow-md"
                      >
                        <Send className="w-4 h-4" />
                        <span>Post Note</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs">No incident selected.</div>
          )}
        </div>
      </div>

      {/* Resolution Modal */}
      {showResolveModal && currentTicket && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`border rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-fade-in ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Mark Outage Incident Resolved — {currentTicket.ticketNumber}</span>
              </h3>
              <button onClick={() => setShowResolveModal(false)} className="opacity-60 hover:opacity-100 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm opacity-80 mb-3">
              Record official TSSPDCL resolution category and lineman remarks. Connected grid assets will restore to
              healthy status across the operations map.
            </p>

            {/* Resolution Category Dropdown */}
            <div className="mb-3 space-y-1">
              <label className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Resolution Category:
              </label>
              <select
                value={resolveCategory}
                onChange={(e) => setResolveCategory(e.target.value)}
                className={`w-full rounded-xl p-2.5 text-sm outline-none cursor-pointer border ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="11kV Line Patrol & Vegetation Clearance">
                  11kV Line Patrol &amp; Vegetation Clearance (Tree branch removed)
                </option>
                <option value="Transformer 11kV HG Fuse Replaced">
                  Transformer 11kV HG/DO Fuse Replaced &amp; Tested
                </option>
                <option value="11kV Line Jumper Re-crimped & Insulator Cleaned">
                  11kV Line Jumper Re-crimped &amp; Insulator Cleaned
                </option>
                <option value="Neutral Earthing Pit Reconditioned">
                  Neutral Earthing Pit Reconditioned &amp; Clamped
                </option>
                <option value="Underground XLPE Cable Fault Jointing">
                  Underground XLPE Cable Fault Jointing &amp; Meggered
                </option>
                <option value="Vacuum Circuit Breaker Recharged">
                  Substation Vacuum Circuit Breaker (VCB) Recharged
                </option>
              </select>
            </div>

            {/* Remarks Textarea */}
            <div className="mb-4 space-y-1">
              <label className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Lineman / Operator Remarks:
              </label>
              <textarea
                rows={3}
                value={resolveReason}
                onChange={(e) => setResolveReason(e.target.value)}
                className={`w-full rounded-xl p-2.5 text-sm outline-none border focus:ring-1 focus:ring-emerald-500 ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowResolveModal(false)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleResolveConfirm}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                Confirm Resolution &amp; Re-energize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Technician Assignment Modal */}
      {showAssignTechModal && currentTicket && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`border rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-fade-in ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-cyan-400" />
                <span>Assign Field Technician to {currentTicket.ticketNumber}</span>
              </h3>
              <button onClick={() => setShowAssignTechModal(false)} className="opacity-60 hover:opacity-100 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm opacity-80 mb-3">
              Select an available TSSPDCL lineman or engineer to take personal charge of this outage:
            </p>

            <div className="space-y-2.5 mb-4 max-h-72 overflow-y-auto pr-1">
              {realtimeClient
                .getState()
                .crews.flatMap((c) => (c.members || []).map((m) => ({ ...m, squad: c.name, vehicle: c.vehicleId })))
                .map((tech) => {
                  const isAvail = tech.status === 'AVAILABLE';
                  const isAssigned = tech.status === 'ASSIGNED';

                  return (
                    <button
                      key={tech.id}
                      onClick={() => handleAssignTechnician(tech.id)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-sm transition-all cursor-pointer ${
                        isAvail
                          ? isDark
                            ? 'border-slate-800 bg-slate-950/80 hover:border-cyan-500'
                            : 'border-slate-200 bg-slate-50 hover:border-cyan-500'
                          : isAssigned
                          ? 'border-amber-500/30 bg-amber-950/20 hover:border-amber-500'
                          : isDark
                          ? 'border-slate-800 bg-slate-950/40 opacity-60'
                          : 'border-slate-200 bg-slate-100 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 font-mono ${
                            isAssigned
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : isAvail
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                              : 'bg-slate-700/50 text-slate-400'
                          }`}
                        >
                          {tech.avatarInitials}
                        </div>
                        <div className="min-w-0">
                          <strong className={`block truncate text-sm ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{tech.name}</strong>
                          <span className="text-xs text-cyan-500 dark:text-cyan-400 block truncate font-medium">{tech.role}</span>
                          <span className="text-xs text-slate-400 block truncate">
                            {tech.squad} • {tech.vehicle}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 ml-2">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                            isAssigned
                              ? 'bg-amber-500/20 text-amber-400'
                              : isAvail
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-700/50 text-slate-400'
                          }`}
                        >
                          {tech.status}
                        </span>
                        <span className="text-xs text-cyan-500 font-semibold mt-1">Assign Tech</span>
                      </div>
                    </button>
                  );
                })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowAssignTechModal(false)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
