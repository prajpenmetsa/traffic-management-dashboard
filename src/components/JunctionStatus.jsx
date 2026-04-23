import { useMemo } from 'react';
import { JUNCTIONS } from '../data/mockData';

const congestionConfig = {
  LOW:    { badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',    dot: 'bg-teal-400',   ring: 'border-slate-700/60' },
  MEDIUM: { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', dot: 'bg-amber-400',  ring: 'border-amber-500/20' },
  HIGH:   { badge: 'bg-red-500/20 text-red-300 border-red-500/30',       dot: 'bg-red-400',    ring: 'border-red-500/25' },
};

function OfficerIcon() {
  return (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  );
}

export default function JunctionStatus({ congestionData = {} }) {
  // Merge calculated congestion with junction data
  const junctionsWithCongestion = useMemo(() => {
    return JUNCTIONS.map(junction => {
      const congData = congestionData[junction.id];
      const congestionLevel = typeof congData === 'string' ? congData : (congData?.congestion || 'LOW');
      return {
        ...junction,
        congestion: congestionLevel,
      };
    });
  }, [congestionData]);

  // Calculate dynamic summary counts
  const summary = useMemo(() => {
    return {
      low: junctionsWithCongestion.filter(j => j.congestion === 'LOW').length,
      medium: junctionsWithCongestion.filter(j => j.congestion === 'MEDIUM').length,
      high: junctionsWithCongestion.filter(j => j.congestion === 'HIGH').length,
    };
  }, [junctionsWithCongestion]);

  // Calculate total officers
  const totalOfficers = useMemo(() => {
    return JUNCTIONS.reduce((sum, junction) => sum + (junction.officers || 0), 0);
  }, []);

  // Get current shift based on time
  const currentShift = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 14 && hour < 22) return 'Afternoon';
    if (hour >= 22 || hour < 6) return 'Night';
    return 'Morning';
  }, []);
  return (
    <div className="p-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-white">Junction Status</h2>
          <p className="text-xs text-slate-400 mt-0.5">Madhapur–Gachibowli Corridor · 7 junctions monitored</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-400 inline-block"></span>Low</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>Medium</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>High</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {junctionsWithCongestion.map((junction) => {
          const cfg = congestionConfig[junction.congestion] || congestionConfig.LOW;
          return (
            <div
              key={junction.id}
              className={`bg-slate-800/60 rounded-xl border p-4 transition-all duration-200 hover:bg-slate-800/90 relative overflow-hidden ${
                junction.congestion === 'HIGH' ? 'border-red-500/25' :
                junction.congestion === 'MEDIUM' ? 'border-amber-500/20' :
                'border-slate-700/60'
              }`}
            >
              {/* Subtle top accent strip */}
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${
                junction.congestion === 'HIGH' ? 'bg-gradient-to-r from-red-500/60 to-transparent' :
                junction.congestion === 'MEDIUM' ? 'bg-gradient-to-r from-amber-500/50 to-transparent' :
                'bg-gradient-to-r from-teal-500/40 to-transparent'
              }`}/>

              {/* Header row */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`}></span>
                  <h3 className="text-sm font-semibold text-white truncate">{junction.name}</h3>
                </div>
                <span className={`flex-shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                  {junction.congestion}
                </span>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <OfficerIcon />
                  <span className="text-sm font-semibold">{junction.officers}</span>
                  <span className="text-xs text-slate-500">officer{junction.officers !== 1 ? 's' : ''}</span>
                </div>
                {junction.officers === 0 && (
                  <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/25 rounded px-1.5 py-0.5 font-medium">
                    UNATTENDED
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Updated {junction.lastUpdated}</span>
                {junction.alert && (
                  <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 blink"></span>
                    Alert Active
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary bar */}
      <div className="mt-5 bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex items-center gap-8">
        <div className="text-center">
          <div className="text-xl font-bold text-teal-400">{summary.low}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Low Congestion</div>
        </div>
        <div className="w-px h-8 bg-slate-700"></div>
        <div className="text-center">
          <div className="text-xl font-bold text-amber-400">{summary.medium}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Med. Congestion</div>
        </div>
        <div className="w-px h-8 bg-slate-700"></div>
        <div className="text-center">
          <div className="text-xl font-bold text-red-400">{summary.high}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">High Congestion</div>
        </div>
        <div className="w-px h-8 bg-slate-700"></div>
        <div className="text-center">
          <div className="text-xl font-bold text-white">{totalOfficers}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Officers on Duty</div>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 blink inline-block"></span>
          Data refreshed · {currentShift} Shift
        </div>
      </div>
    </div>
  );
}
