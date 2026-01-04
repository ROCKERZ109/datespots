// Helper function to convert degrees to radians
const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

/**
 * Calculates the distance between two geographical points using the Haversine formula.
 * @param coord1 The starting point { lat, lng }.
 * @param coord2 The ending point { lat, lng }.
 * @returns The distance in meters.
 */
export const getDistance = (
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number => {
  const R = 6371000; // Earth's radius in meters

  const dLat = deg2rad(coord2.lat - coord1.lat);
  const dLon = deg2rad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(coord1.lat)) *
    Math.cos(deg2rad(coord2.lat)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in meters

  return distance;
};