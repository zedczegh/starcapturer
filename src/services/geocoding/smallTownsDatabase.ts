
import { Location } from './types';

// Database of small towns and places that share names with famous locations
export const smallTownsDatabase: Record<string, Location[]> = {
  "denmark": [
    {
      name: "Denmark, Wisconsin, USA",
      placeDetails: "Small town in Brown County, Wisconsin",
      latitude: 44.3405,
      longitude: -87.8327
    },
    {
      name: "Denmark, South Carolina, USA",
      placeDetails: "Town in Bamberg County, South Carolina",
      latitude: 33.3235,
      longitude: -81.1423
    }
  ],
  "paris": [
    {
      name: "Paris, Texas, USA",
      placeDetails: "City in Lamar County, Texas",
      latitude: 33.6609,
      longitude: -95.5555
    },
    {
      name: "Paris, Tennessee, USA",
      placeDetails: "City in Henry County, Tennessee",
      latitude: 36.3020,
      longitude: -88.3267
    },
    {
      name: "Paris, Kentucky, USA",
      placeDetails: "City in Bourbon County, Kentucky",
      latitude: 38.2098,
      longitude: -84.2529
    }
  ],
  "berlin": [
    {
      name: "Berlin, New Hampshire, USA",
      placeDetails: "City in Coos County, New Hampshire",
      latitude: 44.4787,
      longitude: -71.1856
    },
    {
      name: "Berlin, Wisconsin, USA",
      placeDetails: "City in Green Lake County, Wisconsin",
      latitude: 43.9680,
      longitude: -88.9434
    }
  ],
  "london": [
    {
      name: "London, Kentucky, USA",
      placeDetails: "City in Laurel County, Kentucky",
      latitude: 37.1289,
      longitude: -84.0833
    },
    {
      name: "London, Ontario, Canada",
      placeDetails: "City in Southwestern Ontario",
      latitude: 42.9849,
      longitude: -81.2453
    }
  ],
  "manchester": [
    {
      name: "Manchester, New Hampshire, USA",
      placeDetails: "City in Hillsborough County, New Hampshire",
      latitude: 42.9956,
      longitude: -71.4548
    },
    {
      name: "Manchester, Connecticut, USA",
      placeDetails: "Town in Hartford County, Connecticut",
      latitude: 41.7756,
      longitude: -72.5214
    }
  ],
  "rome": [
    {
      name: "Rome, Georgia, USA",
      placeDetails: "City in Floyd County, Georgia",
      latitude: 34.2571,
      longitude: -85.1644
    },
    {
      name: "Rome, New York, USA",
      placeDetails: "City in Oneida County, New York",
      latitude: 43.2128,
      longitude: -75.4557
    }
  ],
  "athens": [
    {
      name: "Athens, Georgia, USA",
      placeDetails: "City in Clarke County, Georgia",
      latitude: 33.9519,
      longitude: -83.3576
    },
    {
      name: "Athens, Ohio, USA",
      placeDetails: "City in Athens County, Ohio",
      latitude: 39.3292,
      longitude: -82.1013
    }
  ],
  "cairo": [
    {
      name: "Cairo, Illinois, USA",
      placeDetails: "City in Alexander County, Illinois",
      latitude: 37.0053,
      longitude: -89.1765
    },
    {
      name: "Cairo, Georgia, USA",
      placeDetails: "City in Grady County, Georgia",
      latitude: 30.8774,
      longitude: -84.2013
    }
  ],
  "dublin": [
    {
      name: "Dublin, California, USA",
      placeDetails: "City in Alameda County, California",
      latitude: 37.7021,
      longitude: -121.9358
    },
    {
      name: "Dublin, Ohio, USA",
      placeDetails: "City in Franklin County, Ohio",
      latitude: 40.0992,
      longitude: -83.1141
    }
  ],
  "moscow": [
    {
      name: "Moscow, Idaho, USA",
      placeDetails: "City in Latah County, Idaho",
      latitude: 46.7324,
      longitude: -117.0002
    },
    {
      name: "Moscow, Pennsylvania, USA",
      placeDetails: "Borough in Lackawanna County, Pennsylvania",
      latitude: 41.3367,
      longitude: -75.5185
    }
  ],
  "oxford": [
    {
      name: "Oxford, Mississippi, USA",
      placeDetails: "City in Lafayette County, Mississippi",
      latitude: 34.3668,
      longitude: -89.5195
    },
    {
      name: "Oxford, Ohio, USA",
      placeDetails: "City in Butler County, Ohio",
      latitude: 39.5067,
      longitude: -84.7452
    }
  ],
  "cambridge": [
    {
      name: "Cambridge, Massachusetts, USA",
      placeDetails: "City in Middlesex County, Massachusetts",
      latitude: 42.3736,
      longitude: -71.1097
    },
    {
      name: "Cambridge, Ohio, USA",
      placeDetails: "City in Guernsey County, Ohio",
      latitude: 40.0314,
      longitude: -81.5881
    }
  ],
  "newcastle": [
    {
      name: "Newcastle, Wyoming, USA",
      placeDetails: "City in Weston County, Wyoming",
      latitude: 43.8550,
      longitude: -104.2055
    },
    {
      name: "Newcastle, Maine, USA",
      placeDetails: "Town in Lincoln County, Maine",
      latitude: 44.0342,
      longitude: -69.5353
    }
  ]
};

/**
 * Find small towns matching the search query
 * @param query Search query
 * @param language Current language
 * @returns Array of matching locations
 */
export function findSmallTownMatches(query: string, language: string = 'en'): Location[] {
  // Don't process if not in English mode
  if (language !== 'en') return [];
  
  const queryLower = query.toLowerCase().trim();
  let results: Location[] = [];
  
  // Check if the query is a direct key in our database
  if (smallTownsDatabase[queryLower]) {
    return smallTownsDatabase[queryLower];
  }
  
  // Check for partial matches (query contained in key)
  for (const [key, locations] of Object.entries(smallTownsDatabase)) {
    if (key.includes(queryLower) || queryLower.includes(key)) {
      results = [...results, ...locations];
    }
  }
  
  // Check for matches in the location names
  for (const locations of Object.values(smallTownsDatabase)) {
    for (const location of locations) {
      const nameLower = location.name.toLowerCase();
      if (nameLower.includes(queryLower) || queryLower.includes(nameLower.split(',')[0])) {
        results.push(location);
      }
    }
  }
  
  // Remove duplicates based on name
  const uniqueResults = results.filter((location, index, self) =>
    index === self.findIndex(l => l.name === location.name)
  );
  
  return uniqueResults;
}
