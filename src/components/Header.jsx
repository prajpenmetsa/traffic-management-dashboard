import { useState, useEffect } from 'react';

export default function Header() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  let shift = 'Night';
  if (hours >= 7 && hours < 14) shift = 'Morning';
  else if (hours >= 14 && hours < 22) shift = 'Afternoon';

  const dateStr = time.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <header className="h-14 bg-slate-900/80 backdrop-blur border-b border-slate-700/60 flex items-center px-6 gap-4 flex-shrink-0 sticky top-0 z-20">
      {/* Title */}
      <div className="flex items-center gap-3 flex-1">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-white leading-none">Madhapur Traffic Police Station</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Traffic Situation Dashboard · Cyberabad Commissionerate</p>
        </div>
      </div>

      {/* Shift badge */}
      <div className="hidden md:flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-1.5">
        <span className="text-amber-400 text-xs">◐</span>
        <span className="text-amber-300 text-xs font-semibold">Shift: {shift}</span>
      </div>

      {/* Date */}
      <div className="hidden lg:block text-xs text-slate-400">{dateStr}</div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 blink flex-shrink-0"></span>
        <span className="text-xs font-semibold text-emerald-400">Live</span>
      </div>
    </header>
  );
}
