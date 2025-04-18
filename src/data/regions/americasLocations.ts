
import { LocationEntry } from "../locationDatabase";

/**
 * North and South American locations with accurate Bortle scale values
 */
export const americasLocations: LocationEntry[] = [
  // North American cities
  { name: "New York", coordinates: [40.7128, -74.0060], bortleScale: 8.5, radius: 50, type: 'urban' },
  { name: "Los Angeles", coordinates: [34.0522, -118.2437], bortleScale: 8.4, radius: 45, type: 'urban' },
  { name: "Chicago", coordinates: [41.8781, -87.6298], bortleScale: 8.2, radius: 40, type: 'urban' },
  { name: "Mexico City", coordinates: [19.4326, -99.1332], bortleScale: 8.6, radius: 45, type: 'urban' },
  { name: "Toronto", coordinates: [43.6532, -79.3832], bortleScale: 7.3, radius: 30, type: 'urban' },
  { name: "Montreal", coordinates: [45.5017, -73.5673], bortleScale: 7.2, radius: 30, type: 'urban' },
  { name: "Seattle", coordinates: [47.6062, -122.3321], bortleScale: 7.5, radius: 25, type: 'urban' },
  { name: "Austin", coordinates: [30.2672, -97.7431], bortleScale: 7.0, radius: 20, type: 'urban' },
  
  // South American cities
  { name: "São Paulo", coordinates: [-23.5505, -46.6333], bortleScale: 8.3, radius: 45, type: 'urban' },
  { name: "Buenos Aires", coordinates: [-34.6037, -58.3816], bortleScale: 8.1, radius: 40, type: 'urban' },
  { name: "Rio de Janeiro", coordinates: [-22.9068, -43.1729], bortleScale: 7.9, radius: 40, type: 'urban' },
  { name: "Lima", coordinates: [-12.0464, -77.0428], bortleScale: 7.8, radius: 35, type: 'urban' },
  { name: "Bogotá", coordinates: [4.7110, -74.0721], bortleScale: 7.7, radius: 30, type: 'urban' },
  { name: "Santiago", coordinates: [-33.4489, -70.6693], bortleScale: 7.6, radius: 30, type: 'urban' },
  { name: "Ushuaia", coordinates: [-54.8019, -68.3030], bortleScale: 5.7, radius: 15, type: 'urban' },
  
  // North American natural sites
  { name: "Yellowstone", coordinates: [44.4280, -110.5885], bortleScale: 2.0, radius: 40, type: 'natural' },
  { name: "Grand Canyon", coordinates: [36.1069, -112.1129], bortleScale: 2.2, radius: 30, type: 'natural' },
  { name: "Yosemite", coordinates: [37.7331, -119.5874], bortleScale: 2.8, radius: 25, type: 'natural' },
  { name: "Banff", coordinates: [51.1788, -115.5708], bortleScale: 2.0, radius: 30, type: 'natural' },
  { name: "Jasper Dark Sky Preserve", coordinates: [52.8734, -117.9540], bortleScale: 1.8, radius: 30, type: 'natural' },
  { name: "Death Valley", coordinates: [36.5323, -116.9325], bortleScale: 1.3, radius: 35, type: 'natural' },
  { name: "Denali", coordinates: [63.0695, -151.0074], bortleScale: 1.0, radius: 50, type: 'natural' },
  { name: "Rocky Mountain", coordinates: [40.3428, -105.6836], bortleScale: 2.5, radius: 30, type: 'natural' },
  { name: "Big Bend", coordinates: [29.2498, -103.2502], bortleScale: 1.2, radius: 45, type: 'natural' },
  { name: "Baja California", coordinates: [23.4241, -110.2864], bortleScale: 2.0, radius: 40, type: 'natural' },
  
  // Star-gazing destinations
  { name: "Atacama Desert", coordinates: [-23.4500, -69.2500], bortleScale: 1.0, radius: 60, type: 'dark-site' },
  { name: "Mauna Kea", coordinates: [19.8207, -155.4681], bortleScale: 1.0, radius: 50, type: 'dark-site' },
  { name: "Great Basin", coordinates: [38.9332, -114.2687], bortleScale: 1.0, radius: 50, type: 'dark-site' },
  { name: "Natural Bridges", coordinates: [37.6014, -109.9753], bortleScale: 1.2, radius: 30, type: 'dark-site' },
  { name: "Cherry Springs", coordinates: [41.6626, -77.8169], bortleScale: 1.9, radius: 25, type: 'dark-site' },
  { name: "Churchill", coordinates: [58.7684, -94.1650], bortleScale: 4.8, radius: 20, type: 'rural' },
  { name: "Fairbanks", coordinates: [64.8378, -147.7164], bortleScale: 5.9, radius: 15, type: 'urban' },
];
