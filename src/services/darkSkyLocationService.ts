
// Extract for this portion to fix the errors
function createDarkSkyLocationEntry(entry: any, userLatitude: number, userLongitude: number): SharedAstroSpot {
  const lat = entry.coordinates[0]; 
  const lng = entry.coordinates[1];
  
  const distance = calculateDistance(
    userLatitude,
    userLongitude,
    lat,
    lng
  );
  
  return {
    id: `dark-sky-${entry.id || generateId()}`,
    name: entry.name,
    latitude: lat,
    longitude: lng,
    bortleScale: entry.bortleScale || 2,
    siqs: entry.siqs || (10 - (entry.bortleScale || 2)),
    isDarkSkyReserve: true,
    certification: entry.certification || "International Dark Sky Reserve",
    isViable: true,
    distance,
    timestamp: new Date().toISOString()
  };
}
