
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Location Handling Tests
 * Ensures consistent handling of certified and calculated locations
 */

// Make TestLocation with appropriate properties, making id optional but including required SharedAstroSpot fields
interface TestLocation extends Omit<SharedAstroSpot, 'id'> {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  isDarkSkyReserve?: boolean;
  certification?: string;
  siqs?: number;
}

function testLocationHandling() {
  // Test location classification
  const testLocations: TestLocation[] = [
    {
      name: "Dark Sky Reserve",
      latitude: 45,
      longitude: 120,
      isDarkSkyReserve: true,
      siqs: 7.5,
      bortleScale: 3, // Adding required property
      timestamp: new Date().toISOString() // Adding required property
    },
    {
      name: "Regular Location",
      latitude: 46,
      longitude: 121,
      siqs: 6.0,
      bortleScale: 4, // Adding required property
      timestamp: new Date().toISOString() // Adding required property
    },
    {
      name: "Certified Site",
      latitude: 47,
      longitude: 122,
      certification: "dark-sky-park",
      siqs: 8.0,
      bortleScale: 2, // Adding required property
      timestamp: new Date().toISOString() // Adding required property
    }
  ];
  
  // Test separation of certified and calculated locations
  const separateLocations = (locations: TestLocation[]) => {
    const certified = locations.filter(loc => 
      loc.isDarkSkyReserve || loc.certification
    );
    const calculated = locations.filter(loc => 
      !loc.isDarkSkyReserve && !loc.certification
    );
    
    return { certified, calculated };
  };
  
  // Run tests
  const { certified, calculated } = separateLocations(testLocations);
  
  const tests = [
    {
      name: 'Certified locations count',
      run: () => certified.length === 2
    },
    {
      name: 'Calculated locations count',
      run: () => calculated.length === 1
    },
    {
      name: 'Dark Sky Reserve identification',
      run: () => certified.some(loc => loc.isDarkSkyReserve)
    },
    {
      name: 'Certified park identification',
      run: () => certified.some(loc => loc.certification === 'dark-sky-park')
    }
  ];
  
  // Run tests
  tests.forEach(test => {
    const passed = test.run();
    console.log(`${passed ? '✅' : '❌'} ${test.name}`);
  });
}

export { testLocationHandling };
