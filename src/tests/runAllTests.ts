
import { testViewToggle } from './photoPoints/viewToggle.test';
import { testSiqsDisplay } from './photoPoints/siqsDisplay.test';
import { testLocationHandling } from './photoPoints/locationHandling.test';
import { testCoreSiqsFunctions } from './utils/coreSiqsFunctions.test';

export function runAllTests() {
  console.log('Running ViewToggle tests...');
  testViewToggle();
  
  console.log('\nRunning SIQS Display tests...');
  testSiqsDisplay();
  
  console.log('\nRunning Location Handling tests...');
  testLocationHandling();
  
  console.log('\nRunning Core SIQS Functions tests...');
  testCoreSiqsFunctions();
}

// Add to window for manual execution in browser console
if (typeof window !== 'undefined') {
  (window as any).runAllTests = runAllTests;
}
