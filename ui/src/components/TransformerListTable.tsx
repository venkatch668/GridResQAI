import React from 'react';
import { GridAsset, DistributionHub, ThemeMode } from '../types';
import { Cpu, MapPin, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';

interface TransformerListTableProps {
  theme?: ThemeMode;
  hub: DistributionHub;
  assets: GridAsset[];
  selectedAsset: GridAsset | null;
  onSelectTransformer: (asset: GridAsset) => void;
}

export const TransformerListTable: React.FC<TransformerListTableProps> = ({
  theme = 'light',
  hub,
  assets,
  selectedAsset,
  onSelectTransformer,
}) => {
  const isDark = theme === 'dark';

  // Filter transformers belonging to this active hub
  const transformers = assets.filter(
    (a) => a.type === 'TRANSFORMER' && a.hubId === hub.id
  );

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm flex flex-col h-full min-h-[580px] lg:min-h-[calc(100vh-215px)] transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      <div
        className={`flex items-center justify-between pb-3 border-b mb-3 shrink-0 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl border ${
              isDark ? 'bg-slate-800 text-cyan-400 border-slate-700' : 'bg-cyan-50 text-cyan-600 border-cyan-100'
            }`}
          >
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Transformers under {hub.name}
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {transformers.length} Distribution Transformers Connected to {hub.feederCode}
            </p>
          </div>
        </div>

        <span
          className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-lg border ${
            isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          {transformers.filter((t) => t.state === 'DOWN').length} Faulted / {transformers.length} Total
        </span>
      </div>

      {/* Transformers Grid / List */}
      <div className="space-y-2.5 flex-1 min-h-0 overflow-y-auto pr-1">
        {transformers.length === 0 ? (
          <div className="text-center py-10 text-sm text-slate-500">
            No transformers mapped to this hub.
          </div>
        ) : (
          transformers.map((tr) => {
            const isSelected = selectedAsset?.id === tr.id;
            return (
              <div
                key={tr.id}
                onClick={() => onSelectTransformer(tr)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-500/10'
                      : 'bg-cyan-50/80 border-cyan-500 shadow-sm'
                    : isDark
                    ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold font-mono ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {tr.code}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        tr.state === 'HEALTHY'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                          : tr.state === 'DOWN'
                          ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30 animate-pulse'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {tr.state}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTransformer(tr);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Focus on Map</span>
                  </button>
                </div>

                <p className={`text-xs md:text-sm font-semibold mb-2.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {tr.name}
                </p>

                <div
                  className={`grid grid-cols-3 gap-2 text-xs p-2.5 rounded-lg border ${
                    isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold uppercase">
                      Capacity
                    </span>
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {tr.capacityKva || 250} kVA
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold uppercase">
                      Voltage
                    </span>
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {tr.voltage}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold uppercase">
                      Customers
                    </span>
                    <span
                      className={`font-bold ${
                        tr.customersAffected ? 'text-red-600 dark:text-red-400' : isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}
                    >
                      {tr.customersAffected ? `${tr.customersAffected} down` : '0 offline'}
                    </span>
                  </div>
                </div>

                <div
                  className={`mt-2.5 text-xs flex items-center justify-between ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Telemetry: {tr.lastTelemetryTimestamp}</span>
                  </span>
                  {isSelected && (
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold text-xs">
                      ● Highlighted
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
