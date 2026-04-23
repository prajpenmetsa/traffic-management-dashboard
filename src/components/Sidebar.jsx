import { useState, useEffect } from 'react';
import { STATION_INFO } from '../data/mockData';

const NAV_ITEMS = [
  { id: 'junctions', label: 'Junction Status', icon: '⬡' },
  { id: 'map', label: 'Deployment Map', icon: '◎' },
  { id: 'alerts', label: 'Active Alerts', icon: '⚠' },
  { id: 'incidents', label: 'Incident Log', icon: '≡' },
];

export default function Sidebar({ activePanel, setActivePanel, alertCount = 0 }) {
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

      {/* Live status panel */}
      <div className="px-4 pb-5 pt-3 border-t border-slate-700/60">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">System Status</p>
        <div className="space-y-2">
          <div className="bg-slate-800/70 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-400 mb-1">Active Alerts</div>
            <div className={`text-2xl font-bold ${alertCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {alertCount}
            </div>
          </div>
          <div className="bg-slate-800/70 rounded-lg p-3 text-center">
            <div className="text-xs text-slate-400 mb-1">Last Update</div>
            <div className="text-xs text-slate-300 font-mono">
              {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
