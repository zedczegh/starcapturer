export const saveLocationDetails = (id: string, data: any) => {
  try {
    // Save most recent location details
    localStorage.setItem(`location_details_${id}`, JSON.stringify({
      ...data,
      timestamp: new Date().toISOString()
    }));
    
    // Save as the latest location 
    localStorage.setItem('latest_location', JSON.stringify({
      id,
      name: data.name,
      latitude: data.latitude,
      longitude: data.longitude,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error saving location details:', error);
  }
};

export const getLocationDetails = (id: string): any | null => {
  try {
    const data = localStorage.getItem(`location_details_${id}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving location details:', error);
    return null;
  }
};

// For NavBar and navigation use
export const getSavedLocation = (): any | null => {
  try {
    // First check latest_location
    const latestLocation = localStorage.getItem('latest_location');
    if (latestLocation) {
      return JSON.parse(latestLocation);
    }
    
    // Fall back to latest_siqs_location if available
    const siqsLocation = localStorage.getItem('latest_siqs_location');
    if (siqsLocation) {
      const parsed = JSON.parse(siqsLocation);
      return {
        id: `loc-${parsed.latitude.toFixed(6)}-${parsed.longitude.toFixed(6)}`,
        name: parsed.name,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        timestamp: new Date().toISOString()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving saved location:', error);
    return null;
  }
};
