
// This file now re-exports the functionality from the geocoding directory
// It's maintained for backward compatibility
import { normalizeLongitude } from '@/lib/api/coordinates';
export { normalizeLongitude };

export * from './geocoding/index';
