import { toast } from "@/components/ui/use-toast";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type WeatherData = {
  cloudCover: number;
  windSpeed: number;
  humidity: number;
  temperature: number;
  time: string;
  condition?: string;
  precipitation?: number;
};

type ForecastItem = {
  time: string;
  temperature: number;
  cloudCover: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  condition: string;
  seeingCondition: string;
};

// Function to fetch current weather data from Open-Meteo API
export async function fetchWeatherData(coordinates: Coordinates): Promise<WeatherData | null> {
  const { latitude, longitude } = coordinates;
  
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m&timezone=auto`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    
    const data = await response.json();
    
    // Determine weather condition based on cloud cover
    const cloudCover = data.current.cloud_cover;
    let condition = "clear";
    
    if (cloudCover < 10) condition = "clear";
    else if (cloudCover < 30) condition = "partly cloudy";
    else if (cloudCover < 70) condition = "cloudy";
    else condition = "overcast";
    
    // Check if there's precipitation to override condition
    if (data.current.precipitation > 0.5) condition = "rain";
    
    // Extract relevant data
    return {
      cloudCover: cloudCover,
      windSpeed: Math.round(data.current.wind_speed_10m * 0.621371), // convert km/h to mph
      humidity: data.current.relative_humidity_2m, // percentage
      temperature: data.current.temperature_2m, // Celsius
      time: data.current.time,
      condition: condition,
      precipitation: data.current.precipitation
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    toast({
      title: "Weather Data Error",
      description: "Could not retrieve current weather conditions. Please try again later.",
      variant: "destructive",
    });
    return null;
  }
}

// Function to fetch 24-hour forecast data
export async function fetchForecastData(coordinates: Coordinates): Promise<ForecastItem[] | null> {
  const { latitude, longitude } = coordinates;
  
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m&forecast_hours=24&timezone=auto`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch forecast data');
    }
    
    const data = await response.json();
    
    // Process the hourly data into our format
    const forecast: ForecastItem[] = [];
    
    for (let i = 0; i < data.hourly.time.length && i < 24; i++) {
      const cloudCover = data.hourly.cloud_cover[i];
      let condition = determineWeatherCondition(cloudCover);
      
      // Override with precipitation if present
      if (data.hourly.precipitation[i] > 0.5) condition = "rain";
      
      // Calculate seeing conditions based on cloud cover, humidity, and wind
      const seeingCondition = calculateSeeingCondition(
        cloudCover,
        data.hourly.relative_humidity_2m[i],
        data.hourly.wind_speed_10m[i]
      );
      
      forecast.push({
        time: data.hourly.time[i],
        temperature: data.hourly.temperature_2m[i],
        cloudCover: cloudCover,
        humidity: data.hourly.relative_humidity_2m[i],
        windSpeed: Math.round(data.hourly.wind_speed_10m[i] * 0.621371), // convert to mph
        precipitation: data.hourly.precipitation[i],
        condition: condition,
        seeingCondition: seeingCondition
      });
    }
    
    return forecast;
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    toast({
      title: "Forecast Data Error",
      description: "Could not retrieve weather forecast. Please try again later.",
      variant: "destructive",
    });
    return null;
  }
}

// Helper to determine weather condition based on cloud cover
export function determineWeatherCondition(cloudCover: number): string {
  if (cloudCover < 10) return "clear";
  if (cloudCover < 30) return "partly cloudy";
  if (cloudCover < 70) return "cloudy";
  return "overcast";
}

// Helper to calculate seeing conditions for astronomy
function calculateSeeingCondition(cloudCover: number, humidity: number, windSpeed: number): string {
  // Poor seeing if completely overcast
  if (cloudCover > 80) return "Poor";
  
  // Calculate a seeing score (0-10, higher is better)
  let seeingScore = 10;
  
  // Cloud cover reduces seeing (0-4 points reduction)
  seeingScore -= (cloudCover / 20);
  
  // High humidity reduces seeing (0-3 points reduction)
  seeingScore -= (humidity > 70 ? (humidity - 70) / 10 : 0);
  
  // High winds reduce seeing (0-3 points reduction)
  seeingScore -= (windSpeed > 10 ? Math.min(3, (windSpeed - 10) / 5) : 0);
  
  // Convert score to category
  if (seeingScore >= 8) return "Excellent";
  if (seeingScore >= 6) return "Good";
  if (seeingScore >= 4) return "Average";
  if (seeingScore >= 2) return "Poor";
  return "Very Poor";
}

// Convert WGS-84 coordinates to Baidu Maps URL
export function generateBaiduMapsUrl(latitude: number, longitude: number): string {
  return `https://api.map.baidu.com/marker?location=${latitude},${longitude}&title=Astrophotography+Location&output=html`;
}

// Improved reverse geocoding to get location name from coordinates with language support
export async function getLocationNameFromCoordinates(
  latitude: number, 
  longitude: number,
  language: 'en' | 'zh' = 'en'
): Promise<string> {
  try {
    // First attempt with BigDataCloud API which is more reliable
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=${language}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch location name from primary source');
    }

    const data = await response.json();
    
    // Create a meaningful location name from the response
    let locationName = "";
    
    if (data.locality) {
      locationName += data.locality;
    }
    
    if (data.city && data.city !== data.locality) {
      locationName += locationName ? `, ${data.city}` : data.city;
    }
    
    if (data.countryName && !locationName) {
      // If we don't have city/locality info, use the broader area
      if (data.principalSubdivision) {
        locationName = `${data.principalSubdivision}, ${data.countryName}`;
      } else {
        locationName = language === 'en' 
          ? `Location in ${data.countryName}` 
          : `${data.countryName}的位置`;
      }
    }
    
    // If we still don't have a name, create a generic one with coordinates
    if (!locationName) {
      locationName = language === 'en'
        ? `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        : `位置：${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }

    console.log("Got location name:", locationName);
    return locationName;
  } catch (error) {
    console.error('Error fetching location name from primary source:', error);
    
    // Fallback to a generic name format if the API call fails
    return language === 'en'
      ? `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      : `位置：${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
}

// Interface for user-shared astrophotography spots
export interface SharedAstroSpot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  siqs: number;
  isViable: boolean;
  timestamp: string;
  description: string;
  photographer: string;
  targets?: string[];
  photoUrl?: string;
  distance?: number; // Added optional distance property
}

// Local storage keys
const SHARED_SPOTS_KEY = "astrospot_shared_locations";
const RECENT_LOCATIONS_KEY = "astrospot_recent_locations";

// Get all user-shared astrophotography spots
export function getSharedAstroSpots(): SharedAstroSpot[] {
  try {
    const spotsJson = localStorage.getItem(SHARED_SPOTS_KEY);
    if (!spotsJson) return getDefaultSharedSpots();
    return JSON.parse(spotsJson);
  } catch (error) {
    console.error("Error retrieving shared spots:", error);
    return getDefaultSharedSpots();
  }
}

// Share a new astrophotography spot
export function shareAstroSpot(spot: Omit<SharedAstroSpot, "id">): SharedAstroSpot {
  try {
    const spots = getSharedAstroSpots();
    const newSpot: SharedAstroSpot = {
      ...spot,
      id: Date.now().toString(),
    };
    
    const updatedSpots = [newSpot, ...spots];
    localStorage.setItem(SHARED_SPOTS_KEY, JSON.stringify(updatedSpots));
    
    toast({
      title: "Spot Shared",
      description: "Your astrophotography spot has been shared successfully!",
    });
    
    return newSpot;
  } catch (error) {
    console.error("Error sharing spot:", error);
    toast({
      title: "Sharing Failed",
      description: "Could not share your spot. Please try again.",
      variant: "destructive",
    });
    throw error;
  }
}

// Get recommended photo points near user location
export function getRecommendedPhotoPoints(userLocation?: { latitude: number; longitude: number } | null): Array<SharedAstroSpot> {
  const allSpots = getSharedAstroSpots();
  
  if (!userLocation) {
    // If no user location, return the first 4 spots
    return allSpots.slice(0, 4);
  }
  
  // Calculate distance for each spot and sort by proximity
  const spotsWithDistance = allSpots.map(spot => ({
    ...spot,
    distance: calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      spot.latitude,
      spot.longitude
    )
  }));
  
  // Sort by distance (closest first)
  return spotsWithDistance
    .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    .slice(0, 4);
}

// Calculate distance between two coordinates in km (haversine formula)
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
}

// Mock function for recent locations (in a real app, this would use local storage or a backend)
export function getRecentLocations(): Array<{
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  siqs: number;
  isViable: boolean;
  timestamp: string;
}> {
  try {
    const locationsJson = localStorage.getItem(RECENT_LOCATIONS_KEY);
    if (!locationsJson) return getDefaultRecentLocations();
    return JSON.parse(locationsJson);
  } catch (error) {
    console.error("Error retrieving recent locations:", error);
    return getDefaultRecentLocations();
  }
}

// Default shared spots if none exist
function getDefaultSharedSpots(): SharedAstroSpot[] {
  return [
    {
      id: "sp1",
      name: "Atacama Desert Observatory Point",
      latitude: -23.4592,
      longitude: -69.2520,
      siqs: 9.7,
      isViable: true,
      timestamp: "2023-12-15T20:34:00Z",
      description: "Perfect dark skies for deep-sky photography. No light pollution and exceptional seeing conditions.",
      photographer: "Michael Thompson",
      targets: ["Carina Nebula", "Southern Cross", "Omega Centauri"],
      photoUrl: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=2013&auto=format&fit=crop"
    },
    {
      id: "sp2",
      name: "Mauna Kea Summit",
      latitude: 19.8207,
      longitude: -155.4681,
      siqs: 9.5,
      isViable: true,
      timestamp: "2023-12-10T19:22:00Z",
      description: "High altitude (14,000ft) provides extremely stable air and minimal atmospheric interference.",
      photographer: "Sarah Chen",
      targets: ["Andromeda Galaxy", "Pleiades", "Orion Nebula"],
      photoUrl: "https://images.unsplash.com/photo-1465101162946-4377e57745c3?q=80&w=2078&auto=format&fit=crop"
    },
    {
      id: "sp3",
      name: "Namibia Desert Viewpoint",
      latitude: -24.7275,
      longitude: 15.4061,
      siqs: 9.3,
      isViable: true,
      timestamp: "2023-12-05T21:15:00Z",
      description: "One of the darkest skies in Africa, ideal for Milky Way core photography.",
      photographer: "David Astrophoto",
      targets: ["Milky Way Core", "Lagoon Nebula", "Rho Ophiuchi"]
    },
    {
      id: "sp4",
      name: "La Palma Observatory",
      latitude: 28.7636,
      longitude: -17.8916,
      siqs: 9.0,
      isViable: true,
      timestamp: "2023-11-28T18:45:00Z",
      description: "Protected dark sky site with excellent conditions for planetary imaging.",
      photographer: "Elena Rodriguez",
      targets: ["Jupiter", "Saturn", "Mars"],
      photoUrl: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?q=80&w=2071&auto=format&fit=crop"
    },
    {
      id: "sp5",
      name: "Bryce Canyon National Park",
      latitude: 37.6283,
      longitude: -112.1684,
      siqs: 8.8,
      isViable: true,
      timestamp: "2023-11-20T22:10:00Z",
      description: "Clear, dry air and minimal light pollution make this a perfect spot for wide-field Milky Way shots.",
      photographer: "Jonathan Kim",
      targets: ["Milky Way", "Andromeda Galaxy", "North America Nebula"]
    },
    {
      id: "sp6",
      name: "Teide Observatory",
      latitude: 28.3,
      longitude: -16.5097,
      siqs: 8.7,
      isViable: true,
      timestamp: "2023-11-15T20:30:00Z",
      description: "Located above the cloud layer on Mount Teide, excellent for both deep sky and planetary imaging.",
      photographer: "Maria Gonzalez",
      targets: ["Saturn", "Orion Nebula", "Pleiades"]
    },
    {
      id: "sp7",
      name: "Death Valley National Park",
      latitude: 36.5323,
      longitude: -116.9325,
      siqs: 8.5,
      isViable: true,
      timestamp: "2023-11-10T23:15:00Z",
      description: "Gold-tier Dark Sky Park with extremely low humidity, perfect for galaxy photography.",
      photographer: "Alex Nightscape",
      targets: ["Triangulum Galaxy", "Andromeda Galaxy", "California Nebula"]
    },
    {
      id: "sp8",
      name: "NamibRand Nature Reserve",
      latitude: -25.0459,
      longitude: 15.9419,
      siqs: 8.9,
      isViable: true,
      timestamp: "2023-11-05T21:40:00Z",
      description: "Africa's first International Dark Sky Reserve, offering pristine views of the southern sky.",
      photographer: "Thomas Wright",
      targets: ["Large Magellanic Cloud", "Small Magellanic Cloud", "Southern Cross"]
    }
  ];
}

// Default recent locations if none exist
function getDefaultRecentLocations() {
  return [
    {
      id: "1",
      name: "Atacama Desert",
      latitude: -23.4567,
      longitude: -69.2344,
      siqs: 9.2,
      isViable: true,
      timestamp: "2023-12-15T20:34:00Z"
    },
    {
      id: "2",
      name: "Haleakala Summit",
      latitude: 20.7097,
      longitude: -156.2533,
      siqs: 8.7,
      isViable: true,
      timestamp: "2023-12-10T19:22:00Z"
    },
    {
      id: "3",
      name: "Cherry Springs State Park",
      latitude: 41.6661,
      longitude: -77.8256,
      siqs: 7.5,
      isViable: true,
      timestamp: "2023-12-05T21:15:00Z"
    }
  ];
}

// Mock function to get reviews
export function getLocationReviews(locationId: string): Array<{
  id: string;
  author: string;
  content: string;
  rating: number;
  timestamp: string;
  photoUrl?: string;
}> {
  const reviews = [
    {
      id: "r1",
      author: "AstroMike",
      content: "Incredible dark skies! I was able to capture amazing details in the Milky Way core. Just watch out for the sudden temperature drop around 2 AM.",
      rating: 5,
      timestamp: "2023-11-28T14:22:00Z",
      photoUrl: "https://images.unsplash.com/photo-1465101162946-4377e57745c3?q=80&w=2078&auto=format&fit=crop"
    },
    {
      id: "r2",
      author: "GalaxyHunter",
      content: "Good location but some light pollution from the nearby town affected my photos. Still got decent results.",
      rating: 4,
      timestamp: "2023-11-15T09:45:00Z",
      photoUrl: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=2013&auto=format&fit=crop"
    },
    {
      id: "r3",
      author: "CosmicCapture",
      content: "Perfect for wide-field astrophotography! Easy access and safe area. The seeing conditions were exceptional.",
      rating: 5,
      timestamp: "2023-10-22T11:32:00Z"
    }
  ];
  
  // In a real app, we would filter by locationId
  return reviews;
}
