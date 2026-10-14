import React, { useState } from 'react';
import { FieldCrew, ThemeMode, Ticket, CrewMember } from '../types';
import { realtimeClient } from '../services/realtimeClient';
import {
  Users,
  Truck,
  Wrench,
  Clock,
  CheckCircle2,
  Navigation,
  Phone,
  ShieldCheck,
  MapPin,
  AlertTriangle,
  RotateCcw,
  Zap,
  Radio,
  Search,
  ExternalLink,
  UserCheck,
  UserX,
  Compass,
  UserPlus,
  LayoutGrid,
  List,
} from 'lucide-react';

interface CrewsPageProps {
  theme: ThemeMode;
  crews: FieldCrew[];
  tickets?: Ticket[];
  activeTicketNumber?: string;
}

export const CrewsPage: React.FC<CrewsPageProps> = ({
  theme,
  crews,
  tickets = [],
  activeTicketNumber,
}) => {
  const isDark = theme === 'dark';
  const [viewMode, setViewMode] = useState<'GANGS' | 'INDIVIDUALS'>('GANGS');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'ASSIGNED'>('ALL');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTechModal, setSelectedTechModal] = useState<CrewMember | null>(null);

  // Flatten all individual technicians
  const allTechnicians: CrewMember[] = crews.flatMap((c) =>
    (c.members || []).map((m) => ({
      ...m,
      gangId: m.gangId || c.id,
      gangName: m.gangName || c.name,
      vehicleId: m.vehicleId || c.vehicleId,
      sectionOffice: m.sectionOffice || c.sectionOffice,
    }))
  );

  // Derived KPI metrics
  const totalLinemenCount = allTechnicians.length;
  const availableLinemenCount = allTechnicians.filter((m) => m.status === 'AVAILABLE').length;
  const assignedLinemenCount = allTechnicians.filter((m) => m.status === 'ASSIGNED').length;
  const restingLinemenCount = allTechnicians.filter((m) => m.status === 'RESTING').length;

  // Filtered technicians
  const filteredTechnicians = allTechnicians.filter((tech) => {
    if (statusFilter === 'AVAILABLE' && tech.status !== 'AVAILABLE') return false;
    if (statusFilter === 'ASSIGNED' && tech.status !== 'ASSIGNED') return false;
    if (sectionFilter !== 'ALL' && !tech.sectionOffice?.toLowerCase().includes(sectionFilter.toLowerCase())) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = tech.name.toLowerCase().includes(q);
      const matchRole = tech.role.toLowerCase().includes(q);
      const matchGang = tech.gangName?.toLowerCase().includes(q);
      const matchVehicle = tech.vehicleId?.toLowerCase().includes(q);
      const matchPhone = tech.phone.toLowerCase().includes(q);
      if (!matchName && !matchRole && !matchGang && !matchVehicle && !matchPhone) return false;
    }
    return true;
  });

  // Filtered crews
  const filteredCrews = crews.filter((crew) => {
    if (statusFilter === 'AVAILABLE' && !crew.members?.some((m) => m.status === 'AVAILABLE')) return false;
    if (statusFilter === 'ASSIGNED' && !crew.members?.some((m) => m.status === 'ASSIGNED')) return false;
    if (sectionFilter !== 'ALL' && !crew.sectionOffice.toLowerCase().includes(sectionFilter.toLowerCase())) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = crew.name.toLowerCase().includes(q);
      const matchVehicle = crew.vehicleId.toLowerCase().includes(q);
      const matchLead = crew.leadTechnician.toLowerCase().includes(q);
      const matchLocation = crew.currentLocation.toLowerCase().includes(q);
      const matchMember = crew.members?.some(
        (m) => m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)
      );
      if (!matchName && !matchVehicle && !matchLead && !matchLocation && !matchMember) return false;
    }
    return true;
  });

  // Open tickets eligible for assignment
  const openTickets = tickets.filter((t) => t.status !== 'RESOLVED');

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      {/* Header & Title */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              TSSPDCL Field Technician Dispatch &amp; Crew Fleet
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
              Individual Accountability
            </span>
          </div>
          <p className={`text-xs md:text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Direct Outage Assignment to Specific Linemen &amp; Engineers across Cybercity Circle
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div
            className={`p-1 rounded-xl border flex items-center gap-1 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              onClick={() => setViewMode('GANGS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold cursor-pointer transition-all ${
                viewMode === 'GANGS'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Section Gangs</span>
            </button>
            <button
              onClick={() => setViewMode('INDIVIDUALS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold cursor-pointer transition-all ${
                viewMode === 'INDIVIDUALS'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Individual Linemen ({totalLinemenCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
            <span>Available Technicians</span>
            <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-500">
            {availableLinemenCount} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Ready</span>
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block mt-1.5">
            Ready for 1-Click Dispatch
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
            <span>Assigned to Outages</span>
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-500">
            {assignedLinemenCount} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Active</span>
          </div>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold block mt-1.5">
            Working on Live Incidents
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
            <span>Resting / Standby</span>
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-700 dark:text-slate-300">
            {restingLinemenCount} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Personnel</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mt-1.5">
            Depot Shift Rotation
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
            <span>Total Field Strength</span>
            <Users className="w-4 h-4 text-cyan-500 shrink-0" />
          </div>
          <div className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400">{totalLinemenCount} Staff</div>
          <span className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold block mt-1.5">
            3 Specialized Section Gangs
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className={`p-4 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 shadow-sm ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap cursor-pointer transition-all ${
              statusFilter === 'ALL'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : isDark
                ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>All Personnel</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-700/80 text-white">
              {totalLinemenCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('AVAILABLE')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap cursor-pointer transition-all ${
              statusFilter === 'AVAILABLE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : isDark
                ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Available for Dispatch</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
              {availableLinemenCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('ASSIGNED')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap cursor-pointer transition-all ${
              statusFilter === 'ASSIGNED'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : isDark
                ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Currently Assigned</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
              {assignedLinemenCount}
            </span>
          </button>
        </div>

        {/* Section Select and Search */}
        <div className="flex items-center flex-wrap gap-2.5">
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className={`text-xs md:text-sm font-medium rounded-xl px-3 py-2 border outline-none cursor-pointer ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
          >
            <option value="ALL">All Sections (Cybercity Circle)</option>
            <option value="Madhapur">Madhapur Section</option>
            <option value="Kondapur">Kondapur Section</option>
            <option value="Gachibowli">Gachibowli Section</option>
          </select>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Lineman Name, Role, Phone..."
              className={`w-full text-xs md:text-sm rounded-xl pl-9 pr-3 py-2 border outline-none ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-800 placeholder:text-slate-400'
              }`}
            />
          </div>

          {(statusFilter !== 'ALL' || sectionFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setSectionFilter('ALL');
                setSearchQuery('');
              }}
              className="text-xs md:text-sm text-cyan-500 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: Group by Section Gang */}
      {viewMode === 'GANGS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {filteredCrews.map((crew) => {
            const isDispatched = crew.status === 'DISPATCHED' || crew.status === 'EN_ROUTE';
            const isOnSite = crew.status === 'ON_SITE';
            const isBusy = isDispatched || isOnSite;
            const availableCount = crew.members?.filter((m) => m.status === 'AVAILABLE').length || 0;
            const assignedCount = crew.members?.filter((m) => m.status === 'ASSIGNED').length || 0;
            const totalMembers = crew.members?.length || 0;

            return (
              <div
                key={crew.id}
                className={`p-4 md:p-5 rounded-2xl border shadow-xl flex flex-col justify-between transition-all ${
                  isBusy
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-amber-500/10'
                    : isDark
                    ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Card Header: Section Office & Gang Status */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 font-mono truncate max-w-[70%] uppercase">
                      {crew.sectionOffice}
                    </span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                        isDispatched
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                          : isOnSite
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isDispatched ? 'bg-amber-400 animate-ping' : isOnSite ? 'bg-blue-400' : 'bg-emerald-400'
                        }`}
                      ></span>
                      {crew.status}
                    </span>
                  </div>

                  {/* Gang Title & Specialization */}
                  <h3 className="text-lg font-bold mb-1.5 leading-snug">{crew.name}</h3>
                  <div className="mb-3.5">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20">
                      {crew.specializationLabel || crew.specialization}
                    </span>
                  </div>

                  {/* Fleet Vehicle & Location Bar */}
                  <div
                    className={`p-3 rounded-xl border text-sm space-y-2 mb-3.5 ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <Truck className="w-4 h-4 text-cyan-500 shrink-0" />
                        <span className="font-bold">{crew.vehicleType || 'Fleet Vehicle'}</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 shrink-0">
                        {crew.vehicleId}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-800/60">
                      <div className="flex items-center gap-1.5 truncate text-slate-500 dark:text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span className="truncate">{crew.currentLocation}</span>
                      </div>
                      <button
                        onClick={() => realtimeClient.focusCrewOnMap(crew.id)}
                        className="text-cyan-500 hover:underline flex items-center gap-1 text-xs font-bold shrink-0 cursor-pointer ml-1"
                      >
                        <Compass className="w-3.5 h-3.5" /> Map
                      </button>
                    </div>
                  </div>

                  {/* Individual Technicians List */}
                  <div className="mb-3.5">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-sm font-bold flex items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-500" />
                        <span>Individual Technicians ({totalMembers}):</span>
                      </span>
                      <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                        {availableCount} Available • {assignedCount} Assigned
                      </span>
                    </div>

                    {/* Member Profile Cards */}
                    <div className="space-y-2.5">
                      {crew.members?.map((member) => {
                        const isAvail = member.status === 'AVAILABLE';
                        const isAssigned = member.status === 'ASSIGNED';
                        const isResting = member.status === 'RESTING';

                        return (
                          <div
                            key={member.id}
                            className={`p-3 rounded-xl border flex flex-col gap-2.5 text-sm transition-all ${
                              isAssigned
                                ? 'bg-amber-950/30 border-amber-500/40'
                                : isAvail
                                ? isDark
                                  ? 'bg-slate-800/60 border-slate-700/80 hover:border-cyan-500/50'
                                  : 'bg-slate-50 border-slate-200 hover:border-cyan-500/50'
                                : isDark
                                ? 'bg-slate-900/40 border-slate-800 opacity-60'
                                : 'bg-slate-100/60 border-slate-200 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 font-mono ${
                                    isAssigned
                                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                      : isAvail
                                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                      : 'bg-slate-700/50 text-slate-400'
                                  }`}
                                >
                                  {member.avatarInitials}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold truncate text-sm">{member.name}</span>
                                    {isAvail && <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                                    {isAssigned && <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                                    {isResting && <UserX className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                                  </div>
                                  <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {member.role}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col items-end shrink-0">
                                <span
                                  className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                                    isAssigned
                                      ? 'bg-amber-500/20 text-amber-400'
                                      : isAvail
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'bg-slate-700/50 text-slate-400'
                                  }`}
                                >
                                  {member.status}
                                </span>
                                <a
                                  href={`tel:${member.phone}`}
                                  className="text-xs text-cyan-500 font-mono hover:underline mt-0.5 font-medium"
                                >
                                  {member.phone.replace('+91 ', '')}
                                </a>
                              </div>
                            </div>

                            {/* If Assigned: What this individual is working on */}
                            {isAssigned && (
                              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                                <div className="truncate mr-2">
                                  <span className="font-mono font-bold block text-xs">
                                    Working on: {member.assignedTicketNumber || 'Ticket'}
                                  </span>
                                  <span className="truncate opacity-90 text-xs block">
                                    {member.assignedTaskDescription || 'Outage restoration'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => realtimeClient.releaseTechnician(member.id)}
                                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 cursor-pointer"
                                >
                                  Release
                                </button>
                              </div>
                            )}

                            {/* If Available: Direct Assign Button for this Individual */}
                            {isAvail && (
                              <div className="flex items-center gap-2 pt-1">
                                {member.closestTicket ? (
                                  <button
                                    onClick={() =>
                                      realtimeClient.allocateTechnician(member.id, member.closestTicket?.ticketId)
                                    }
                                    className="flex-1 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                                  >
                                    <Navigation className="w-3.5 h-3.5" />
                                    <span>Assign Closest ({member.closestTicket.ticketNumber})</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setSelectedTechModal(member)}
                                    className="flex-1 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                                  >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    <span>Assign Outage Ticket</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => setSelectedTechModal(member)}
                                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                                >
                                  Pick...
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Overall Crew Tracking */}
                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-cyan-500" /> ETA ~ {crew.etaMinutes || 6} mins
                  </span>
                  <button
                    onClick={() => realtimeClient.focusCrewOnMap(crew.id)}
                    className="text-cyan-500 hover:underline flex items-center gap-1.5 text-xs md:text-sm font-bold cursor-pointer"
                  >
                    <Compass className="w-4 h-4" /> Track Vehicle GPS
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: Flat List of All Individual Technicians */}
      {viewMode === 'INDIVIDUALS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTechnicians.map((tech) => {
            const isAvail = tech.status === 'AVAILABLE';
            const isAssigned = tech.status === 'ASSIGNED';
            const isResting = tech.status === 'RESTING';

            return (
              <div
                key={tech.id}
                className={`p-4 md:p-5 rounded-2xl border shadow-lg flex flex-col justify-between transition-all ${
                  isAssigned
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-amber-500/10'
                    : isDark
                    ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top Bar: Section & Status Badge */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 font-mono truncate max-w-[65%] uppercase">
                      {tech.sectionOffice}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                        isAssigned
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                          : isAvail
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-700/50 text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isAssigned ? 'bg-amber-400 animate-ping' : isAvail ? 'bg-emerald-400' : 'bg-slate-500'
                        }`}
                      ></span>
                      {tech.status}
                    </span>
                  </div>

                  {/* Technician Name & Avatar */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 font-mono ${
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
                      <h4 className="text-base font-bold truncate leading-tight">{tech.name}</h4>
                      <p className="text-xs md:text-sm text-cyan-600 dark:text-cyan-400 font-semibold truncate">{tech.role}</p>
                      <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {tech.experience}
                      </p>
                    </div>
                  </div>

                  {/* Gang & Vehicle Tag */}
                  <div
                    className={`p-3 rounded-xl border text-xs md:text-sm space-y-1.5 mb-3.5 ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Squad:</span>
                      <strong className="truncate max-w-[170px]">{tech.gangName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Fleet Plate:</span>
                      <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{tech.vehicleId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Helpline:</span>
                      <a href={`tel:${tech.phone}`} className="font-mono text-cyan-600 dark:text-cyan-400 font-bold hover:underline">
                        {tech.phone}
                      </a>
                    </div>
                  </div>

                  {/* If Assigned: Current Active Task */}
                  {isAssigned && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-2 mb-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-bold text-amber-400 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400" /> Working on Outage
                        </span>
                        <span className="text-xs font-mono font-bold bg-amber-500/20 px-2 py-0.5 rounded text-amber-300">
                          {tech.assignedTicketNumber}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm leading-snug opacity-90 line-clamp-2">
                        {tech.assignedTaskDescription}
                      </p>
                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-amber-500/20 font-medium">
                        <span>Assigned: {tech.assignedAt || 'Today'}</span>
                        <button
                          onClick={() => realtimeClient.releaseTechnician(tech.id)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
                        >
                          Mark Complete
                        </button>
                      </div>
                    </div>
                  )}

                  {/* If Available and Has Closest Ticket */}
                  {isAvail && tech.closestTicket && (
                    <div
                      className={`p-3 rounded-xl border text-xs space-y-1.5 mb-3.5 ${
                        isDark
                          ? 'bg-cyan-950/20 border-cyan-500/30 text-cyan-200'
                          : 'bg-cyan-50 border-cyan-200 text-cyan-900'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-cyan-600 dark:text-cyan-400 uppercase">Closest Fault</span>
                        <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                          {tech.closestTicket.distanceKm} km • ~{tech.closestTicket.etaMinutes}m ETA
                        </span>
                      </div>
                      <div className="font-mono font-bold text-xs md:text-sm text-cyan-600 dark:text-cyan-400">
                        {tech.closestTicket.ticketNumber}
                      </div>
                      <p className="text-xs leading-snug opacity-90 truncate">
                        {tech.closestTicket.summary}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Actions for Individual */}
                <div className="pt-2.5 border-t border-slate-800/80">
                  {isAvail ? (
                    <div className="flex items-center gap-2">
                      {tech.closestTicket ? (
                        <button
                          onClick={() =>
                            realtimeClient.allocateTechnician(tech.id, tech.closestTicket?.ticketId)
                          }
                          className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs md:text-sm font-bold cursor-pointer shadow-md shadow-cyan-600/30 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        >
                          <Navigation className="w-4 h-4" />
                          <span>Dispatch to Closest</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedTechModal(tech)}
                          className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs md:text-sm font-bold cursor-pointer shadow-md shadow-cyan-600/30 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Assign Ticket</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedTechModal(tech)}
                        className={`px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold border cursor-pointer ${
                          isDark
                            ? 'border-slate-800 hover:border-slate-700 text-slate-300'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        Pick...
                      </button>
                    </div>
                  ) : isAssigned ? (
                    <button
                      onClick={() => realtimeClient.releaseTechnician(tech.id)}
                      className="w-full py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs md:text-sm font-bold cursor-pointer transition-all"
                    >
                      Release Technician back to Available
                    </button>
                  ) : (
                    <div className="text-center text-xs text-slate-500 py-1.5 font-medium">
                      Personnel on Scheduled Standby / Rest
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Assign Ticket directly to Individual Technician */}
      {selectedTechModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`border rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-fade-in ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-cyan-500" />
                <span>Assign Outage to {selectedTechModal.name}</span>
              </h3>
              <button
                onClick={() => setSelectedTechModal(null)}
                className="text-slate-400 hover:text-cyan-400 cursor-pointer font-bold text-base"
              >
                ✕
              </button>
            </div>

            <div
              className={`p-3 rounded-xl border mb-3.5 text-sm flex items-center justify-between ${
                isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div>
                <strong className={`block ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedTechModal.name}</strong>
                <span className="text-slate-400 block text-xs">
                  {selectedTechModal.role} • {selectedTechModal.gangName}
                </span>
              </div>
              <span className="font-mono text-cyan-500 text-xs font-bold">{selectedTechModal.vehicleId}</span>
            </div>

            <p className={`text-sm mb-3.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Select an open or in-progress incident ticket in Cybercity Circle to assign directly to this technician:
            </p>

            <div className="space-y-2.5 max-h-64 overflow-y-auto mb-4 pr-1">
              {openTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    realtimeClient.allocateTechnician(selectedTechModal.id, t.id);
                    setSelectedTechModal(null);
                  }}
                  className={`p-3.5 rounded-xl border text-sm cursor-pointer transition-all flex items-center justify-between ${
                    isDark
                      ? 'bg-slate-800/80 border-slate-700 hover:border-cyan-500'
                      : 'bg-slate-50 border-slate-200 hover:border-cyan-500'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono font-bold text-cyan-500">{t.ticketNumber}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-500">
                        {t.priority}
                      </span>
                      <span className="text-xs text-slate-400">{t.sectionOffice}</span>
                    </div>
                    <p className={`font-semibold truncate text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{t.summary}</p>
                    <span className="text-xs text-slate-400">{t.locality}</span>
                  </div>
                  <button className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs md:text-sm font-bold shrink-0 shadow">
                    Assign
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedTechModal(null)}
                className={`px-4 py-2 rounded-xl border text-sm font-semibold cursor-pointer ${
                  isDark
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
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
