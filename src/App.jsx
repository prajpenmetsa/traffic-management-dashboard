import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import JunctionStatus from './components/JunctionStatus';
import DeploymentMap from './components/DeploymentMap';
import ActiveAlerts from './components/ActiveAlerts';
import IncidentLog from './components/IncidentLog';
import { ALERTS } from './data/mockData';

export default function App() {
  const [activePanel, setActivePanel] = useState('junctions');
  const [alertCount, setAlertCount] = useState(ALERTS.length);

  const panels = {
    junctions: <JunctionStatus />,
    map: <DeploymentMap />,
    alerts: <ActiveAlerts onAlertCountChange={setAlertCount} />,
    incidents: <IncidentLog />,
  };

  const panelTitles = {
    junctions: 'Junction Status',
    map: 'Deployment Map',
    alerts: 'Active Alerts',
    incidents: 'Incident & Violation Log',
  };

  return (
    <div className="flex w-full h-screen overflow-hidden bg-slate-950">
      <Sidebar
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        alertCount={alertCount}
      />

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />

        {/* Breadcrumb */}
        <div className="px-6 py-2 border-b border-slate-800 flex items-center gap-2 text-xs text-slate-500 flex-shrink-0">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Dashboard</span>
          <span className="text-slate-600">›</span>
          <span className="text-slate-300 font-medium">{panelTitles[activePanel]}</span>
        </div>

        {/* Map panel must fill height without scrolling; others scroll */}
        <main className={`flex-1 min-h-0 ${activePanel === 'map' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
          {panels[activePanel]}
        </main>
      </div>
    </div>
  );
}
