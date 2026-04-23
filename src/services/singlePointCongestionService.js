/**
 * Single-point congestion calculation
 *
 * Instead of measuring between two junctions, we create two points around
 * each junction (north and south) and measure traffic speed through that junction.
 *
 * This gives us real-time congestion at a single location using Google Maps Routes API.
 */

const CONGESTION_THRESHOLDS = {
  LOW: 3,      // < 3 min/km = free flow
  MEDIUM: 10,  // 3-10 min/km = moderate
  HIGH: Infinity, // > 10 min/km = congested
};

/**
 * Calculate speed in km/h from duration and distance
 * @param {number} durationMinutes - Travel time in minutes
 * @param {number} distanceMeters - Distance in meters
 * @returns {number} Speed in km/h
 */
function calculateSpeed(durationMinutes, distanceMeters) {
  if (durationMinutes === 0 || distanceMeters === 0) return 0;
  const distanceKm = distanceMeters / 1000;
  const speedKmh = (distanceKm / durationMinutes) * 60;
  return Math.round(speedKmh);
}

/**
 * Calculate congestion based on travel time delay
 * Classifies based on how much longer it takes to pass through junction vs normal conditions
 *
 * @param {number} delayMinutes - Difference between current travel time and baseline travel time
 * @returns {string} Congestion level: 'LOW', 'MEDIUM', or 'HIGH'
 */
export function calculateCongestionFromDelay(delayMinutes) {
  // Classify based on delay:
  // LOW: < 3 minutes delay (minimal congestion)
  // MEDIUM: 3-10 minutes delay (moderate congestion)
  // HIGH: > 10 minutes delay (heavy congestion)

  if (delayMinutes < 3) {
    return 'LOW';
  } else if (delayMinutes < 10) {
    return 'MEDIUM';
  } else {
    return 'HIGH';
  }
}

/**
 * Calculate offset coordinates in a given direction
 * Uses simple lat/lng offset (approximately 1 degree = 111 km)
 *
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @param {number} direction - Direction in degrees (0=North, 90=East, 180=South, 270=West)
 * @param {number} distanceMeters - Distance to offset (default 1000m)
 * @returns {object} {lat, lng}
 */
function getOffsetCoordinates(lat, lng, direction, distanceMeters = 1000) {
  const EARTH_RADIUS_KM = 6371;
  const distanceKm = distanceMeters / 1000;

  // Convert to radians
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const directionRad = (direction * Math.PI) / 180;

  // Calculate angular distance
  const angularDistance = distanceKm / EARTH_RADIUS_KM;

  // Calculate new coordinates
  const newLat = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
    Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(directionRad)
  );

  const newLng = lngRad + Math.atan2(
    Math.sin(directionRad) * Math.sin(angularDistance) * Math.cos(latRad),
    Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(newLat)
  );

  return {
    lat: (newLat * 180) / Math.PI,
    lng: (newLng * 180) / Math.PI,
  };
}

/**
 * Fetch a single route segment with traffic data
 * @param {number} originLat
 * @param {number} originLng
 * @param {number} destLat
 * @param {number} destLng
 * @param {string} apiKey
 * @returns {Promise<{duration: number, baselineDuration: number, distance: number}>}
 */
async function fetchSegment(originLat, originLng, destLat, destLng, apiKey) {
  const origin = `${originLat},${originLng}`;
  const destination = `${destLat},${destLng}`;

  const url = `/api/directions`;
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
      return null;
    }

    const leg = data.routes[0].legs[0];
    return {
      duration: leg.duration_in_traffic?.value || leg.duration.value,
      baselineDuration: leg.duration.value,
      distance: leg.distance.value,
    };
  } catch (error) {
    console.error(`❌ Error fetching segment ${origin} → ${destination}: ${error.message}`);
    return null;
  }
}

/**
 * Fetch travel times through a junction (two legs: origin→junction + junction→destination)
 * @param {number} originLat - Origin latitude
 * @param {number} originLng - Origin longitude
 * @param {number} junctionLat - Junction latitude
 * @param {number} junctionLng - Junction longitude
 * @param {number} destLat - Destination latitude
 * @param {number} destLng - Destination longitude
 * @param {string} apiKey - Google Maps API key
 * @returns {Promise<{duration: number, distance: number, status: string}>}
 */
async function fetchRouteDuration(originLat, originLng, junctionLat, junctionLng, destLat, destLng, apiKey) {
  const origin = `${originLat},${originLng}`;
  const junction = `${junctionLat},${junctionLng}`;
  const destination = `${destLat},${destLng}`;

  try {
    // Fetch both segments in parallel
    const [leg1, leg2] = await Promise.all([
      fetchSegment(originLat, originLng, junctionLat, junctionLng, apiKey),
      fetchSegment(junctionLat, junctionLng, destLat, destLng, apiKey),
    ]);

    if (!leg1 || !leg2) {
      console.error(`❌ Routes API error: Could not fetch segments for ${origin} → ${junction} → ${destination}`);
      return null;
    }

    const result = {
      duration: leg1.duration + leg2.duration,
      distance: leg1.distance + leg2.distance,
      baselineDuration: leg1.baselineDuration + leg2.baselineDuration,
      status: 'OK',
    };

    const delaySeconds = result.duration - result.baselineDuration;
    console.log(`✓ Route ${origin} → ${junction} → ${destination}: total=${result.duration / 60}min, baseline=${result.baselineDuration / 60}min, delay=${delaySeconds / 60}min`);
    return result;
  } catch (error) {
    console.error(`❌ Error fetching route through junction: ${error.message}`);
    return null;
  }
}

/**
 * Calculate congestion for a single junction checking all directions
 *
 * Checks 8 directions (N, NE, E, SE, S, SW, W, NW) around the junction.
 * If congestion is found in ANY direction, marks junction as congested.
 * Returns the worst (highest) congestion level found.
 *
 * @param {object} junction - Junction object with {id, name, lat, lng}
 * @param {string} apiKey - Google Maps API key
 * @param {number} offsetDistance - Distance to offset from junction in meters (default 1000m)
 * @returns {Promise<{congestion: string, speed: number, freeFlowSpeed: number, delay: number}>}
 */
export async function calculateJunctionCongestion(junction, apiKey, offsetDistance = 1000) {
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    console.warn(`No API key for junction ${junction.name}, defaulting to LOW`);
    return { congestion: 'LOW', speed: 0, freeFlowSpeed: 0, delay: 0 };
  }

  // Check all 8 directions around the junction
  // Directions: 0=N, 45=NE, 90=E, 135=SE, 180=S, 225=SW, 270=W, 315=NW
  const directions = [0, 45, 90, 135, 180, 225, 270, 315];
  const congestionResults = [];

  try {
    // Check congestion in all directions in parallel
    const promises = directions.map(async (direction) => {
      const oppositeDirection = (direction + 180) % 360;

      // Create two points: one in the direction, one opposite
      const pointA = getOffsetCoordinates(junction.lat, junction.lng, direction, offsetDistance);
      const pointB = getOffsetCoordinates(junction.lat, junction.lng, oppositeDirection, offsetDistance);

      const result = await fetchRouteDuration(
        pointA.lat,
        pointA.lng,
        junction.lat,
        junction.lng,
        pointB.lat,
        pointB.lng,
        apiKey
      );

      if (!result) {
        return { congestion: 'LOW', speed: 0, freeFlowSpeed: 0, delay: 0 };
      }

      // Calculate speeds
      const currentDuration = result.duration / 60;
      const baselineDuration = result.baselineDuration / 60;

      const currentSpeed = calculateSpeed(currentDuration, result.distance);
      const freeFlowSpeed = calculateSpeed(baselineDuration, result.distance);
      const delayMinutes = currentDuration - baselineDuration;

      const congestion = calculateCongestionFromDelay(delayMinutes);

      return {
        congestion,
        speed: currentSpeed,
        freeFlowSpeed,
        delay: Math.round(delayMinutes * 10) / 10,
        distance: result.distance / 1000,
        direction,
      };
    });

    const results = await Promise.all(promises);
    congestionResults.push(...results);

    // Find the worst (highest) congestion level from all directions
    const congestionPriority = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const worstResult = congestionResults.reduce((worst, current) => {
      return (congestionPriority[current.congestion] || 0) > (congestionPriority[worst.congestion] || 0)
        ? current
        : worst;
    });

    // Log which directions had congestion for debugging
    const congestionByDirection = congestionResults
      .filter(r => r.congestion !== 'LOW')
      .map(r => `${r.direction}°: ${r.congestion}`)
      .join(', ');

    if (congestionByDirection) {
      console.log(`Junction ${junction.name} - Congestion found: ${congestionByDirection}`);
    }

    return {
      congestion: worstResult.congestion,
      speed: worstResult.speed,
      freeFlowSpeed: worstResult.freeFlowSpeed,
      delay: worstResult.delay,
      distance: worstResult.distance,
    };
  } catch (error) {
    console.error(`Error calculating congestion for ${junction.name}:`, error);
    return { congestion: 'LOW', speed: 0, freeFlowSpeed: 0, delay: 0 };
  }
}

/**
 * Calculate congestion for all junctions
 * @param {Array} junctions - Array of junction objects
 * @param {string} apiKey - Google Maps API key
 * @param {number} offsetDistance - Distance to offset from junction in meters
 * @returns {Promise<Object>} Map of junctionId → {congestion, speed, freeFlowSpeed}
 */
export async function calculateAllJunctionsCongestion(junctions, apiKey, offsetDistance = 1000) {
  const congestionMap = {};

  // Initialize all junctions with LOW as fallback
  junctions.forEach(j => {
    congestionMap[j.id] = 'LOW';
  });

  const trimmedKey = apiKey?.trim() || '';

  if (!trimmedKey || trimmedKey === 'YOUR_API_KEY_HERE') {
    console.error('⚠️ API key not configured or invalid. Make sure:');
    console.error('  1. VITE_GOOGLE_MAPS_API_KEY is set in .env');
    console.error('  2. Routes API is enabled in Google Cloud Console');
    console.error('  3. Dev server has been restarted');
    return congestionMap;
  }

  console.log(`🔍 Calculating congestion for ${junctions.length} junctions...`);

  try {
    // Calculate congestion for each junction in parallel
    const promises = junctions.map(async (junction) => {
      const result = await calculateJunctionCongestion(junction, trimmedKey, offsetDistance);
      return { id: junction.id, name: junction.name, ...result };
    });

    const results = await Promise.all(promises);

    // Map results and log them
    let successCount = 0;
    results.forEach(result => {
      congestionMap[result.id] = {
        congestion: result.congestion,
        delay: result.delay,
        speed: result.speed,
        freeFlowSpeed: result.freeFlowSpeed,
      };
      if (result.congestion !== 'LOW') {
        successCount++;
        console.log(`📍 ${result.name}: ${result.congestion} (${result.delay.toFixed(1)} min delay)`);
      }
    });

    console.log(`✓ Congestion calculation complete. ${successCount} junctions with congestion detected.`);
  } catch (error) {
    console.error('❌ Error calculating all junctions congestion:', error);
  }

  return congestionMap;
}
