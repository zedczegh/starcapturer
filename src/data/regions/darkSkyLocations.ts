
import { LocationEntry } from '../locationDatabase';

/**
 * Comprehensive database of International Dark Sky Places
 * Data sourced from https://darksky.org/what-we-do/international-dark-sky-places/all-places/
 * Last updated: 2023
 */
export const darkSkyLocations: LocationEntry[] = [
  // DARK SKY SANCTUARIES
  { name: "Aotea / Great Barrier Island International Dark Sky Sanctuary", coordinates: [-36.1996, 175.4190], bortleScale: 1, radius: 40, type: 'dark-site' },
  { name: "Aorangi Dark Sky Sanctuary", coordinates: [-40.9438, 176.1230], bortleScale: 1, radius: 35, type: 'dark-site' },
  { name: "Boundary Waters Canoe Area Wilderness", coordinates: [47.9231, -91.8076], bortleScale: 1, radius: 60, type: 'dark-site' },
  { name: "Central Idaho Dark Sky Reserve", coordinates: [44.2733, -114.8337], bortleScale: 1, radius: 50, type: 'dark-site' },
  { name: "Cosmic Campground International Dark Sky Sanctuary", coordinates: [33.4721, -108.9212], bortleScale: 1, radius: 30, type: 'dark-site' },
  { name: "Devils River State Natural Area", coordinates: [29.9131, -100.9988], bortleScale: 1, radius: 40, type: 'dark-site' },
  { name: "Gabriela Mistral Dark Sky Sanctuary", coordinates: [-30.3103, -70.6946], bortleScale: 1, radius: 45, type: 'dark-site' },
  { name: "I Tien Dark Sky Sanctuary", coordinates: [30.1600, 35.4600], bortleScale: 1, radius: 30, type: 'dark-site' },
  { name: "Iriomote-Ishigaki National Park", coordinates: [24.3423, 124.1546], bortleScale: 1, radius: 40, type: 'dark-site' },
  { name: "Medicine Rocks State Park", coordinates: [46.0053, -104.4730], bortleScale: 1, radius: 25, type: 'dark-site' },
  { name: "Merritt Reservoir", coordinates: [42.6333, -100.9000], bortleScale: 1, radius: 30, type: 'dark-site' },
  { name: "Rainbow Bridge National Monument", coordinates: [37.0770, -110.9639], bortleScale: 1, radius: 25, type: 'dark-site' },
  { name: "Wai Iti International Dark Sky Sanctuary", coordinates: [-29.2303, 167.9395], bortleScale: 1, radius: 20, type: 'dark-site' },
  { name: "Katahdin Woods and Waters National Monument", coordinates: [45.9564, -68.5753], bortleScale: 1, radius: 45, type: 'dark-site' },
  { name: "NamibRand International Dark Sky Reserve", coordinates: [-24.9400, 16.0000], bortleScale: 1, radius: 40, type: 'dark-site' },
  { name: "Pitcairn Islands", coordinates: [-25.0667, -130.1000], bortleScale: 1, radius: 30, type: 'dark-site' },
  { name: "Sequoia Dark Sky Sanctuary", coordinates: [-5.2100, -80.2000], bortleScale: 1, radius: 30, type: 'dark-site' },
  { name: "Winnetou Dark Sky Sanctuary", coordinates: [44.3617, 15.7539], bortleScale: 1, radius: 25, type: 'dark-site' },
  { name: "Juan Fernández Islands", coordinates: [-33.6168, -78.8319], bortleScale: 1, radius: 35, type: 'dark-site' },
  
  // DARK SKY RESERVES
  { name: "Abruzzi International Dark Sky Reserve", coordinates: [42.2360, 13.9106], bortleScale: 2, radius: 50, type: 'dark-site' },
  { name: "Aoraki Mackenzie International Dark Sky Reserve", coordinates: [-43.9875, 170.4631], bortleScale: 1, radius: 55, type: 'dark-site' },
  { name: "Alpes Azur Mercantour International Dark Sky Reserve", coordinates: [44.2622, 6.9354], bortleScale: 2, radius: 45, type: 'dark-site' },
  { name: "Brecon Beacons National Park International Dark Sky Reserve", coordinates: [51.8476, -3.4767], bortleScale: 2, radius: 50, type: 'dark-site' },
  { name: "Cévennes National Park International Dark Sky Reserve", coordinates: [44.2559, 3.6962], bortleScale: 2, radius: 55, type: 'dark-site' },
  { name: "Cranborne Chase International Dark Sky Reserve", coordinates: [50.9667, -2.0167], bortleScale: 2, radius: 45, type: 'dark-site' },
  { name: "Exmoor National Park International Dark Sky Reserve", coordinates: [51.1180, -3.6427], bortleScale: 2, radius: 50, type: 'dark-site' },
  { name: "Møn and Nyord International Dark Sky Reserve", coordinates: [55.0000, 12.2500], bortleScale: 2, radius: 40, type: 'dark-site' },
  { name: "Moore's Reserve", coordinates: [51.0831, -1.4457], bortleScale: 2, radius: 35, type: 'dark-site' },
  { name: "Pic du Midi International Dark Sky Reserve", coordinates: [42.9558, 0.1498], bortleScale: 2, radius: 40, type: 'dark-site' },
  { name: "River Murray International Dark Sky Reserve", coordinates: [-34.2661, 139.6019], bortleScale: 2, radius: 50, type: 'dark-site' },
  { name: "Rhön International Dark Sky Reserve", coordinates: [50.4800, 10.0000], bortleScale: 2, radius: 45, type: 'dark-site' },
  { name: "South Downs National Park", coordinates: [50.9500, -0.7000], bortleScale: 2, radius: 50, type: 'dark-site' },
  { name: "Snowdonia National Park International Dark Sky Reserve", coordinates: [53.0000, -3.7667], bortleScale: 2, radius: 50, type: 'dark-site' },
  { name: "Westhavelland International Dark Sky Reserve", coordinates: [52.7000, 12.3833], bortleScale: 2, radius: 45, type: 'dark-site' },
  { name: "Yorkshire Dales National Park", coordinates: [54.3000, -2.0000], bortleScale: 2, radius: 50, type: 'dark-site' },
  { name: "Central Idaho Dark Sky Reserve", coordinates: [43.9117, -114.9337], bortleScale: 1, radius: 55, type: 'dark-site' },
  { name: "Winklmoosalm International Dark Sky Reserve", coordinates: [47.6500, 12.5833], bortleScale: 2, radius: 35, type: 'dark-site' },
  { name: "Mont-Mégantic International Dark Sky Reserve", coordinates: [45.4581, -71.1539], bortleScale: 2, radius: 45, type: 'dark-site' },
  { name: "Kielder International Dark Sky Reserve", coordinates: [55.2200, -2.5800], bortleScale: 2, radius: 40, type: 'dark-site' },
  { name: "Kerry International Dark Sky Reserve", coordinates: [51.8408, -10.3553], bortleScale: 1, radius: 50, type: 'dark-site' }, // new
  { name: "Alqueva International Dark Sky Reserve", coordinates: [38.3667, -7.3500], bortleScale: 2, radius: 50, type: 'dark-site' }, // new
  { name: "Swan Hills Dark Sky Reserve", coordinates: [54.7039, -115.4036], bortleScale: 1, radius: 50, type: 'dark-site' }, // new
  { name: "Julian International Dark Sky Reserve", coordinates: [33.0789, -116.5995], bortleScale: 2, radius: 45, type: 'dark-site' }, // new
  { name: "Val d'Aran International Dark Sky Reserve", coordinates: [42.7014, 0.7945], bortleScale: 2, radius: 45, type: 'dark-site' }, // new

  // DARK SKY PARKS
  { name: "Anza-Borrego Desert State Park", coordinates: [33.1269, -116.2991], bortleScale: 2, radius: 50, type: 'dark-site' },
  { name: "Arches National Park", coordinates: [38.6836, -109.5621], bortleScale: 2, radius: 40, type: 'dark-site' },
  { name: "Ballycroy National Park", coordinates: [54.0166, -9.8166], bortleScale: 2, radius: 35, type: 'dark-site' },
  { name: "Big Bend National Park", coordinates: [29.2498, -103.2502], bortleScale: 1, radius: 55, type: 'dark-site' },
  { name: "Black Canyon of the Gunnison National Park", coordinates: [38.5754, -107.7416], bortleScale: 2, radius: 40, type: 'dark-site' },
  { name: "Bryce Canyon National Park", coordinates: [37.6283, -112.1679], bortleScale: 1, radius: 45, type: 'dark-site' },
  { name: "Buffalo National River", coordinates: [36.0341, -92.9029], bortleScale: 2, radius: 45, type: 'dark-site' },
  { name: "Canyonlands National Park", coordinates: [38.2136, -109.9025], bortleScale: 1, radius: 50, type: 'dark-site' },
  { name: "Capitol Reef National Park", coordinates: [38.3670, -111.2615], bortleScale: 1, radius: 45, type: 'dark-site' },
  { name: "Capulin Volcano National Monument", coordinates: [36.7810, -103.9695], bortleScale: 2, radius: 30, type: 'dark-site' },
  { name: "Cedar Breaks National Monument", coordinates: [37.6350, -112.8450], bortleScale: 2, radius: 35, type: 'dark-site' },
  { name: "Cherry Springs State Park", coordinates: [41.6626, -77.8169], bortleScale: 2, radius: 30, type: 'dark-site' },
  { name: "Chaco Culture National Historical Park", coordinates: [36.0534, -107.9586], bortleScale: 1, radius: 40, type: 'dark-site' },
  { name: "Clayton Lake State Park", coordinates: [36.5820, -103.3172], bortleScale: 2, radius: 30, type: 'dark-site' },
  { name: "Copper Breaks State Park", coordinates: [34.1090, -99.7506], bortleScale: 2, radius: 35, type: 'dark-site' },
  { name: "Grand Canyon National Park", coordinates: [36.0544, -112.1401], bortleScale: 2, radius: 55, type: 'dark-site' },
  { name: "Death Valley National Park", coordinates: [36.5323, -116.9325], bortleScale: 1, radius: 55, type: 'dark-site' },
  { name: "Dinosaur National Monument", coordinates: [40.5642, -108.9542], bortleScale: 2, radius: 45, type: 'dark-site' },
  { name: "Enchanted Rock State Natural Area", coordinates: [30.4860, -98.8189], bortleScale: 2, radius: 35, type: 'dark-site' },
  { name: "Flagstaff Area National Monuments", coordinates: [35.2622, -111.4519], bortleScale: 2, radius: 40, type: 'dark-site' },
  { name: "Fort Union National Monument", coordinates: [35.9083, -105.0120], bortleScale: 2, radius: 30, type: 'dark-site' },
  { name: "Geauga Observatory Park", coordinates: [41.5556, -81.0856], bortleScale: 3, radius: 25, type: 'dark-site' },
  { name: "Goblin Valley State Park", coordinates: [38.5738, -110.7050], bortleScale: 2, radius: 35, type: 'dark-site' },
  { name: "Great Basin National Park", coordinates: [38.9832, -114.3000], bortleScale: 1, radius: 45, type: 'dark-site' },
  { name: "Great Sand Dunes National Park and Preserve", coordinates: [37.7275, -105.5119], bortleScale: 2, radius: 45, type: 'dark-site' },
  { name: "Headlands", coordinates: [45.7756, -84.9214], bortleScale: 2, radius: 30, type: 'dark-site' },
  { name: "Kissimmee Prairie Preserve State Park", coordinates: [27.6127, -81.0456], bortleScale: 3, radius: 30, type: 'dark-site' },
  { name: "Hovenweep National Monument", coordinates: [37.3845, -109.0742], bortleScale: 2, radius: 35, type: 'dark-site' },
  { name: "Joshua Tree National Park", coordinates: [33.8734, -115.9010], bortleScale: 2, radius: 45, type: 'dark-site' },
  { name: "Julian Dark Sky Network", coordinates: [33.0787, -116.6010], bortleScale: 3, radius: 30, type: 'dark-site' },
  { name: "Kartchner Caverns State Park", coordinates: [31.8369, -110.3475], bortleScale: 2, radius: 30, type: 'dark-site' },
  { name: "Lauwersmeer National Park", coordinates: [53.3600, 6.2000], bortleScale: 3, radius: 30, type: 'dark-site' },
  { name: "Natural Bridges National Monument", coordinates: [37.6014, -109.9753], bortleScale: 1, radius: 35, type: 'dark-site' },
  { name: "Newport State Park", coordinates: [45.2354, -86.9960], bortleScale: 2, radius: 30, type: 'dark-site' },
  { name: "Northumberland National Park", coordinates: [55.2837, -2.2338], bortleScale: 2, radius: 40, type: 'dark-site' },
  { name: "Oracle State Park", coordinates: [32.6177, -110.7753], bortleScale: 3, radius: 30, type: 'dark-site' },
  { name: "Petrified Forest National Park", coordinates: [35.0864, -109.7931], bortleScale: 2, radius: 40, type: 'dark-site' },
  { name: "Pickett CCC Memorial State Park and Pogue Creek Canyon State Natural Area", coordinates: [36.5497, -84.7943], bortleScale: 2, radius: 30, type: 'dark-site' },
  { name: "Salinas Pueblo Missions National Monument", coordinates: [34.2599, -106.0894], bortleScale: 2, radius: 35, type: 'dark-site' },
  { name: "South Llano River State Park", coordinates: [30.4478, -99.9017], bortleScale: 2, radius: 30, type: 'dark-site' },
  { name: "Steinaker State Park", coordinates: [40.5213, -109.5369], bortleScale: 2, radius: 30, type: 'dark-site' },
  { name: "Stelvio National Park", coordinates: [46.5333, 10.4333], bortleScale: 2, radius: 40, type: 'dark-site' },
  { name: "The Jump Off", coordinates: [34.9830, -85.5079], bortleScale: 3, radius: 25, type: 'dark-site' },
  { name: "Tomintoul and Glenlivet - Cairngorms Dark Sky Park", coordinates: [57.2547, -3.3788], bortleScale: 2, radius: 40, type: 'dark-site' },
  { name: "UBarU Camp & Retreat Center", coordinates: [30.0657, -99.5156], bortleScale: 2, radius: 25, type: 'dark-site' },
  { name: "Voyageurs National Park", coordinates: [48.4725, -92.8478], bortleScale: 2, radius: 45, type: 'dark-site' },
  { name: "Waterton-Glacier International Peace Park", coordinates: [48.9957, -113.9078], bortleScale: 2, radius: 50, type: 'dark-site' },
  { name: "Warrumbungle National Park", coordinates: [-31.2769, 149.0352], bortleScale: 2, radius: 40, type: 'dark-site' },
  { name: "Weber County North Fork Park", coordinates: [41.3348, -111.8380], bortleScale: 3, radius: 30, type: 'dark-site' },
  { name: "Yeongyang Firefly Eco Park", coordinates: [36.6552, 129.1122], bortleScale: 3, radius: 30, type: 'dark-site' },
  { name: "Zion National Park", coordinates: [37.2982, -113.0263], bortleScale: 2, radius: 45, type: 'dark-site' },
  { name: "Zselic National Landscape Protection Area", coordinates: [46.2333, 17.7667], bortleScale: 2, radius: 35, type: 'dark-site' },
  { name: "Tumacácori National Historical Park", coordinates: [31.5658, -111.0468], bortleScale: 3, radius: 25, type: 'dark-site' },
  { name: "Dark Sky Alqueva", coordinates: [38.2000, -7.5000], bortleScale: 2, radius: 40, type: 'dark-site' },
  { name: "Ramon Crater", coordinates: [30.6167, 34.8000], bortleScale: 2, radius: 35, type: 'dark-site' },
  { name: "Elan Valley Estate", coordinates: [52.2650, -3.5756], bortleScale: 2, radius: 35, type: 'dark-site' },
  { name: "Grand Canyon Parashant National Monument", coordinates: [36.4072, -113.6956], bortleScale: 1, radius: 50, type: 'dark-site' },
  { name: "Bodmin Moor Dark Sky Landscape", coordinates: [50.5000, -4.6000], bortleScale: 2, radius: 35, type: 'dark-site' },
  { name: "Galloway Forest Park", coordinates: [55.1000, -4.3000], bortleScale: 2, radius: 45, type: 'dark-site' },
  { name: "De Boschplaat", coordinates: [53.4500, 5.4333], bortleScale: 3, radius: 25, type: 'dark-site' },
  { name: "Sark", coordinates: [49.4308, -2.3625], bortleScale: 2, radius: 20, type: 'dark-site' },
  { name: "Hortobágy National Park", coordinates: [47.5833, 21.1500], bortleScale: 2, radius: 40, type: 'dark-site' },
  { name: "Mayo Dark Sky Park", coordinates: [54.0166, -9.8166], bortleScale: 2, radius: 35, type: 'dark-site' },
  { name: "Eifel National Park", coordinates: [50.5833, 6.4333], bortleScale: 3, radius: 35, type: 'dark-site' },
  { name: "Tiveden National Park", coordinates: [58.7167, 14.6333], bortleScale: 2, radius: 35, type: 'dark-site' },
  { name: "Himawari Farm Dark Sky Park", coordinates: [42.9824, 140.9946], bortleScale: 2, radius: 35, type: 'dark-site' }, // new
  { name: "Lake Hudson State Recreation Area", coordinates: [42.8485, -83.8231], bortleScale: 3, radius: 30, type: 'dark-site' }, // new
  { name: "Ash Meadows National Wildlife Refuge", coordinates: [36.4235, -116.3362], bortleScale: 2, radius: 35, type: 'dark-site' }, // new
  { name: "Middle Fork River Forest Preserve", coordinates: [40.3788, -88.1732], bortleScale: 3, radius: 25, type: 'dark-site' }, // new
  { name: "Goldendale Observatory State Park", coordinates: [45.8399, -120.8193], bortleScale: 2, radius: 30, type: 'dark-site' }, // new
  { name: "Massacre Rim Dark Sky Sanctuary", coordinates: [41.5835, -119.7557], bortleScale: 1, radius: 40, type: 'dark-site' }, // new
  { name: "Irati Dark Sky", coordinates: [42.9789, -1.0856], bortleScale: 2, radius: 35, type: 'dark-site' }, // new
  { name: "Aulanka National Park", coordinates: [66.3703, 29.5221], bortleScale: 2, radius: 40, type: 'dark-site' }, // new
  { name: "Cohutta Wilderness Area", coordinates: [34.9418, -84.5745], bortleScale: 2, radius: 35, type: 'dark-site' }, // new
  { name: "Prineville Reservoir State Park", coordinates: [44.1193, -120.7536], bortleScale: 2, radius: 30, type: 'dark-site' }, // new

  // DARK SKY COMMUNITIES
  { name: "Flagstaff, Arizona", coordinates: [35.1983, -111.6513], bortleScale: 3, radius: 20, type: 'dark-site' },
  { name: "Borrego Springs, California", coordinates: [33.2556, -116.3751], bortleScale: 3, radius: 15, type: 'dark-site' },
  { name: "Westcliffe and Silver Cliff, Colorado", coordinates: [38.1364, -105.4631], bortleScale: 2, radius: 15, type: 'dark-site' },
  { name: "Homer Glen, Illinois", coordinates: [41.6006, -87.9381], bortleScale: 4, radius: 10, type: 'dark-site' },
  { name: "Beverly Shores, Indiana", coordinates: [41.6875, -86.9822], bortleScale: 4, radius: 10, type: 'dark-site' },
  { name: "Dripping Springs, Texas", coordinates: [30.1903, -98.0867], bortleScale: 3, radius: 15, type: 'dark-site' },
  { name: "Horseshoe Bay, Texas", coordinates: [30.5417, -98.3674], bortleScale: 3, radius: 15, type: 'dark-site' },
  { name: "Wimberley Valley, Texas", coordinates: [30.0001, -98.0996], bortleScale: 3, radius: 15, type: 'dark-site' },
  { name: "Torrey, Utah", coordinates: [38.2997, -111.4193], bortleScale: 2, radius: 15, type: 'dark-site' },
  { name: "Fountain Hills, Arizona", coordinates: [33.6045, -111.7239], bortleScale: 4, radius: 15, type: 'dark-site' },
  { name: "Thunder Mountain Pootsee Nightsky", coordinates: [36.7312, -107.9784], bortleScale: 3, radius: 15, type: 'dark-site' },
  { name: "Camp Verde, Arizona", coordinates: [34.5636, -111.8543], bortleScale: 3, radius: 15, type: 'dark-site' },
  { name: "Sedona, Arizona", coordinates: [34.8697, -111.7610], bortleScale: 3, radius: 15, type: 'dark-site' },
  { name: "Big Park / Village of Oak Creek, Arizona", coordinates: [34.7878, -111.7617], bortleScale: 3, radius: 10, type: 'dark-site' },
  { name: "Cottonwood, Arizona", coordinates: [34.7394, -112.0098], bortleScale: 4, radius: 15, type: 'dark-site' },
  { name: "Llano County / City of Horseshoe Bay, Texas", coordinates: [30.5417, -98.3674], bortleScale: 3, radius: 15, type: 'dark-site' },
  { name: "Lakeville Preserve, Massachusetts", coordinates: [41.8458, -70.9522], bortleScale: 4, radius: 15, type: 'dark-site' },
  { name: "Bon Accord, Alberta, Canada", coordinates: [53.8319, -113.4003], bortleScale: 4, radius: 10, type: 'dark-site' },
  { name: "Town of Canmore", coordinates: [51.0888, -115.3472], bortleScale: 3, radius: 15, type: 'dark-site' },
  { name: "Hanoi, Illinois", coordinates: [40.5332, -90.0262], bortleScale: 4, radius: 10, type: 'dark-site' },
  { name: "Crestone, Colorado", coordinates: [37.9969, -105.6989], bortleScale: 2, radius: 15, type: 'dark-site' }, // new
  { name: "Helper, Utah", coordinates: [39.6877, -110.8544], bortleScale: 3, radius: 15, type: 'dark-site' }, // new
  { name: "Nucla & Naturita, Colorado", coordinates: [38.2444, -108.5464], bortleScale: 2, radius: 15, type: 'dark-site' }, // new
  { name: "Ridgway, Colorado", coordinates: [38.1527, -107.7534], bortleScale: 3, radius: 15, type: 'dark-site' }, // new
  { name: "Jasper, Alberta", coordinates: [52.8738, -118.0813], bortleScale: 3, radius: 15, type: 'dark-site' }, // new
  
  // URBAN NIGHT SKY PLACES
  { name: "Valle de Oro National Wildlife Refuge", coordinates: [35.0075, -106.6751], bortleScale: 5, radius: 8, type: 'dark-site' },
  { name: "Palos Preserves", coordinates: [41.7075, -87.8372], bortleScale: 5, radius: 8, type: 'dark-site' },
  { name: "Popo Agie Wilderness Area", coordinates: [42.5880, -108.8895], bortleScale: 4, radius: 10, type: 'dark-site' },
  { name: "Glasnevin Cemetery Dark Sky Place", coordinates: [53.3704, -6.2782], bortleScale: 6, radius: 5, type: 'dark-site' },
  { name: "Middle Fork Greenway", coordinates: [36.2046, -81.6476], bortleScale: 4, radius: 8, type: 'dark-site' },
  { name: "Lost Woods", coordinates: [39.7501, -84.2732], bortleScale: 5, radius: 5, type: 'dark-site' },
  { name: "The Conservation Center", coordinates: [37.8043, -87.0435], bortleScale: 5, radius: 8, type: 'dark-site' },
  { name: "Butler's Orchard", coordinates: [39.1610, -77.3855], bortleScale: 5, radius: 5, type: 'dark-site' },
  { name: "Town of Los Alamos/Los Alamos Historic District", coordinates: [35.8800, -106.3031], bortleScale: 4, radius: 10, type: 'dark-site' },
  { name: "International Astronomical Union Center for the Protection of the Dark and Quiet Sky", coordinates: [28.7569, -17.8917], bortleScale: 3, radius: 10, type: 'dark-site' }, // new
  { name: "John Glenn Astronomy Park", coordinates: [39.4022, -82.5498], bortleScale: 4, radius: 8, type: 'dark-site' }, // new
  { name: "Homestead National Historical Park", coordinates: [40.2882, -96.8339], bortleScale: 4, radius: 8, type: 'dark-site' }, // new
  { name: "Fremont Peak Observatory", coordinates: [36.7597, -121.5025], bortleScale: 4, radius: 8, type: 'dark-site' }, // new
  { name: "Curecanti National Recreation Area", coordinates: [38.4513, -107.1566], bortleScale: 3, radius: 12, type: 'dark-site' } // new
];

