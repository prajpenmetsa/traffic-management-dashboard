import { useState, useEffect } from 'react';
import { STATION_INFO, TRAVEL_TIMES } from '../data/mockData';

const NAV_ITEMS = [
  { id: 'junctions', label: 'Junction Status', icon: '⬡' },
  { id: 'map', label: 'Deployment Map', icon: '◎' },
  { id: 'alerts', label: 'Active Alerts', icon: '⚠' },
  { id: 'incidents', label: 'Incident Log', icon: '≡' },
];

const travelStatusColor = (status) => {
  if (status === 'SEVERE') return 'text-red-400';
  if (status === 'HIGH') return 'text-amber-400';
  return 'text-yellow-300';
};

export default function Sidebar({ activePanel, setActivePanel, alertCount }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  let shift = 'Night';
  if (hours >= 7 && hours < 14) shift = 'Morning';
  else if (hours >= 14 && hours < 22) shift = 'Afternoon';

  const shiftColors = {
    Morning: 'text-amber-300',
    Afternoon: 'text-sky-300',
    Night: 'text-indigo-400',
  };

  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-700/60 flex flex-col flex-shrink-0">
      {/* Station branding */}
      <div className="p-5 border-b border-slate-700/60">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold">TS</div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Police Dept.</span>
        </div>
        <h1 className="text-sm font-semibold text-white leading-tight mt-2">{STATION_INFO.name}</h1>
        <p className="text-xs text-slate-500 mt-0.5">{STATION_INFO.district}</p>
      </div>

      {/* Live clock */}
      <div className="px-5 py-4 border-b border-slate-700/60">
        <div className="text-2xl font-light text-white tracking-wider tabular-nums">
          {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
        <div className={`text-xs font-semibold mt-2 ${shiftColors[shift]}`}>
          ◐ {shift} Shift &nbsp;·&nbsp; {STATION_INFO.shiftTime}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {STATION_INFO.officers} officers on duty
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 px-2 mb-2">Panels</p>
        {NAV_ITEMS.map((item) => {
          const isActive = activePanel === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePanel(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span className="text-base w-4 text-center">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'alerts' && alertCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {alertCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Travel times panel */}
      <div className="px-4 pb-5 pt-3 border-t border-slate-700/60">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">Travel Time Index</p>
        <div className="space-y-2.5">
          {TRAVEL_TIMES.map((tt, i) => (
            <div key={i} className="bg-slate-800/70 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-slate-300 font-medium leading-tight">
                  {tt.from} → {tt.to}
                </span>
                <span className={`text-[10px] font-bold ${travelStatusColor(tt.status)}`}>
                  {tt.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{tt.current} min</span>
                <span className="text-xs text-slate-500">vs {tt.normal} min normal</span>
              </div>
              <div className="mt-1.5 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${tt.status === 'SEVERE' ? 'bg-red-500' : tt.status === 'HIGH' ? 'bg-amber-500' : 'bg-yellow-400'}`}
                  style={{ width: `${Math.min((tt.current / (tt.normal * 3)) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
