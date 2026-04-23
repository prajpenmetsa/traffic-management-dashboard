/**
 * Alert generation service
 * Dynamically generates alerts based on real-time traffic data
 */

/**
 * Format current time as HH:MM AM/PM
 */
function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  const displayHours = now.getHours() % 12 || 12;
  return `${String(displayHours).padStart(2, '0')}:${minutes} ${ampm}`;
}

/**
 * Generate alert ID from timestamp
 */
function generateAlertId() {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate alerts based on congestion levels
 * @param {Array} junctions - Array of junction objects with calculated congestion
 * @returns {Array} - Array of active alerts
 */
export function generateAlerts(junctions) {
  const alerts = [];
  const currentTime = getCurrentTime();

  // Group junctions by congestion level
  const highCongestion = junctions.filter(j => j.congestion === 'HIGH');
  const mediumCongestion = junctions.filter(j => j.congestion === 'MEDIUM');

  // Alert for HIGH congestion junctions
  highCongestion.forEach(junction => {
    alerts.push({
      id: generateAlertId(),
      severity: 'HIGH',
      junction: junction.name,
      reason: `Real-time congestion: HIGH - Significant delays detected`,
      time: currentTime,
      icon: 'traffic',
    });
  });

  // Alert for clusters of HIGH congestion
  if (highCongestion.length >= 2) {
    alerts.push({
      id: generateAlertId(),
      severity: 'HIGH',
      junction: 'System',
      reason: `Multiple junctions with HIGH congestion (${highCongestion.length} locations)`,
      time: currentTime,
      icon: 'alert-network',
    });
  }

  // Alert for MEDIUM congestion affecting corridor
  if (mediumCongestion.length >= 3) {
    alerts.push({
      id: generateAlertId(),
      severity: 'MEDIUM',
      junction: 'System',
      reason: `Corridor-wide moderate congestion affecting ${mediumCongestion.length} junctions`,
      time: currentTime,
      icon: 'traffic',
    });
  }

  // Alert for individual MEDIUM junctions (only top 2)
  mediumCongestion.slice(0, 2).forEach(junction => {
    alerts.push({
      id: generateAlertId(),
      severity: 'MEDIUM',
      junction: junction.name,
      reason: `Congestion: MEDIUM - Moderate delays detected`,
      time: currentTime,
      icon: 'traffic',
    });
  });

  return alerts;
}

/**
 * Determine alert severity based on congestion level
 */
export function getCongestionSeverity(congestion) {
  switch (congestion) {
    case 'HIGH':
      return 'HIGH';
    case 'MEDIUM':
      return 'MEDIUM';
    case 'LOW':
      return 'LOW';
    default:
      return 'LOW';
  }
}
