
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
    
    // Extract relevant data
    return {
      cloudCover: data.current.cloud_cover, // percentage
      windSpeed: Math.round(data.current.wind_speed_10m * 0.621371), // convert km/h to mph
      humidity: data.current.relative_humidity_2m, // percentage
      temperature: data.current.temperature_2m, // Celsius
      time: data.current.time,
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

// Convert WGS-84 coordinates to Baidu Maps URL
export function generateBaiduMapsUrl(latitude: number, longitude: number): string {
  // Simple implementation without true coordinate transformation
  // In a production app, we'd use the coordtransform library for accurate conversion
  return `https://api.map.baidu.com/marker?location=${latitude},${longitude}&title=Astrophotography+Location&output=html`;
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
