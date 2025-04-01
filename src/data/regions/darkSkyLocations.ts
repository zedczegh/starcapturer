
import { LocationEntry } from '../locationDatabase';

/**
 * Database of Dark Sky International certified locations
 * Data sourced from the International Dark-Sky Association
 */
export const darkSkyLocations: LocationEntry[] = [
  {
    name: "Cherry Springs State Park",
    coordinates: [41.6626, -77.8287],
    bortleScale: 2,
    radius: 20,
    type: 'dark-site'
  },
  {
    name: "NamibRand Nature Reserve",
    coordinates: [-25.0000, 16.0000],
    bortleScale: 1,
    radius: 30,
    type: 'dark-site'
  },
  {
    name: "Aoraki Mackenzie",
    coordinates: [-43.7500, 170.1000],
    bortleScale: 2,
    radius: 25,
    type: 'dark-site'
  },
  {
    name: "Pic du Midi",
    coordinates: [42.9361, 0.1417],
    bortleScale: 3,
    radius: 15,
    type: 'dark-site'
  },
  {
    name: "Mont-Mégantic",
    coordinates: [45.4111, -71.1528],
    bortleScale: 3,
    radius: 15,
    type: 'dark-site'
  },
  {
    name: "Exmoor National Park",
    coordinates: [51.1167, -3.6167],
    bortleScale: 3,
    radius: 20,
    type: 'dark-site'
  },
  {
    name: "Galloway Forest Park",
    coordinates: [55.1000, -4.3000],
    bortleScale: 2,
    radius: 25,
    type: 'dark-site'
  },
  {
    name: "Westhavelland Nature Park",
    coordinates: [52.7000, 12.4000],
    bortleScale: 3,
    radius: 20,
    type: 'dark-site'
  },
  {
    name: "Zselic Starry Sky Park",
    coordinates: [46.2333, 17.7667],
    bortleScale: 3,
    radius: 15,
    type: 'dark-site'
  },
  {
    name: "Jasper National Park",
    coordinates: [52.8738, -117.9610],
    bortleScale: 2,
    radius: 30,
    type: 'dark-site'
  }
];
