import { useState, useCallback, useRef, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, TrafficLayer, OverlayView } from '@react-google-maps/api';
import { JUNCTIONS } from '../data/mockData';

const LIBRARIES = [];

// Centre on the Madhapur–Gachibowli corridor
const MAP_CENTER = { lat: 17.433, lng: 78.373 };

// Dark navy map style matching the dashboard theme
const MAP_STYLES = [
  { elementType: 'geometry',            stylers: [{ color: '#0d1b2a' }] },
  { elementType: 'labels.text.stroke',  stylers: [{ color: '#0d1b2a' }] },
  { elementType: 'labels.text.fill',    stylers: [{ color: '#64748b' }] },
  { elementType: 'labels.icon',         stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative',      elementType: 'geometry',           stylers: [{ color: '#172033' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
  { featureType: 'poi',                 elementType: 'geometry',           stylers: [{ color: '#0f1f2e' }] },
  { featureType: 'poi',                 elementType: 'labels.text.fill',   stylers: [{ color: '#334155' }] },
  { featureType: 'poi.park',            elementType: 'geometry',           stylers: [{ color: '#0a1a26' }] },
  { featureType: 'poi.park',            elementType: 'labels.text.fill',   stylers: [{ color: '#1e3a5f' }] },
  { featureType: 'road',                elementType: 'geometry',           stylers: [{ color: '#1e3048' }] },
  { featureType: 'road',                elementType: 'geometry.stroke',    stylers: [{ color: '#0f1b2d' }] },
  { featureType: 'road',                elementType: 'labels.text.fill',   stylers: [{ color: '#64748b' }] },
  { featureType: 'road.highway',        elementType: 'geometry',           stylers: [{ color: '#2a4060' }] },
  { featureType: 'road.highway',        elementType: 'geometry.stroke',    stylers: [{ color: '#1a2d45' }] },
  { featureType: 'road.highway',        elementType: 'labels.text.fill',   stylers: [{ color: '#94a3b8' }] },
  { featureType: 'road.arterial',       elementType: 'geometry',           stylers: [{ color: '#1a2d45' }] },
  { featureType: 'transit',             elementType: 'geometry',           stylers: [{ color: '#172033' }] },
  { featureType: 'transit.station',     elementType: 'labels.text.fill',   stylers: [{ color: '#475569' }] },
  { featureType: 'water',               elementType: 'geometry',           stylers: [{ color: '#080f1a' }] },
  { featureType: 'water',               elementType: 'labels.text.fill',   stylers: [{ color: '#1e3a5f' }] },
];

const MAP_OPTIONS = {
  styles: MAP_STYLES,
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  minZoom: 12,
  maxZoom: 18,
};

const CONGESTION = {
  LOW:    { fill: '#14b8a6', stroke: '#0d9488', label: 'Low',    textColor: '#99f6e4', bg: 'rgba(20,184,166,0.15)',  border: 'rgba(20,184,166,0.5)' },
  MEDIUM: { fill: '#f59e0b', stroke: '#d97706', label: 'Medium', textColor: '#fde68a', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.5)' },
  HIGH:   { fill: '#ef4444', stroke: '#dc2626', label: 'High',   textColor: '#fca5a5', bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.5)'  },
};

// Pixel offset so the overlay is centred on the lat/lng
const OVERLAY_POSITION = (lat, lng) => ({ lat, lng });

function JunctionMarker({ junction, onClick, isSelected }) {
  const cfg = CONGESTION[junction.congestion] || CONGESTION.LOW;
  const size = isSelected ? 50 : 42;
  const halfSize = size / 2;

  const handleClick = (e) => {
    e.stopPropagation();
    onClick(junction);
  };

  return (
    <OverlayView
      position={OVERLAY_POSITION(junction.lat, junction.lng)}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={() => ({ x: -halfSize, y: -halfSize })}
    >
      <div
        onClick={handleClick}
        title={junction.name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: cfg.fill,
          border: `2.5px solid ${cfg.stroke}`,
          boxShadow: `0 0 ${isSelected ? 20 : 12}px ${cfg.fill}80, 0 2px 8px rgba(0,0,0,0.6)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          position: 'relative',
          userSelect: 'none',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        {/* Congestion level indicator - small badge */}
        <span style={{
          fontSize: 9,
          fontWeight: 900,
          color: '#0f172a',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          lineHeight: 1,
        }}>
          {junction.congestion?.[0] || 'L'}
        </span>

        {/* Officer count or alert icon */}
        <span style={{
          color: '#0f172a',
          fontSize: junction.officers === 0 ? 13 : 11,
          fontWeight: 800,
          fontFamily: 'Inter, system-ui, sans-serif',
          lineHeight: 1,
        }}>
          {junction.officers === 0 ? '!' : junction.officers}
        </span>

        {/* Selection ring */}
        {isSelected && (
          <span style={{
            position: 'absolute',
            inset: -6,
            borderRadius: '50%',
            border: `2px solid ${cfg.fill}`,
            opacity: 0.7,
            pointerEvents: 'none',
          }} />
        )}
      </div>
    </OverlayView>
  );
}

function InfoPanel({ junction, onClose }) {
  if (!junction) return null;
  const cfg = CONGESTION[junction.congestion] || CONGESTION.LOW;

  // Get current time in HH:MM format
  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <OverlayView
      position={OVERLAY_POSITION(junction.lat, junction.lng)}
      mapPaneName={OverlayView.FLOAT_PANE}
      getPixelPositionOffset={() => ({ x: 28, y: -100 })}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1e293b',
          border: `2px solid ${cfg.border}`,
          borderRadius: 14,
          padding: '16px 18px',
          minWidth: 240,
          boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
          fontFamily: 'Inter, system-ui, sans-serif',
          position: 'relative',
          zIndex: 9999,
        }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 8, right: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#64748b', fontSize: 18, lineHeight: 1, padding: '4px 6px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.color = '#f1f5f9'}
          onMouseLeave={(e) => e.target.style.color = '#64748b'}
          title="Close"
        >×</button>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{
            width: 12, height: 12, borderRadius: '50%',
            background: cfg.fill, flexShrink: 0, display: 'inline-block',
          }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3 }}>
            {junction.name}
          </span>
        </div>

        {/* Congestion badge */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{
            background: cfg.bg, color: cfg.fill,
            border: `1.5px solid ${cfg.border}`,
            borderRadius: 20, padding: '4px 12px',
            fontSize: 12, fontWeight: 700,
          }}>
            {junction.congestion} CONGESTION
          </span>
        </div>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
          <div style={{
            color: junction.officers === 0 ? '#ef4444' : '#93c5fd',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span style={{ fontSize: 16 }}>👮</span>
            {junction.officers === 0
              ? 'No officer assigned'
              : `${junction.officers} officer${junction.officers !== 1 ? 's' : ''} on site`}
          </div>

          {/* Delay time */}
          {junction.delay !== undefined && (
            <div style={{
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
            }}>
              <span style={{ fontSize: 14 }}>⏱️</span>
              <span>
                Delay: <strong style={{ color: '#fbbf24', fontFamily: 'monospace' }}>
                  {junction.delay.toFixed(1)}min
                </strong>
              </span>
            </div>
          )}

          <div style={{
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
          }}>
            <span style={{ fontSize: 14 }}>🕐</span>
            <span>Last update: <strong style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>{currentTime}</strong></span>
          </div>
        </div>
      </div>
    </OverlayView>
  );
}

export default function DeploymentMap({ congestionData = {} }) {
  const [selectedJunction, setSelectedJunction] = useState(null);
  const [trafficVisible, setTrafficVisible] = useState(true);
  const mapRef = useRef(null);

  // Merge calculated congestion with junction data
  const junctionsWithCongestion = useMemo(() => {
    return JUNCTIONS.map(junction => {
      const congData = congestionData[junction.id];
      const congestionLevel = typeof congData === 'string' ? congData : (congData?.congestion || 'LOW');
      return {
        ...junction,
        congestion: congestionLevel,
        delay: typeof congData === 'object' ? (congData?.delay || 0) : 0,
        speed: typeof congData === 'object' ? (congData?.speed || 0) : 0,
        freeFlowSpeed: typeof congData === 'object' ? (congData?.freeFlowSpeed || 0) : 0,
      };
    });
  }, [congestionData]);

  // Calculate total officers deployed
  const totalOfficers = useMemo(() => {
    return JUNCTIONS.reduce((sum, junction) => sum + (junction.officers || 0), 0);
  }, []);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const keyMissing = !apiKey || apiKey === 'YOUR_API_KEY_HERE';

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    libraries: LIBRARIES,
  });

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const handleMarkerClick = (junction) => {
    setSelectedJunction(prev => prev?.id === junction.id ? null : junction);
  };

  // ── API key not configured ──────────────────────────────────────────────────
  if (keyMissing) {
    return (
      <div className="p-6 flex flex-col h-full">
        <MapHeader trafficVisible={trafficVisible} setTrafficVisible={setTrafficVisible} />
        <div className="flex-1 min-h-0 rounded-xl border border-amber-500/30 bg-slate-800/50 flex flex-col items-center justify-center gap-4" style={{ minHeight: 420 }}>
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl">🗝️</div>
          <div className="text-center max-w-sm">
            <p className="text-white font-semibold text-base mb-1">Google Maps API Key Required</p>
            <p className="text-slate-400 text-sm mb-4">
              Open <code className="bg-slate-700 text-amber-300 px-1.5 py-0.5 rounded text-xs">.env</code> in the project root and replace <code className="bg-slate-700 text-amber-300 px-1.5 py-0.5 rounded text-xs">YOUR_API_KEY_HERE</code> with your key, then restart the dev server.
            </p>
            <div className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-left text-xs font-mono text-slate-300 space-y-1">
              <div><span className="text-slate-500"># .env</span></div>
              <div>VITE_GOOGLE_MAPS_API_KEY=<span className="text-amber-400">AIza…</span></div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Enable these APIs in <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Google Cloud Console</a>:
            </p>
            <ul className="text-xs text-slate-500 mt-1 text-left list-disc list-inside">
              <li><strong className="text-slate-400">Maps JavaScript API</strong> (includes Traffic Layer)</li>
              <li><strong className="text-slate-400">Routes API</strong> (for congestion calculation)</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ── Load error ──────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="p-6 flex flex-col h-full">
        <MapHeader trafficVisible={trafficVisible} setTrafficVisible={setTrafficVisible} />
        <div className="flex-1 min-h-0 rounded-xl border border-red-500/30 bg-slate-800/50 flex flex-col items-center justify-center gap-3">
          <p className="text-red-400 font-semibold">Map failed to load</p>
          <p className="text-slate-400 text-sm">Check that your API key is valid and the Maps JavaScript API is enabled.</p>
          <p className="text-xs text-slate-500 font-mono bg-slate-900 px-3 py-2 rounded">{loadError.message}</p>
        </div>
      </div>
    );
  }

  // ── Loading spinner ─────────────────────────────────────────────────────────
  if (!isLoaded) {
    return (
      <div className="p-6 flex flex-col h-full">
        <MapHeader trafficVisible={trafficVisible} setTrafficVisible={setTrafficVisible} />
        <div className="flex-1 min-h-0 rounded-xl border border-slate-700/60 bg-slate-800/50 flex items-center justify-center" style={{ minHeight: 420 }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading Google Maps…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Map ─────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 flex flex-col h-full">
      <MapHeader trafficVisible={trafficVisible} setTrafficVisible={setTrafficVisible} />

      <div
        className="flex-1 min-h-0 rounded-xl overflow-hidden border border-slate-700/60 relative"
        style={{ minHeight: 420 }}
      >
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={MAP_CENTER}
          zoom={14}
          options={MAP_OPTIONS}
          onLoad={onMapLoad}
          onClick={() => setSelectedJunction(null)}
        >
          {/* Real-time Google Traffic Layer */}
          {trafficVisible && <TrafficLayer autoUpdate />}

          {/* Junction markers */}
          {junctionsWithCongestion.map(j => (
            <JunctionMarker
              key={j.id}
              junction={j}
              onClick={handleMarkerClick}
              isSelected={selectedJunction?.id === j.id}
            />
          ))}

          {/* Info panel for selected junction */}
          {selectedJunction && (
            <InfoPanel
              junction={selectedJunction}
              onClose={() => setSelectedJunction(null)}
            />
          )}
        </GoogleMap>

        {/* Overlay: Junction legend */}
        <div style={{
          position: 'absolute', bottom: 24, left: 12, zIndex: 5,
          background: 'rgba(15,23,42,0.92)',
          border: '1px solid rgba(51,65,85,0.8)',
          borderRadius: 12, padding: '12px 14px',
          backdropFilter: 'blur(8px)',
          fontFamily: 'Inter, system-ui, sans-serif',
          minWidth: 180,
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Monitored Junctions
          </p>
          {junctionsWithCongestion.map(j => {
            const cfg = CONGESTION[j.congestion] || CONGESTION.LOW;
            return (
              <div
                key={j.id}
                onClick={() => setSelectedJunction(j)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '3px 0', cursor: 'pointer',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.fill, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#cbd5e1', flex: 1 }}>{j.shortName}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: cfg.fill }}>{j.congestion}</span>
              </div>
            );
          })}
        </div>

        {/* Overlay: Officers summary */}
        {(() => {
          const now = new Date();
          const hour = now.getHours();
          let shift = 'Morning';
          if (hour >= 14 && hour < 22) shift = 'Afternoon';
          else if (hour >= 22 || hour < 6) shift = 'Night';

          return (
            <div style={{
              position: 'absolute', top: 12, left: 12, zIndex: 5,
              background: 'rgba(15,23,42,0.92)',
              border: '1px solid rgba(51,65,85,0.8)',
              borderRadius: 10, padding: '8px 12px',
              backdropFilter: 'blur(8px)',
              fontFamily: 'Inter, system-ui, sans-serif',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="14" height="14" fill="#60a5fa" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
              </svg>
              <span style={{ fontSize: 12, color: '#f1f5f9', fontWeight: 600 }}>{totalOfficers} officer{totalOfficers !== 1 ? 's' : ''} deployed</span>
              <span style={{ fontSize: 11, color: '#475569', borderLeft: '1px solid #334155', paddingLeft: 8, marginLeft: 2 }}>{shift} Shift</span>
            </div>
          );
        })()}

        {/* Overlay: Traffic layer legend */}
        <div style={{
          position: 'absolute', top: 12, right: 12, zIndex: 5,
          background: 'rgba(15,23,42,0.92)',
          border: '1px solid rgba(51,65,85,0.8)',
          borderRadius: 10, padding: '8px 12px',
          backdropFilter: 'blur(8px)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Live Traffic
          </p>
          {[['#22c55e','No delay'],['#f97316','Slow'],['#ef4444','Heavy']].map(([color, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
              <span style={{ width: 20, height: 5, borderRadius: 3, background: color, display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-component: panel header ─────────────────────────────────────────────
function MapHeader({ trafficVisible, setTrafficVisible }) {
  return (
    <div className="flex items-center justify-between mb-4 flex-shrink-0">
      <div>
        <h2 className="text-base font-semibold text-white">Officer Deployment Map</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Google Maps · Real-time traffic overlay · Click any marker for junction details
        </p>
      </div>
      <div className="flex items-center gap-3">
        {/* Traffic layer toggle */}
        <button
          onClick={() => setTrafficVisible(v => !v)}
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
            trafficVisible
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              : 'bg-slate-800 border-slate-700 text-slate-500'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${trafficVisible ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          Live Traffic Layer
        </button>

        {/* Congestion legend */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-teal-400 inline-block"></span>LOW</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>MED</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>HIGH</span>
        </div>
      </div>
    </div>
  );
}
