import { toast } from "sonner";

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

function normalizeLongitude(longitude: number): number {
  return ((longitude + 180) % 360 + 360) % 360 - 180;
}

function validateCoordinates(coordinates: Coordinates): Coordinates {
  const { latitude, longitude } = coordinates;
  
  const validLatitude = Math.max(-90, Math.min(90, latitude));
  
  const validLongitude = normalizeLongitude(longitude);
  
  return {
    latitude: validLatitude,
    longitude: validLongitude
  };
}

export async function fetchWeatherData(coordinates: Coordinates): Promise<WeatherData | null> {
  try {
    const { latitude, longitude } = validateCoordinates(coordinates);
    
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m&timezone=auto`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    
    const data = await response.json();
    
    const cloudCover = data.current.cloud_cover;
    let condition = "clear";
    
    if (cloudCover < 10) condition = "clear";
    else if (cloudCover < 30) condition = "partly cloudy";
    else if (cloudCover < 70) condition = "cloudy";
    else condition = "overcast";
    
    if (data.current.precipitation > 0.5) condition = "rain";
    
    return {
      cloudCover: cloudCover,
      windSpeed: Math.round(data.current.wind_speed_10m * 0.621371),
      humidity: data.current.relative_humidity_2m,
      temperature: data.current.temperature_2m,
      time: data.current.time,
      condition: condition,
      precipitation: data.current.precipitation
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    toast.error("Weather Data Error", {
      description: "Could not retrieve current weather conditions. Please try again later.",
    });
    return null;
  }
}

export async function fetchForecastData(coordinates: Coordinates): Promise<any> {
  try {
    const { latitude, longitude } = validateCoordinates(coordinates);
    
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m&forecast_hours=24&timezone=auto`
    );
    
    if (!response.ok) {
      console.error('Failed to fetch forecast data: Response not OK');
      return createFallbackForecastData();
    }
    
    const data = await response.json();
    
    if (!data || !data.hourly || !Array.isArray(data.hourly.time) || data.hourly.time.length === 0) {
      console.error('Invalid forecast data structure', data);
      return createFallbackForecastData();
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    toast.error("Forecast Data Error", {
      description: "Could not retrieve weather forecast. Using estimated data instead.",
    });
    return createFallbackForecastData();
  }
}

function createFallbackForecastData() {
  const hourly = {
    time: [],
    temperature_2m: [],
    relative_humidity_2m: [],
    precipitation: [],
    cloud_cover: [],
    wind_speed_10m: []
  };
  
  const now = new Date();
  
  for (let i = 0; i < 24; i++) {
    const forecastTime = new Date(now);
    forecastTime.setHours(now.getHours() + i);
    
    hourly.time.push(forecastTime.toISOString());
    hourly.temperature_2m.push(20 + Math.round(Math.random() * 10));
    hourly.relative_humidity_2m.push(60 + Math.round(Math.random() * 30));
    hourly.precipitation.push(Math.random() * 0.5);
    hourly.cloud_cover.push(Math.round(Math.random() * 100));
    hourly.wind_speed_10m.push(5 + Math.round(Math.random() * 15));
  }
  
  return { hourly };
}

export function determineWeatherCondition(cloudCover: number): string {
  if (cloudCover < 10) return "clear";
  if (cloudCover < 30) return "partly cloudy";
  if (cloudCover < 70) return "cloudy";
  return "overcast";
}

function calculateSeeingCondition(cloudCover: number, humidity: number, windSpeed: number): string {
  if (cloudCover > 80) return "Poor";
  
  let seeingScore = 10;
  
  seeingScore -= (cloudCover / 20);
  
  seeingScore -= (humidity > 70 ? (humidity - 70) / 10 : 0);
  
  seeingScore -= (windSpeed > 10 ? Math.min(3, (windSpeed - 10) / 5) : 0);
  
  if (seeingScore >= 8) return "Excellent";
  if (seeingScore >= 6) return "Good";
  if (seeingScore >= 4) return "Average";
  if (seeingScore >= 2) return "Poor";
  return "Very Poor";
}

export function generateBaiduMapsUrl(latitude: number, longitude: number): string {
  return `https://api.map.baidu.com/marker?location=${latitude},${longitude}&title=Astrophotography+Location&output=html`;
}

export async function getLocationNameFromCoordinates(
  latitude: number, 
  longitude: number,
  language: 'en' | 'zh' = 'en'
): Promise<string> {
  try {
    const validLat = Math.max(-90, Math.min(90, latitude));
    const validLng = normalizeLongitude(longitude);
    
    try {
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${validLat}&lon=${validLng}&format=json&accept-language=${language}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'AstroSIQS-App'
          }
        }
      );
      
      if (nominatimResponse.ok) {
        const nominatimData = await nominatimResponse.json();
        
        if (nominatimData && nominatimData.display_name) {
          console.log("Got location name from Nominatim:", nominatimData.display_name);
          return nominatimData.display_name;
        }
      }
    } catch (nominatimError) {
      console.error('Error with Nominatim reverse geocoding:', nominatimError);
    }
    
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${validLat}&longitude=${validLng}&localityLanguage=${language}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch location name from primary source');
    }

    const data = await response.json();
    
    let locationName = "";
    
    if (data.locality) {
      locationName += data.locality;
    }
    
    if (data.city && data.city !== data.locality) {
      locationName += locationName ? `, ${data.city}` : data.city;
    }
    
    if (data.countryName && !locationName) {
      if (data.principalSubdivision) {
        locationName = `${data.principalSubdivision}, ${data.countryName}`;
      } else {
        locationName = language === 'en' 
          ? `Location in ${data.countryName}` 
          : `${data.countryName}的位置`;
      }
    }
    
    if (!locationName) {
      locationName = language === 'en'
        ? `Location at ${validLat.toFixed(4)}, ${validLng.toFixed(4)}`
        : `位置：${validLat.toFixed(4)}, ${validLng.toFixed(4)}`;
    }

    console.log("Got location name from BigDataCloud:", locationName);
    return locationName;
  } catch (error) {
    console.error('Error fetching location name from all sources:', error);
    
    try {
      const geocodeResponse = await fetch(
        `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      
      if (geocodeResponse.ok) {
        const data = await geocodeResponse.json();
        if (data && data.display_name) {
          console.log("Got location name from maps.co:", data.display_name);
          return data.display_name;
        }
      }
    } catch (fallbackError) {
      console.error('Error with fallback geocoder:', fallbackError);
    }
    
    return language === 'en'
      ? `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      : `位置：${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
}

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
  distance?: number;
}

const SHARED_SPOTS_KEY = "astrospot_shared_locations";
const RECENT_LOCATIONS_KEY = "astrospot_recent_locations";

export function getSharedAstroSpots(generateIfEmpty: boolean = true): SharedAstroSpot[] {
  try {
    const spotsJson = localStorage.getItem(SHARED_SPOTS_KEY);
    if (!spotsJson && generateIfEmpty) return generateRealisticPhotoPoints();
    if (!spotsJson) return [];
    const spots = JSON.parse(spotsJson);
    return spots.length === 0 && generateIfEmpty ? generateRealisticPhotoPoints() : spots;
  } catch (error) {
    console.error("Error retrieving shared spots:", error);
    return generateIfEmpty ? generateRealisticPhotoPoints() : [];
  }
}

export function shareAstroSpot(spot: Omit<SharedAstroSpot, "id">): SharedAstroSpot {
  try {
    const spots = getSharedAstroSpots(false);
    const newSpot: SharedAstroSpot = {
      ...spot,
      id: Date.now().toString(),
    };
    
    const updatedSpots = [newSpot, ...spots];
    localStorage.setItem(SHARED_SPOTS_KEY, JSON.stringify(updatedSpots));
    
    toast.success("Spot Shared", {
      description: "Your astrophotography spot has been shared successfully!",
    });
    
    return newSpot;
  } catch (error) {
    console.error("Error sharing spot:", error);
    toast.error("Sharing Failed", {
      description: "Could not share your spot. Please try again.",
    });
    throw error;
  }
}

export function getRecommendedPhotoPoints(userLocation?: { latitude: number; longitude: number } | null): Array<SharedAstroSpot> {
  const allSpots = getSharedAstroSpots();
  
  if (!userLocation) {
    return allSpots.slice(0, 4);
  }
  
  const spotsWithDistance = allSpots.map(spot => ({
    ...spot,
    distance: calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      spot.latitude,
      spot.longitude
    )
  }));
  
  return spotsWithDistance
    .filter(spot => spot.distance && spot.distance <= 1000)
    .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    .slice(0, 4);
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c;
  return distance;
}

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
    if (!locationsJson) return [];
    return JSON.parse(locationsJson);
  } catch (error) {
    console.error("Error retrieving recent locations:", error);
    return [];
  }
}

export function saveRecentLocation(location: {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  siqs: number;
  isViable: boolean;
}): void {
  try {
    const existingLocations = getRecentLocations();
    const newLocation = {
      ...location,
      timestamp: new Date().toISOString()
    };
    
    const updatedLocations = [newLocation, ...existingLocations]
      .slice(0, 10);
      
    localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(updatedLocations));
  } catch (error) {
    console.error("Error saving recent location:", error);
  }
}

function generateRealisticPhotoPoints(): SharedAstroSpot[] {
  const spots: SharedAstroSpot[] = [];
  
  const worldClassLocations = [
    {
      name: "Atacama Desert",
      latitude: -23.4592,
      longitude: -69.2520,
      siqs: 9.7,
      description: "One of the driest places on Earth with exceptionally clear skies. Perfect for deep-sky astrophotography.",
      photographer: "Michael Chen",
      photoUrl: "https://images.unsplash.com/photo-1465101162946-4377e57745c3?q=80&w=2078&auto=format&fit=crop"
    },
    {
      name: "Mauna Kea Summit",
      latitude: 19.8207,
      longitude: -155.4681,
      siqs: 9.5,
      description: "High altitude (14,000ft) provides extremely stable air and minimal atmospheric interference for planetary imaging.",
      photographer: "Sarah Johnson",
      photoUrl: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=2013&auto=format&fit=crop"
    },
    {
      name: "NamibRand Nature Reserve",
      latitude: -25.0459,
      longitude: 15.9419,
      siqs: 9.4,
      description: "Africa's first International Dark Sky Reserve, offering pristine views of the southern sky with no light pollution.",
      photographer: "David Williams",
      photoUrl: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?q=80&w=2071&auto=format&fit=crop"
    }
  ];
  
  worldClassLocations.forEach((loc, index) => {
    spots.push({
      id: `wc${index}`,
      name: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      siqs: loc.siqs,
      isViable: true,
      timestamp: new Date().toISOString(),
      description: loc.description,
      photographer: loc.photographer,
      photoUrl: loc.photoUrl,
      targets: ["Milky Way", "Deep Sky Objects", "Planetary Imaging"]
    });
  });
  
  const regions = [
    { name: "Western North America", latBase: 35, lonBase: -115, siqsBase: 7.5 },
    { name: "Eastern North America", latBase: 40, lonBase: -75, siqsBase: 6.0 },
    { name: "Western Europe", latBase: 45, lonBase: 5, siqsBase: 5.5 },
    { name: "Eastern Europe", latBase: 48, lonBase: 25, siqsBase: 6.0 },
    { name: "Northern Africa", latBase: 25, lonBase: 15, siqsBase: 8.0 },
    { name: "Southern Africa", latBase: -30, lonBase: 25, siqsBase: 8.5 },
    { name: "Western Asia", latBase: 30, lonBase: 60, siqsBase: 7.0 },
    { name: "Eastern Asia", latBase: 35, lonBase: 105, siqsBase: 5.0 },
    { name: "Australia", latBase: -25, lonBase: 135, siqsBase: 8.0 },
    { name: "South America", latBase: -15, lonBase: -60, siqsBase: 7.5 }
  ];
  
  const locationTypes = [
    { suffix: "National Park", siqsBonus: 1.2 },
    { suffix: "Observatory", siqsBonus: 1.5 },
    { suffix: "Mountain Peak", siqsBonus: 1.0 },
    { suffix: "Desert Viewpoint", siqsBonus: 1.3 },
    { suffix: "Lake", siqsBonus: 0.7 },
    { suffix: "Plateau", siqsBonus: 0.9 },
    { suffix: "Valley", siqsBonus: 0.6 },
    { suffix: "Island", siqsBonus: 0.8 }
  ];
  
  const photographers = [
    "James Wilson", "Maria Garcia", "Li Wei", "Sophia Ahmed", 
    "Carlos Rodriguez", "Anika Patel", "John Smith", "Emma Chen", 
    "Hiroshi Tanaka", "Olivia Kim", "Xavier Thomas", "Zara Khan"
  ];
  
  regions.forEach((region, regionIndex) => {
    locationTypes.forEach((locType, locIndex) => {
      for (let i = 0; i < 2; i++) {
        const latOffset = (Math.random() - 0.5) * 15;
        const lonOffset = (Math.random() - 0.5) * 15;
        const latitude = region.latBase + latOffset;
        const longitude = region.lonBase + lonOffset;
        
        if (latitude < -90 || latitude > 90) continue;
        
        const randomFactor = 0.5 + Math.random();
        let siqs = (region.siqsBase * locType.siqsBonus * randomFactor);
        siqs = Math.min(9.8, Math.max(3.0, siqs));
        siqs = parseFloat(siqs.toFixed(1));
        
        const id = `r${regionIndex}_l${locIndex}_${i}`;
        
        const photographer = photographers[Math.floor(Math.random() * photographers.length)];
        
        const name = `${region.name} ${locType.suffix}`;
        
        const descriptionParts = [
          "Perfect dark skies for astrophotography.",
          "Limited light pollution from nearby cities.",
          "Excellent seeing conditions throughout the year.",
          "Best during winter months when humidity is low.",
          "Easy access with parking nearby.",
          "Requires a short hike to reach the best viewing spot.",
          "Popular among local astronomers.",
          "Site of several award-winning night sky photos."
        ];
        
        const numParts = 2 + Math.floor(Math.random() * 2);
        const selectedParts = [];
        for (let j = 0; j < numParts; j++) {
          const randomIndex = Math.floor(Math.random() * descriptionParts.length);
          selectedParts.push(descriptionParts[randomIndex]);
          descriptionParts.splice(randomIndex, 1);
          if (descriptionParts.length === 0) break;
        }
        
        const description = selectedParts.join(" ");
        
        const hasPhoto = Math.random() > 0.6;
        const photoUrls = [
          "https://images.unsplash.com/photo-1536293283170-b4add58c3057?q=80&w=2071&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=2013&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?q=80&w=1932&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1504805572947-34fad45aed93?q=80&w=2070&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1533294455009-a771f7861812?q=80&w=2070&auto=format&fit=crop"
        ];
        const photoUrl = hasPhoto ? photoUrls[Math.floor(Math.random() * photoUrls.length)] : undefined;
        
        spots.push({
          id,
          name,
          latitude,
          longitude,
          siqs,
          isViable: siqs >= 5.0,
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          description,
          photographer,
          photoUrl,
          targets: ["Milky Way", "Star Trails", "Deep Sky Objects"]
        });
      }
    });
  });
  
  return spots;
}

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
  
  return reviews;
}

export async function fetchLightPollutionData(latitude: number, longitude: number): Promise<{ bortleScale: number } | null> {
  try {
    const response = await fetch(`https://www.lightpollutionmap.info/QueryRaster/?ql=wa_2015&qt=point&qd=${latitude},${longitude}`);
    
    if (!response.ok) {
      console.warn("Could not fetch light pollution data from primary source, using estimated data");
      return estimateBortleScaleFromLocation(latitude, longitude);
    }
    
    const data = await response.json();
    
    if (data && data.hasOwnProperty('value')) {
      const artificialBrightness = parseFloat(data.value);
      const bortleScale = convertToBortleScale(artificialBrightness);
      
      return { bortleScale };
    } else {
      return estimateBortleScaleFromLocation(latitude, longitude);
    }
  } catch (error) {
    console.error("Error fetching light pollution data:", error);
    return estimateBortleScaleFromLocation(latitude, longitude);
  }
}

function convertToBortleScale(artificialBrightness: number): number {
  if (artificialBrightness < 0.01) return 1;
  if (artificialBrightness < 0.08) return 2;
  if (artificialBrightness < 0.26) return 3;
  if (artificialBrightness < 0.8) return 4;
  if (artificialBrightness < 2.5) return 5;
  if (artificialBrightness < 8) return 6;
  if (artificialBrightness < 25) return 7;
  if (artificialBrightness < 80) return 8;
  return 9;
}

async function estimateBortleScaleFromLocation(latitude: number, longitude: number): Promise<{ bortleScale: number }> {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
    
    if (!response.ok) {
      return estimateBortleScaleFromPopulationDensity(latitude, longitude);
    }
    
    const data = await response.json();
    
    if (data && data.address) {
      return estimateBortleScaleFromAddressData(data.address);
    } else {
      return estimateBortleScaleFromPopulationDensity(latitude, longitude);
    }
  } catch (error) {
    console.error("Error in estimating Bortle scale from location:", error);
    return { bortleScale: 4 };
  }
}

function estimateBortleScaleFromAddressData(address: any): { bortleScale: number } {
  let bortleEstimate = 4;
  
  if (address.city || address.town || address.borough) {
    bortleEstimate = 7;
    
    if (address.city) {
      const population = getPopulationEstimate(address.city, address.country);
      if (population > 1000000) {
        bortleEstimate = 8.5;
      } else if (population > 100000) {
        bortleEstimate = 7.5;
      }
    }
  } else if (address.village || address.hamlet) {
    bortleEstimate = 3.5;
  } else if (address.national_park || address.natural || address.leisure === 'nature_reserve') {
    bortleEstimate = 2.5;
  }
  
  if (address.country) {
    if (['New Zealand', 'Chile', 'Namibia', 'Mongolia'].includes(address.country)) {
      bortleEstimate = Math.max(1, bortleEstimate - 1.5);
    } else if (['United States', 'Canada', 'Australia'].includes(address.country)) {
      bortleEstimate = Math.max(1, bortleEstimate - 0.5);
    } else if (['Japan', 'South Korea', 'Netherlands', 'Belgium'].includes(address.country)) {
      bortleEstimate = Math.min(9, bortleEstimate + 1);
    }
  }
  
  return { bortleScale: Math.max(1, Math.min(9, bortleEstimate)) };
}

function getPopulationEstimate(city: string, country: string): number {
  const majorCities: Record<string, number> = {
    'Tokyo': 37400000,
    'Delhi': 31200000,
    'Shanghai': 27100000,
    'Beijing': 22000000, 
    'Mumbai': 20700000,
    'New York': 18800000,
    'London': 9500000,
    'Paris': 11000000,
    'Los Angeles': 12500000,
    'Berlin': 3700000,
    'Madrid': 6600000,
    'Rome': 4300000,
    'Moscow': 12500000,
    'Hong Kong': 7500000,
    'Singapore': 5700000,
    'Bangkok': 10500000,
    'Sydney': 5300000,
    'Toronto': 6300000,
    'Seoul': 9800000,
    'Mexico City': 21800000,
    'Cairo': 20900000,
    'Buenos Aires': 15100000,
    'Istanbul': 15500000,
    'Lahore': 13000000,
    'Lima': 10700000
  };
  
  if (majorCities[city]) {
    return majorCities[city];
  }
  
  for (const knownCity in majorCities) {
    if (city.includes(knownCity) || knownCity.includes(city)) {
      return majorCities[knownCity];
    }
  }
  
  if (country) {
    const highPopulationCountries = ['China', 'India', 'Indonesia', 'Pakistan', 'Brazil', 'Nigeria'];
    if (highPopulationCountries.includes(country)) {
      return 500000;
    }
  }
  
  return 100000;
}

async function estimateBortleScaleFromPopulationDensity(latitude: number, longitude: number): Promise<{ bortleScale: number }> {
  const majorCityCoordinates = [
    {name: "New York", lat: 40.7128, lon: -74.0060, bortle: 8.5},
    {name: "London", lat: 51.5074, lon: -0.1278, bortle: 8.5},
    {name: "Tokyo", lat: 35.6762, lon: 139.6503, bortle: 9},
    {name: "Paris", lat: 48.8566, lon: 2.3522, bortle: 8},
    {name: "Los Angeles", lat: 34.0522, lon: -118.2437, bortle: 8},
    {name: "Hong Kong", lat: 22.3193, lon: 114.1694, bortle: 9},
    {name: "Shanghai", lat: 31.2304, lon: 121.4737, bortle: 9},
    {name: "Moscow", lat: 55.7558, lon: 37.6173, bortle: 8},
    {name: "Delhi", lat: 28.6139, lon: 77.2090, bortle: 8.5},
    {name: "Sydney", lat: -33.8688, lon: 151.2093, bortle: 7.5},
    {name: "Beijing", lat: 39.9042, lon: 116.4074, bortle: 9},
    {name: "Cairo", lat: 30.0444, lon: 31.2357, bortle: 8},
    {name: "Mexico City", lat: 19.4326, lon: -99.1332, bortle: 8},
    {name: "Mumbai", lat: 19.0760, lon: 72.8777, bortle: 8.5},
    {name: "Berlin", lat: 52.5200, lon: 13.4050, bortle: 7.5}
  ];
  
  for (const city of majorCityCoordinates) {
    const distance = calculateDistance(latitude, longitude, city.lat, city.lon);
    
    if (distance < 50) {
      const distanceAdjustment = distance / 10;
      return { bortleScale: Math.max(4, city.bortle - distanceAdjustment) };
    }
    
    if (distance < 100) {
      return { bortleScale: Math.max(3, city.bortle - 2) };
    }
  }
  
  const latAbs = Math.abs(latitude);
  if (latAbs > 66) {
    return { bortleScale: 1 };
  } else if (latAbs > 60) {
    return { bortleScale: 2 };
  }
  
  return { bortleScale: 4 };
}
