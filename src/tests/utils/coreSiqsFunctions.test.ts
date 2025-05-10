
/**
 * Tests for core SIQS functions
 * Run these tests before making any changes to the protected SIQS functions
 */

import {
  getSiqsScore,
  normalizeToSiqsScale,
  formatSiqsForDisplay,
  formatSiqsScore,
  isSiqsAtLeast,
  isSiqsGreaterThan
} from '@/utils/protected/coreSiqsFunctions';

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
 * Test suite for core SIQS functions
 */
export function testCoreSiqsFunctions() {
  console.log('Running core SIQS functions tests...');
  
  // Test getSiqsScore function
  runTest('getSiqsScore - Handle undefined input', () => {
    return getSiqsScore(undefined) === 0;
  });
  
  runTest('getSiqsScore - Handle numeric input', () => {
    return getSiqsScore(7.5) === 7.5;
  });
  
  runTest('getSiqsScore - Handle object input', () => {
    return getSiqsScore({ score: 7.5, isViable: true }) === 7.5;
  });
  
  runTest('getSiqsScore - Handle nested object input', () => {
    return getSiqsScore({ siqs: 7.5 }) === 7.5;
  });
  
  runTest('getSiqsScore - Handle nested object with score property', () => {
    return getSiqsScore({ siqs: { score: 7.5, isViable: true } }) === 7.5;
  });
  
  // Test normalizeToSiqsScale function
  runTest('normalizeToSiqsScale - Handle values in range', () => {
    return normalizeToSiqsScale(7.5) === 7.5;
  });
  
  runTest('normalizeToSiqsScale - Handle 0-100 scale values', () => {
    return normalizeToSiqsScale(75) === 7.5;
  });
  
  runTest('normalizeToSiqsScale - Cap max values', () => {
    return normalizeToSiqsScale(150) === 10;
  });
  
  runTest('normalizeToSiqsScale - Cap min values', () => {
    return normalizeToSiqsScale(-5) === 0;
  });
  
  // Test formatting functions
  runTest('formatSiqsForDisplay - Handle null input', () => {
    return formatSiqsForDisplay(null) === "N/A";
  });
  
  runTest('formatSiqsForDisplay - Format valid score', () => {
    return formatSiqsForDisplay(7.5) === "7.5";
  });
  
  runTest('formatSiqsScore - Format number input', () => {
    return formatSiqsScore(7.5) === "7.5";
  });
  
  runTest('formatSiqsScore - Format object input', () => {
    return formatSiqsScore({ score: 7.5, isViable: true }) === "7.5";
  });
  
  // Test comparison functions
  runTest('isSiqsAtLeast - Compare number', () => {
    return isSiqsAtLeast(7.5, 7.0) === true && isSiqsAtLeast(7.0, 7.5) === false;
  });
  
  runTest('isSiqsAtLeast - Compare object', () => {
    return isSiqsAtLeast({ score: 7.5, isViable: true }, 7.0) === true;
  });
  
  runTest('isSiqsGreaterThan - Compare number', () => {
    return isSiqsGreaterThan(7.5, 7.0) === true && isSiqsGreaterThan(7.0, 7.0) === false;
  });
  
  runTest('isSiqsGreaterThan - Compare object', () => {
    return isSiqsGreaterThan({ score: 7.5, isViable: true }, 7.0) === true;
  });
  
  console.log('Core SIQS functions tests completed');
}

// Add to window for manual execution in browser console
if (typeof window !== 'undefined') {
  (window as any).testCoreSiqsFunctions = testCoreSiqsFunctions;
}
