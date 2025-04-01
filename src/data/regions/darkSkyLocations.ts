
/**
 * Dark Sky Locations database
 * Data sourced from the International Dark Sky Places program
 * https://darksky.org/what-we-do/international-dark-sky-places/all-places/
 */

import { LocationEntry } from '../locationDatabase';

// Category icons mapping for dark sky locations
export const darkSkyCategoryIcons = {
  'International Dark Sky Park': 'tree-deciduous',
  'International Dark Sky Reserve': 'moon',
  'International Dark Sky Sanctuary': 'star',
  'International Dark Sky Community': 'landmark',
  'Urban Night Sky Place': 'building-2',
  'Dark Sky Friendly Development of Distinction': 'home'
};

export const darkSkyLocations: LocationEntry[] = [
  // International Dark Sky Parks
  { name: "Aenos National Park", coordinates: [38.1448, 20.6588], bortleScale: 3, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Albanyà", coordinates: [42.3062, 2.7218], bortleScale: 3, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "AlUla Manara and AlGharameel Nature Reserves", coordinates: [26.6117, 37.9157], bortleScale: 2, radius: 25, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "AMC Maine Woods", coordinates: [45.6771, -69.4505], bortleScale: 2, radius: 30, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Antelope Island State Park", coordinates: [41.0583, -112.2166], bortleScale: 3, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Anza-Borrego Desert State Park", coordinates: [33.0956, -116.3016], bortleScale: 2, radius: 40, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Arches National Park", coordinates: [38.7331, -109.5925], bortleScale: 2, radius: 25, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Big Bend National Park", coordinates: [29.2498, -103.2502], bortleScale: 1, radius: 50, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Big Bend Ranch State Park", coordinates: [29.4712, -103.9859], bortleScale: 1, radius: 40, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Big Cypress National Preserve", coordinates: [25.9000, -81.3200], bortleScale: 3, radius: 25, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Black Canyon of the Gunnison National Park", coordinates: [38.5754, -107.7416], bortleScale: 2, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Bodmin Moor Dark Sky Landscape", coordinates: [50.5169, -4.6580], bortleScale: 3, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Browns Canyon National Monument", coordinates: [38.6546, -106.0569], bortleScale: 2, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Bruneau Dunes State Park", coordinates: [42.8961, -115.6917], bortleScale: 2, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Bryce Canyon National Park", coordinates: [37.5930, -112.1871], bortleScale: 1, radius: 25, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Buffalo National River", coordinates: [36.0410, -92.9067], bortleScale: 3, radius: 20, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Bükk National Park", coordinates: [48.0667, 20.5333], bortleScale: 3, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Canyonlands National Park", coordinates: [38.2000, -109.9333], bortleScale: 1, radius: 30, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Cape Lookout National Seashore", coordinates: [34.6077, -76.5360], bortleScale: 3, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Capitol Reef National Park", coordinates: [38.3670, -111.2615], bortleScale: 1, radius: 25, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Capulin Volcano National Monument", coordinates: [36.7811, -103.9694], bortleScale: 2, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Cedar Breaks National Monument", coordinates: [37.6350, -112.8450], bortleScale: 2, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Chaco Culture National Historical Park", coordinates: [36.0600, -107.9700], bortleScale: 1, radius: 25, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Cherry Springs State Park", coordinates: [41.6626, -77.8169], bortleScale: 2, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Chiricahua National Monument", coordinates: [32.0133, -109.3417], bortleScale: 2, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "City of Rocks National Reserve", coordinates: [42.0772, -113.7220], bortleScale: 2, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Clayton Lake State Park", coordinates: [36.5800, -103.3100], bortleScale: 2, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Copper Breaks State Park", coordinates: [34.1147, -99.7511], bortleScale: 2, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Cottonwood Canyon State Park", coordinates: [45.4000, -120.4700], bortleScale: 2, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Craters Of The Moon National Monument", coordinates: [43.4166, -113.5166], bortleScale: 1, radius: 20, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Curecanti National Recreation Area", coordinates: [38.4500, -107.1600], bortleScale: 2, radius: 20, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Dark Sky Park Bulbjerg", coordinates: [57.1525, 8.7867], bortleScale: 3, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "De Boschplaat", coordinates: [53.4200, 5.4700], bortleScale: 3, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Dead Horse Point State Park", coordinates: [38.4700, -109.7400], bortleScale: 2, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Death Valley National Park", coordinates: [36.5323, -116.9325], bortleScale: 1, radius: 50, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Desengano State Park", coordinates: [-21.8700, -41.9300], bortleScale: 3, radius: 20, type: 'dark-site', certification: 'International Dark Sky Park' },
  
  // Additional Dark Sky Parks
  { name: "Dinosaur National Monument", coordinates: [40.5000, -108.9666], bortleScale: 2, radius: 30, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Elan Valley Dark Sky Park", coordinates: [52.2700, -3.5800], bortleScale: 3, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Eifel National Park", coordinates: [50.5833, 6.4166], bortleScale: 3, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Flagstaff Area National Monuments", coordinates: [35.2622, -111.4111], bortleScale: 3, radius: 20, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Goblin Valley State Park", coordinates: [38.5700, -110.7100], bortleScale: 1, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Grand Canyon National Park", coordinates: [36.0600, -112.1133], bortleScale: 2, radius: 40, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Great Basin National Park", coordinates: [38.9832, -114.3000], bortleScale: 1, radius: 30, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Hovenweep National Monument", coordinates: [37.3856, -109.0783], bortleScale: 2, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Natural Bridges National Monument", coordinates: [37.6014, -109.9753], bortleScale: 1, radius: 15, type: 'dark-site', certification: 'International Dark Sky Park' },
  { name: "Joshua Tree National Park", coordinates: [33.8734, -115.9010], bortleScale: 2, radius: 30, type: 'dark-site', certification: 'International Dark Sky Park' },
  
  // International Dark Sky Reserves
  { name: "Alqueva Dark Sky Reserve", coordinates: [38.2000, -7.5000], bortleScale: 3, radius: 30, type: 'dark-site', certification: 'International Dark Sky Reserve' },
  { name: "Aoraki Mackenzie", coordinates: [-43.9841, 170.4644], bortleScale: 1, radius: 40, type: 'dark-site', certification: 'International Dark Sky Reserve' },
  { name: "Brecon Beacons National Park", coordinates: [51.8476, -3.4767], bortleScale: 3, radius: 30, type: 'dark-site', certification: 'International Dark Sky Reserve' },
  { name: "Central Idaho Dark Sky Reserve", coordinates: [44.2667, -114.8800], bortleScale: 1, radius: 40, type: 'dark-site', certification: 'International Dark Sky Reserve' },
  { name: "Cranborne Chase AONB", coordinates: [51.0134, -2.1500], bortleScale: 3, radius: 25, type: 'dark-site', certification: 'International Dark Sky Reserve' },
  { name: "Exmoor National Park", coordinates: [51.1180, -3.6427], bortleScale: 3, radius: 25, type: 'dark-site', certification: 'International Dark Sky Reserve' },
  { name: "Kerry Dark Sky Reserve", coordinates: [51.8455, -10.1441], bortleScale: 2, radius: 25, type: 'dark-site', certification: 'International Dark Sky Reserve' },
  { name: "Mont-Mégantic", coordinates: [45.4567, -71.1525], bortleScale: 2, radius: 30, type: 'dark-site', certification: 'International Dark Sky Reserve' },
  { name: "Moore's Reserve", coordinates: [43.7000, -82.0000], bortleScale: 3, radius: 25, type: 'dark-site', certification: 'International Dark Sky Reserve' },
  { name: "NamibRand", coordinates: [-24.9500, 16.0000], bortleScale: 1, radius: 40, type: 'dark-site', certification: 'International Dark Sky Reserve' },
  
  // International Dark Sky Sanctuaries
  { name: "Gabriela Mistral Dark Sky Sanctuary", coordinates: [-30.2500, -70.7500], bortleScale: 1, radius: 40, type: 'dark-site', certification: 'International Dark Sky Sanctuary' },
  { name: "Cosmic Campground", coordinates: [33.4722, -108.9225], bortleScale: 1, radius: 20, type: 'dark-site', certification: 'International Dark Sky Sanctuary' },
  { name: "Iriomote Island", coordinates: [24.3858, 123.8161], bortleScale: 2, radius: 20, type: 'dark-site', certification: 'International Dark Sky Sanctuary' },
  { name: "Rainbow Bridge National Monument", coordinates: [37.0770, -110.9626], bortleScale: 1, radius: 15, type: 'dark-site', certification: 'International Dark Sky Sanctuary' },
  { name: "Stewart Island/Rakiura", coordinates: [-46.9992, 167.8543], bortleScale: 1, radius: 30, type: 'dark-site', certification: 'International Dark Sky Sanctuary' },
  
  // International Dark Sky Communities
  { name: "Flagstaff", coordinates: [35.1983, -111.6513], bortleScale: 4, radius: 10, type: 'dark-site', certification: 'International Dark Sky Community' },
  { name: "Borrego Springs", coordinates: [33.2556, -116.3753], bortleScale: 3, radius: 15, type: 'dark-site', certification: 'International Dark Sky Community' },
  { name: "Sedona", coordinates: [34.8697, -111.7610], bortleScale: 4, radius: 10, type: 'dark-site', certification: 'International Dark Sky Community' },
  { name: "Westcliffe & Silver Cliff", coordinates: [38.1333, -105.4639], bortleScale: 3, radius: 15, type: 'dark-site', certification: 'International Dark Sky Community' },
  { name: "Dripping Springs", coordinates: [30.1902, -98.0867], bortleScale: 4, radius: 10, type: 'dark-site', certification: 'International Dark Sky Community' },
  
  // Urban Night Sky Places  
  { name: "Paterson Great Falls National Historical Park", coordinates: [40.9150, -74.1800], bortleScale: 7, radius: 5, type: 'dark-site', certification: 'Urban Night Sky Place' },
  { name: "Timpanogos Cave National Monument", coordinates: [40.4404, -111.7088], bortleScale: 6, radius: 5, type: 'dark-site', certification: 'Urban Night Sky Place' },
  { name: "Valle de Oro National Wildlife Refuge", coordinates: [35.0019, -106.6782], bortleScale: 6, radius: 5, type: 'dark-site', certification: 'Urban Night Sky Place' },
  
  // Dark Sky Friendly Development of Distinction
  { name: "Kejimkujik National Park & National Historic Site", coordinates: [44.3970, -65.2170], bortleScale: 2, radius: 25, type: 'dark-site', certification: 'Dark Sky Friendly Development of Distinction' },
  { name: "Camp Helen State Park", coordinates: [30.2724, -85.9977], bortleScale: 4, radius: 10, type: 'dark-site', certification: 'Dark Sky Friendly Development of Distinction' },
  { name: "Torrance Barrens", coordinates: [45.1120, -79.5126], bortleScale: 3, radius: 20, type: 'dark-site', certification: 'Dark Sky Friendly Development of Distinction' }
];
