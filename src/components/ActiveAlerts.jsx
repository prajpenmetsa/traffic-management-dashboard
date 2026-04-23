import { useState, useEffect } from 'react';

const severityConfig = {
  HIGH:   { badge: 'bg-red-500/20 text-red-300 border-red-500/40',    row: 'alert-glow-high',   icon: 'text-red-400',    border: 'border-red-500/25' },
  MEDIUM: { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', row: 'alert-glow-medium', icon: 'text-amber-400',  border: 'border-amber-500/20' },
  LOW:    { badge: 'bg-slate-500/30 text-slate-300 border-slate-500/40',  row: '',                  icon: 'text-slate-400',  border: 'border-slate-700/50' },
};

const alertIcons = {
  traffic: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  signal: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  officer: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  data: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
    </svg>
  ),
};

export default function ActiveAlerts({ alerts: incomingAlerts = [], incidents = [] }) {
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const [dismissing, setDismissing] = useState(null);

  // Filter out dismissed alerts
  const alerts = incomingAlerts.filter(a => !dismissedAlerts.has(a.id));

  // Update dismissed alerts when incoming alerts change (if it's a new cycle)
  useEffect(() => {
    setDismissedAlerts(new Set());
  }, [incomingAlerts]);

  const dismiss = (id) => {
    setDismissing(id);
    setTimeout(() => {
      setDismissedAlerts(prev => new Set([...prev, id]));
      setDismissing(null);
    }, 300);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-white">Active Alerts</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {alerts.length} active alert{alerts.length !== 1 ? 's' : ''} · Morning Shift
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] bg-red-500/15 text-red-400 border border-red-500/25 rounded-lg px-2.5 py-1 font-semibold">
            {alerts.filter(a => a.severity === 'HIGH').length} HIGH
          </span>
          <span className="text-[11px] bg-amber-500/15 text-amber-400 border border-amber-500/25 rounded-lg px-2.5 py-1 font-semibold">
            {alerts.filter(a => a.severity === 'MEDIUM').length} MED
          </span>
        </div>
      </div>

      {alerts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-slate-300 font-semibold text-sm">All Clear</p>
          <p className="text-xs text-slate-500 mt-1">No active alerts for this shift</p>
        </div>
      )}

      <div className="space-y-3">
        {alerts.map((alert) => {
          const cfg = severityConfig[alert.severity];
          const isDismissing = dismissing === alert.id;
          return (
            <div
              key={alert.id}
              className={`bg-slate-800/60 border rounded-xl p-4 transition-all duration-300 ${cfg.border} ${cfg.row} ${
                isDismissing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`flex-shrink-0 mt-0.5 ${cfg.icon}`}>
                  {alertIcons[alert.icon]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-white">{alert.junction}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-snug">{alert.reason}</p>
                  <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Triggered at {alert.time}
                  </p>
                </div>

                {/* Dismiss */}
                <button
                  onClick={() => dismiss(alert.id)}
                  className="flex-shrink-0 text-slate-500 hover:text-slate-300 hover:bg-slate-700 p-1.5 rounded-lg transition-colors duration-150 text-xs font-medium flex items-center gap-1"
                  title="Dismiss alert"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="hidden sm:inline">Dismiss</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {alerts.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setDismissedAlerts(new Set(incomingAlerts.map(a => a.id)));
            }}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
          >
            Dismiss all alerts
          </button>
        </div>
      )}
    </div>
  );
}
