/**
 * Congestion calculation service using Google Maps Routes API
 *
 * This service calculates real-time congestion based on travel time delays.
 *
 * API Requirements:
 * - Google Maps JavaScript API (for the Map and Traffic Layer)
 * - Routes API (for calculating travel times and delays)
 *
 * Configuration:
 * - Set VITE_GOOGLE_MAPS_API_KEY in .env file
 * - Enable both APIs in Google Cloud Console
 *
 * How it works:
 * 1. For each road connection between adjacent junctions:
 *    - Calls Google Maps Routes API with current departure time ("now")
 *    - Extracts: duration (baseline) and duration_in_traffic (current)
 *    - Calculates delay = duration_in_traffic - duration
 *
 * 2. Maps delay to congestion level:
 *    - LOW: < 3 minutes delay
 *    - MEDIUM: 3-10 minutes delay
 *    - HIGH: > 10 minutes delay
 *
 * 3. Updates occur every 4 minutes (configurable in App.jsx)
 */

const CONGESTION_THRESHOLDS = {
  LOW: 3,      // Less than 3 minutes delay
  MEDIUM: 5,  // 3-5 minutes delay
  HIGH: Infinity, // More than 5 minutes delay
};

/**
 * Calculate congestion level based on travel time delay
 * @param {number} delayMinutes - Difference between current and baseline travel time
 * @returns {string} - Congestion level: 'LOW', 'MEDIUM', or 'HIGH'
 */
export function calculateCongestionLevel(delayMinutes) {
  if (delayMinutes < CONGESTION_THRESHOLDS.LOW) {
    return 'LOW';
  } else if (delayMinutes < CONGESTION_THRESHOLDS.MEDIUM) {
    return 'MEDIUM';
  } else {
    return 'HIGH';
  }
}

/**
 * Call Google Maps Routes API to get travel times between two junctions
 * @param {number} originLat - Origin latitude
 * @param {number} originLng - Origin longitude
 * @param {number} destLat - Destination latitude
 * @param {number} destLng - Destination longitude
 * @param {string} apiKey - Google Maps API key
 * @returns {Promise<{baseline: number, current: number, delay: number, congestion: string}>}
 */
async function fetchTravelTimes(originLat, originLng, destLat, destLng, apiKey) {
  const origin = `${originLat},${originLng}`;
  const destination = `${destLat},${destLng}`;

  // Build request for Routes API
  const url = `https://maps.googleapis.com/maps/api/directions/json`;
  const params = new URLSearchParams({
    origin,
    destination,
    key: apiKey,
    departure_time: 'now',
  });

  try {
    const response = await fetch(`${url}?${params}`);
    const data = await response.json();

    if (data.status !== 'OK' || !data.routes.length) {
      console.warn(
        `Routes API error for ${origin} → ${destination}: ${data.status}`
      );
      return null;
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    // Extract durations (in seconds, convert to minutes)
    const baselineDuration = leg.duration.value / 60;
    const currentDuration = leg.duration_in_traffic
      ? leg.duration_in_traffic.value / 60
      : baselineDuration;

    const delay = currentDuration - baselineDuration;
    const congestion = calculateCongestionLevel(delay);

    return {
      baseline: Math.round(baselineDuration),
      current: Math.round(currentDuration),
      delay: Math.round(delay * 10) / 10, // Round to 1 decimal place
      congestion,
    };
  } catch (error) {
    console.error(`Error fetching travel times: ${error.message}`);
    return null;
  }
}

/**
 * Calculate congestion for all junctions based on road segments
 * @param {Array} junctions - Array of junction objects
 * @param {Array} roadConnections - Array of [fromId, toId] pairs
 * @param {string} apiKey - Google Maps API key
 * @returns {Promise<Object>} - Map of junctionId → congestion level
 */
export async function calculateAllCongestions(junctions, roadConnections, apiKey) {
  const congestionMap = {};

  // Initialize all junctions with default LOW congestion
  junctions.forEach(j => {
    congestionMap[j.id] = 'LOW';
  });

  // Trim API key to remove any whitespace
  const trimmedKey = apiKey?.trim() || '';

  if (!trimmedKey || trimmedKey === 'YOUR_API_KEY_HERE') {
    console.warn('Google Maps API key not configured, using fallback congestion data');
    return congestionMap;
  }

  try {
    // Fetch travel times for each road connection
    const promises = roadConnections.map(async ([fromId, toId]) => {
      const fromJunction = junctions.find(j => j.id === fromId);
      const toJunction = junctions.find(j => j.id === toId);

      if (!fromJunction || !toJunction) return;

      const result = await fetchTravelTimes(
        fromJunction.lat,
        fromJunction.lng,
        toJunction.lat,
        toJunction.lng,
        trimmedKey
      );

      if (result) {
        // Update both endpoints with the congestion from this segment
        // Use the worse of the two for the more critical junction
        congestionMap[fromId] = result.congestion;
        congestionMap[toId] = result.congestion;
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Error calculating congestions:', error);
    // Return fallback congestion (all LOW)
  }

  return congestionMap;
}
