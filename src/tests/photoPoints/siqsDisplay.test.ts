
/**
 * SIQS Display Tests
 * Ensures consistent behavior of SIQS score display logic
 */

interface SiqsTestCase {
  realTimeSiqs: number | null;
  locationSiqs: number | undefined;
  isCertified: boolean;
  expected: number | null;
}

function testSiqsDisplay() {
  // Test cases for SIQS display logic
  const testCases: SiqsTestCase[] = [
    {
      realTimeSiqs: 7.5,
      locationSiqs: 6.0,
      isCertified: true,
      expected: 7.5 // Should prefer real-time SIQS
    },
    {
      realTimeSiqs: null,
      locationSiqs: 6.0,
      isCertified: true,
      expected: 6.0 // Should use location SIQS when real-time not available
    },
    {
      realTimeSiqs: 0,
      locationSiqs: 6.0,
      isCertified: true,
      expected: 6.0 // Should use location SIQS when real-time is 0
    },
    {
      realTimeSiqs: null,
      locationSiqs: undefined,
      isCertified: true,
      expected: null // Should return null when no valid scores
    }
  ];
  
  // Test display score calculation
  const getDisplayScore = (
    realTimeSiqs: number | null,
    locationSiqs: number | undefined,
    isCertified: boolean
  ): number | null => {
    if (realTimeSiqs !== null && realTimeSiqs > 0) {
      return realTimeSiqs;
    }
    if (locationSiqs && locationSiqs > 0) {
      return locationSiqs;
    }
    if (isCertified) {
      return locationSiqs && locationSiqs > 0 ? locationSiqs : null;
    }
    return null;
  };
  
  // Run tests
  testCases.forEach((testCase, index) => {
    const result = getDisplayScore(
      testCase.realTimeSiqs,
      testCase.locationSiqs,
      testCase.isCertified
    );
    
    const passed = result === testCase.expected;
    console.log(`Test case ${index + 1}: ${passed ? '✅' : '❌'}`);
    
    if (!passed) {
      console.log('Expected:', testCase.expected);
      console.log('Got:', result);
    }
  });
}

export { testSiqsDisplay };
