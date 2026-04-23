import { useState, useEffect } from 'react';
import { JUNCTIONS } from '../data/mockData';

const severityBadge = {
  HIGH:   'bg-red-500/20 text-red-300 border-red-500/30',
  MEDIUM: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  LOW:    'bg-teal-500/20 text-teal-300 border-teal-500/30',
};

const statusBadge = {
  Open:     'bg-red-500/15 text-red-400 border-red-500/25',
  Resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
};

const typeBadge = {
  Incident:  'bg-purple-500/20 text-purple-300',
  Violation: 'bg-blue-500/20 text-blue-300',
};

const JUNCTIONS_LIST = JUNCTIONS.map(j => j.name);
const SUBTYPES = ['Accident', 'Signal Jump', 'Wrong-Way Driving', 'Vehicle Breakdown', 'Overloading', 'Obstruction', 'Other'];

const emptyForm = { type: 'Incident', junction: JUNCTIONS_LIST[0], subtype: 'Accident', severity: 'MEDIUM', note: '' };

export default function IncidentLog({ incidents: incomingIncidents = [] }) {
  const [incidents, setIncidents] = useState(incomingIncidents);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const handleSubmit = (e) => {
    e.preventDefault();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const newEntry = {
      id: `i${Date.now()}`,
      time: timeStr,
      junction: form.junction,
      type: form.type,
      subtype: form.subtype,
      severity: form.severity,
      status: 'Open',
      note: form.note || '—',
    };
    setIncidents([newEntry, ...incidents]);
    setShowModal(false);
    setForm(emptyForm);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-white">Incident & Violation Log</h2>
          <p className="text-xs text-slate-400 mt-0.5">Morning Shift · {incidents.length} entries</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Log New Entry
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700/60">
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Time</th>
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Junction</th>
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Type</th>
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Subtype</th>
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Severity</th>
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {incidents.map((inc, idx) => (
                <tr
                  key={inc.id}
                  className={`transition-colors hover:bg-slate-700/20 ${idx === 0 && inc.id.startsWith('i1') === false ? 'bg-blue-500/5' : ''}`}
                >
                  <td className="px-4 py-3 text-slate-300 font-mono text-xs whitespace-nowrap">{inc.time}</td>
                  <td className="px-4 py-3 text-slate-200 font-medium text-xs whitespace-nowrap max-w-[160px] truncate">{inc.junction}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${typeBadge[inc.type]}`}>{inc.type}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs whitespace-nowrap">{inc.subtype}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityBadge[inc.severity]}`}>{inc.severity}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge[inc.status]}`}>{inc.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs max-w-[200px]">
                    <span className="line-clamp-2">{inc.note}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="bg-slate-800 border border-slate-600/60 rounded-2xl w-full max-w-md shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h3 className="text-base font-semibold text-white">Log New Entry</h3>
              <button
                onClick={() => { setShowModal(false); setForm(emptyForm); }}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Entry Type</label>
                <div className="flex gap-3">
                  {['Incident', 'Violation'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${
                        form.type === t
                          ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                          : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Junction */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Junction</label>
                <select
                  value={form.junction}
                  onChange={e => setForm(f => ({ ...f, junction: e.target.value }))}
                  className="w-full bg-slate-700/60 border border-slate-600 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {JUNCTIONS_LIST.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>

              {/* Subtype */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Subtype</label>
                <select
                  value={form.subtype}
                  onChange={e => setForm(f => ({ ...f, subtype: e.target.value }))}
                  className="w-full bg-slate-700/60 border border-slate-600 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {SUBTYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Severity</label>
                <div className="flex gap-2">
                  {['LOW', 'MEDIUM', 'HIGH'].map(s => {
                    const colors = {
                      LOW: 'bg-teal-600/30 border-teal-500 text-teal-300',
                      MEDIUM: 'bg-amber-600/30 border-amber-500 text-amber-300',
                      HIGH: 'bg-red-600/30 border-red-500 text-red-300',
                    };
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, severity: s }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                          form.severity === s ? colors[s] : 'bg-slate-700/50 border-slate-600 text-slate-500 hover:border-slate-500'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Note</label>
                <textarea
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Brief description of the incident or violation..."
                  rows={3}
                  className="w-full bg-slate-700/60 border border-slate-600 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-colors resize-none placeholder-slate-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setForm(emptyForm); }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-slate-400 bg-slate-700/50 border border-slate-600 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                >
                  Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
