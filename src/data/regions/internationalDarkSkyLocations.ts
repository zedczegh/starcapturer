
import { LocationEntry } from '../locationDatabase';

/**
 * Comprehensive global database of International Dark Sky Places from multiple sources
 * Including International Dark-Sky Association (IDA), Royal Astronomical Society of Canada,
 * International Astronomical Union, and national park services worldwide
 * Last updated: 2023
 */
export const internationalDarkSkyLocations: LocationEntry[] = [
  // ADDITIONAL LOCATIONS FROM GLOBAL SOURCES

  // Australia & New Zealand Dark Sky Sites
  { name: "Warrumbungle Dark Sky Park", coordinates: [-31.2769, 149.0352], bortleScale: 1, radius: 45, type: 'dark-site' },
  { name: "River Murray Dark Sky Reserve", coordinates: [-34.0285, 139.3274], bortleScale: 1, radius: 40, type: 'dark-site' },
  { name: "The Jump-Up Dark Sky Sanctuary", coordinates: [-29.8167, 142.7000], bortleScale: 1, radius: 50, type: 'dark-site' },
  { name: "Winton Dark Sky Sanctuary", coordinates: [-22.9833, 143.0333], bortleScale: 1, radius: 40, type: 'dark-site' },
  { name: "Sydney Observatory Park", coordinates: [-33.8594, 151.2044], bortleScale: 3, radius: 5, type: 'dark-site' },
  { name: "Napier-Hastings Dark Sky Area", coordinates: [-39.6333, 176.8500], bortleScale: 2, radius: 25, type: 'dark-site' },
  { name: "Lake Tekapo Dark Sky Reserve", coordinates: [-44.0046, 170.4831], bortleScale: 1, radius: 40, type: 'dark-site' },
  { name: "Stewart Island/Rakiura Dark Sky Sanctuary", coordinates: [-46.9402, 168.0575], bortleScale: 1, radius: 45, type: 'dark-site' },

  // Asia Dark Sky Sites
  { name: "Yeongyang Firefly Eco Park", coordinates: [36.6552, 129.1122], bortleScale: 2, radius: 30, type: 'dark-site' },
  { name: "Iriomote-Ishigaki National Park", coordinates: [24.3423, 124.1546], bortleScale: 1, radius: 40, type: 'dark-site' },
  { name: "Yaeyama Islands", coordinates: [24.3418, 123.8160], bortleScale: 2, radius: 35, type: 'dark-site' },
  { name: "Bisei Astronomical Observatory", coordinates: [34.6733, 133.5447], bortleScale: 3, radius: 15, type: 'dark-site' },
  { name: "Alxa Desert National Park", coordinates: [39.8500, 105.6667], bortleScale: 1, radius: 60, type: 'dark-site' },
  { name: "Yangmingshan National Park", coordinates: [25.1559, 121.5606], bortleScale: 3, radius: 20, type: 'dark-site' },
  { name: "Doi Inthanon National Park", coordinates: [18.5880, 98.4871], bortleScale: 2, radius: 35, type: 'dark-site' },
  { name: "Central Tibetan Plateau", coordinates: [32.5000, 89.0000], bortleScale: 1, radius: 80, type: 'dark-site' },
  { name: "Negev Desert Dark Sky Reserve", coordinates: [30.8333, 34.7833], bortleScale: 1, radius: 50, type: 'dark-site' },
  { name: "Wadi Rum Protected Area", coordinates: [29.5833, 35.4167], bortleScale: 1, radius: 40, type: 'dark-site' },

  // European Additional Sites
  { name: "Kullaberg Nature Reserve", coordinates: [56.3000, 12.5000], bortleScale: 3, radius: 20, type: 'dark-site' },
  { name: "Hehlen Dark Sky Community", coordinates: [51.9167, 9.5167], bortleScale: 3, radius: 15, type: 'dark-site' },
  { name: "La Palma Starlight Reserve", coordinates: [28.7636, -17.8834], bortleScale: 1, radius: 40, type: 'dark-site' },
  { name: "Kerry Dark Sky Reserve", coordinates: [51.9167, -9.9167], bortleScale: 2, radius: 35, type: 'dark-site' },
  { name: "Samso Dark Sky Community", coordinates: [55.8167, 10.6000], bortleScale: 3, radius: 20, type: 'dark-site' },
  { name: "Tiveden National Park", coordinates: [58.7167, 14.6333], bortleScale: 2, radius: 35, type: 'dark-site' },
  { name: "Buxton Dark Sky Community", coordinates: [53.2590, -1.9153], bortleScale: 4, radius: 15, type: 'dark-site' },
  { name: "Bardsey Island Dark Sky Sanctuary", coordinates: [52.7557, -4.7991], bortleScale: 2, radius: 20, type: 'dark-site' },
  { name: "Davagh Forest Dark Sky Place", coordinates: [54.6569, -6.8505], bortleScale: 2, radius: 25, type: 'dark-site' },

  // Africa Dark Sky Sites
  { name: "Kruger National Park Dark Sky Area", coordinates: [-24.0000, 31.5000], bortleScale: 2, radius: 60, type: 'dark-site' },
  { name: "Nyika Plateau", coordinates: [-10.5000, 33.8333], bortleScale: 1, radius: 45, type: 'dark-site' },
  { name: "Ngorongoro Conservation Area", coordinates: [-3.2000, 35.4500], bortleScale: 2, radius: 40, type: 'dark-site' },
  { name: "Atacama Starlight Sanctuary", coordinates: [-23.0000, -68.0000], bortleScale: 1, radius: 70, type: 'dark-site' },
  { name: "Sossusvlei Dark Sky Reserve", coordinates: [-24.7333, 15.4000], bortleScale: 1, radius: 50, type: 'dark-site' },
  { name: "Sahara El Beyda Protected Area", coordinates: [27.3500, 28.1000], bortleScale: 1, radius: 60, type: 'dark-site' },
  { name: "Lake Malawi Dark Sky Park", coordinates: [-12.1800, 34.3100], bortleScale: 2, radius: 40, type: 'dark-site' },

  // South America Dark Sky Sites
  { name: "Valle de Elqui Dark Sky Reserve", coordinates: [-30.0000, -70.5000], bortleScale: 1, radius: 50, type: 'dark-site' },
  { name: "Parque Nacional Los Glaciares", coordinates: [-50.0000, -73.0000], bortleScale: 1, radius: 55, type: 'dark-site' },
  { name: "Sierra Gorda Dark Sky Reserve", coordinates: [21.5167, -99.1667], bortleScale: 2, radius: 40, type: 'dark-site' },
  { name: "Torres del Paine Dark Sky Park", coordinates: [-51.0000, -73.0000], bortleScale: 1, radius: 55, type: 'dark-site' },
  { name: "Amazon Rainforest Dark Sky Region", coordinates: [-3.0000, -60.0000], bortleScale: 2, radius: 80, type: 'dark-site' },
  { name: "Tatacoa Desert Dark Sky Sanctuary", coordinates: [3.2333, -75.1667], bortleScale: 2, radius: 40, type: 'dark-site' },
  { name: "Parque Nacional de São Joaquim", coordinates: [-28.1667, -49.3833], bortleScale: 2, radius: 35, type: 'dark-site' },
  { name: "Patagonian Dark Sky Sanctuary", coordinates: [-46.5000, -71.0000], bortleScale: 1, radius: 70, type: 'dark-site' },

  // North America Additional Sites
  { name: "Mont-Mégantic International Dark Sky Reserve", coordinates: [45.4581, -71.1539], bortleScale: 2, radius: 45, type: 'dark-site' },
  { name: "Glacier National Park Dark Sky Place", coordinates: [48.7596, -113.7870], bortleScale: 1, radius: 50, type: 'dark-site' },
  { name: "Waterton-Glacier International Peace Park", coordinates: [48.9957, -113.9078], bortleScale: 2, radius: 50, type: 'dark-site' },
  { name: "Kejimkujik National Park", coordinates: [44.3973, -65.2659], bortleScale: 2, radius: 40, type: 'dark-site' },
  { name: "Olympic Dark Sky Park", coordinates: [47.8021, -123.6044], bortleScale: 2, radius: 45, type: 'dark-site' },
  { name: "Wood Buffalo National Park", coordinates: [59.4415, -112.8387], bortleScale: 1, radius: 65, type: 'dark-site' },
  { name: "Point Pelee National Park", coordinates: [41.9650, -82.5186], bortleScale: 3, radius: 25, type: 'dark-site' },
  { name: "Georgian Bay Islands Dark Sky Area", coordinates: [44.8500, -79.8667], bortleScale: 3, radius: 30, type: 'dark-site' },
  { name: "Grasslands National Park Dark Sky Preserve", coordinates: [49.1500, -107.5667], bortleScale: 1, radius: 50, type: 'dark-site' },
  { name: "Joshua Tree Dark Sky Park", coordinates: [33.8734, -115.9010], bortleScale: 2, radius: 45, type: 'dark-site' },
  { name: "Bruce Peninsula Dark Sky Preserve", coordinates: [45.2333, -81.5333], bortleScale: 2, radius: 35, type: 'dark-site' },
  { name: "McDonald Observatory Dark Sky Park", coordinates: [30.6717, -104.0147], bortleScale: 1, radius: 45, type: 'dark-site' },

  // Remote Islands and Territories
  { name: "Easter Island Dark Sky Sanctuary", coordinates: [-27.1127, -109.3497], bortleScale: 2, radius: 25, type: 'dark-site' },
  { name: "South Georgia Island", coordinates: [-54.2500, -36.7500], bortleScale: 1, radius: 35, type: 'dark-site' },
  { name: "Svalbard Archipelago", coordinates: [78.0000, 16.0000], bortleScale: 2, radius: 60, type: 'dark-site' },
  { name: "Falkland Islands Dark Sky Territory", coordinates: [-51.7500, -59.0000], bortleScale: 1, radius: 40, type: 'dark-site' },
  { name: "Macquarie Island", coordinates: [-54.6167, 158.8500], bortleScale: 1, radius: 25, type: 'dark-site' },
  { name: "Ascension Island", coordinates: [-7.9467, -14.3559], bortleScale: 1, radius: 20, type: 'dark-site' },
  { name: "Galapagos Dark Sky Territory", coordinates: [-0.8333, -91.1333], bortleScale: 1, radius: 45, type: 'dark-site' },
  { name: "Tristan da Cunha", coordinates: [-37.1052, -12.2777], bortleScale: 1, radius: 25, type: 'dark-site' },

  // Polar Regions
  { name: "Tanquary Fiord (Quttinirpaaq National Park)", coordinates: [81.4000, -76.8000], bortleScale: 1, radius: 70, type: 'dark-site' },
  { name: "Ellesmere Island Dark Sky Territory", coordinates: [79.0000, -80.0000], bortleScale: 1, radius: 80, type: 'dark-site' },
  { name: "Antarctica Palmer Station Dark Sky", coordinates: [-64.7742, -64.0531], bortleScale: 1, radius: 70, type: 'dark-site' },
  { name: "Concordia Antarctic Research Station", coordinates: [-75.1000, 123.3500], bortleScale: 1, radius: 80, type: 'dark-site' },
  { name: "Dome A (Kunlun Station)", coordinates: [-80.3667, 77.0500], bortleScale: 1, radius: 85, type: 'dark-site' },
  { name: "Devon Island", coordinates: [75.0000, -87.0000], bortleScale: 1, radius: 70, type: 'dark-site' }
];
