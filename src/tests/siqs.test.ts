
/**
 * SIQS Algorithm Tests
 * 
 * These tests help ensure the integrity of the SIQS calculation algorithm.
 * Run these tests when making changes to the SIQS calculation logic.
 * 
 * Note: In a production environment, these would be run with Jest or Vitest.
 * This file provides the test structure to implement when setting up formal testing.
 */
import { calculateSIQS } from "../lib/calculateSIQS";
import { 
  calculateCloudScore,
  calculateLightPollutionScore,
  calculateSeeingScore,
  calculateWindScore,
  calculateHumidityScore,
  calculateMoonScore,
  calculateAQIScore,
  calculateClearSkyScore
} from "../lib/siqs/factors";

/**
 * Helper function to run tests
 */
function runTest(name: string, testFn: () => boolean): void {
  try {
    const passed = testFn();
    console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${name}`);
  } catch (error) {
    console.error(`❌ ERROR: ${name}`, error);
  }
}

/**
 * Test SIQS factor calculations
 */
export function testSiqsFactors() {
  // Test cloud score
  runTest('Cloud Score - Clear Sky', () => {
    const score = calculateCloudScore(0);
    return score === 100;
  });
  
  runTest('Cloud Score - Full Cover', () => {
    const score = calculateCloudScore(100);
    return score === 0;
  });
  
  // Test light pollution score
  runTest('Light Pollution - Bortle 1', () => {
    const score = calculateLightPollutionScore(1);
    return score > 99; // Should be ~100
  });
  
  runTest('Light Pollution - Bortle 9', () => {
    const score = calculateLightPollutionScore(9);
    return score < 10; // Should be very low
  });
  
  // Test seeing conditions
  runTest('Seeing Conditions - Excellent', () => {
    const score = calculateSeeingScore(1);
    return score === 100;
  });
  
  // Test wind score
  runTest('Wind Score - No Wind', () => {
    const score = calculateWindScore(0);
    return score === 100;
  });
  
  runTest('Wind Score - High Wind', () => {
    const score = calculateWindScore(40);
    return score === 0;
  });
  
  // Test humidity score
  runTest('Humidity Score - Dry', () => {
    const score = calculateHumidityScore(20);
    return score === 90;
  });
  
  // Test moon score
  runTest('Moon Score - New Moon', () => {
    const score = calculateMoonScore(0);
    return score === 100;
  });
  
  runTest('Moon Score - Full Moon', () => {
    const score = calculateMoonScore(0.5);
    return score === 0;
  });
  
  // Test AQI score
  runTest('AQI Score - Good Air Quality', () => {
    const score = calculateAQIScore(20);
    return score === 100;
  });
  
  // Test clear sky rate score
  runTest('Clear Sky Rate - High Rate', () => {
    const score = calculateClearSkyScore(85);
    return score === 100;
  });
}

/**
 * Test full SIQS calculation
 */
export function testFullSiqsCalculation() {
  // Test excellent conditions
  runTest('Excellent Conditions', () => {
    const result = calculateSIQS({
      cloudCover: 10,          // Clear skies
      bortleScale: 2,          // Dark skies
      seeingConditions: 1,     // Excellent
      windSpeed: 3,            // Low wind
      humidity: 30,            // Low humidity
      moonPhase: 0,            // New moon
      aqi: 20,                 // Clean air
      clearSkyRate: 85         // High clear sky rate
    });
    
    return result.score > 8.5 && result.isViable === true;
  });
  
  // Test poor conditions
  runTest('Poor Conditions', () => {
    const result = calculateSIQS({
      cloudCover: 80,          // Cloudy
      bortleScale: 8,          // Light polluted
      seeingConditions: 5,     // Poor
      windSpeed: 30,           // High wind
      humidity: 85,            // High humidity
      moonPhase: 0.5,          // Full moon
      aqi: 200,                // Poor air quality
      clearSkyRate: 30         // Low clear sky rate
    });
    
    return result.score < 3.5 && result.isViable === false;
  });
}

/**
 * Run the tests (add to window object for manual execution)
 */
export function runSiqsTests() {
  console.log('Running SIQS tests...');
  testSiqsFactors();
  testFullSiqsCalculation();
  console.log('SIQS tests completed');
}

// Add to window for manual execution in browser console
if (typeof window !== 'undefined') {
  (window as any).runSiqsTests = runSiqsTests;
}
