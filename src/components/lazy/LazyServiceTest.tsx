
import { lazy } from 'react';

// Lazy load the heavy service test component
export const LazyComprehensiveServiceTest = lazy(() => import('../test/ComprehensiveServiceTest'));
export const LazyMapServiceTest = lazy(() => import('../test/MapServiceTest'));
