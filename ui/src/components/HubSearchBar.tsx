import React from 'react';
import { DistributionHub, ThemeMode } from '../types';
import { Search, MapPin, Zap, Building2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface HubSearchBarProps {
  theme?: ThemeMode;
  hubs: DistributionHub[];
  activeHub: DistributionHub;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectHub: (hubId: string) => void;
}

export const HubSearchBar: React.FC<HubSearchBarProps> = ({
  theme = 'light',
  hubs,
  activeHub,
  searchQuery,
  onSearchChange,
  onSelectHub,
}) => {
  const isDark = theme === 'dark';

  const filteredHubs = hubs.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.feederCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search
            className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search small distribution hub, locality, or feeder (e.g. Green Glen, F-04, Iblur)..."
            className={`w-full text-sm rounded-xl pl-10 pr-4 py-2.5 border outline-none transition-all ${
              isDark
                ? 'bg-slate-950 text-white border-slate-700/80 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 placeholder:text-slate-500'
                : 'bg-slate-50 text-slate-900 border-slate-300 focus:bg-white focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 placeholder:text-slate-400'
            }`}
          />
        </div>

        {/* Quick Hub Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span
            className={`text-xs font-semibold shrink-0 flex items-center gap-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            <Building2 className="w-4 h-4 text-cyan-500" />
            <span>Hub:</span>
          </span>
          {filteredHubs.map((hub) => {
            const isSelected = hub.id === activeHub.id;
            return (
              <button
                key={hub.id}
                onClick={() => onSelectHub(hub.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 border border-cyan-500'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    hub.status === 'HEALTHY'
                      ? 'bg-emerald-500'
                      : hub.status === 'DOWN'
                      ? 'bg-red-500 animate-pulse'
                      : 'bg-amber-500'
                  }`}
                />
                <span>{hub.name.split(' ')[0]}</span>
                <span className="text-xs opacity-80 font-mono">({hub.feederCode})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Hub Summary Bar */}
      <div
        className={`mt-3.5 pt-3 border-t flex flex-wrap items-center justify-between text-xs md:text-sm gap-3 ${
          isDark ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-600'
        }`}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-cyan-500 shrink-0" />
          <span className={`font-bold text-sm md:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {activeHub.name}
          </span>
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            ({activeHub.locality})
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs md:text-sm font-medium">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Feeder:</span>
            <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {activeHub.feederCode}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Total Meters:</span>
            <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {activeHub.totalMeters}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Status:</span>
            {activeHub.status === 'HEALTHY' ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                HEALTHY
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold animate-pulse">
                <AlertTriangle className="w-4 h-4" />
                OUTAGE REPORTED
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
