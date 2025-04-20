
import { testViewToggle } from './photoPoints/viewToggle.test';
import { testSiqsDisplay } from './photoPoints/siqsDisplay.test';
import { testLocationHandling } from './photoPoints/locationHandling.test';

export function runAllTests() {
  console.log('Running ViewToggle tests...');
  testViewToggle();
  
  console.log('\nRunning SIQS Display tests...');
  testSiqsDisplay();
  
  console.log('\nRunning Location Handling tests...');
  testLocationHandling();
}

// Add to window for manual execution in browser console
if (typeof window !== 'undefined') {
  (window as any).runAllTests = runAllTests;
}
