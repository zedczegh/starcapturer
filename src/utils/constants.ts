
// Spot generation constants
export const MAX_LOAD_MORE_CLICKS = 2;
export const DEFAULT_SPOT_LIMIT = 10;
export const MIN_SPOT_QUALITY = 5;

// Cache duration constants
export const SPOT_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
export const LOCATION_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Search radius constants
export const DEFAULT_SEARCH_RADIUS = 100; // km
export const MAX_SEARCH_RADIUS = 1000; // km
export const MIN_SEARCH_RADIUS = 50; // km

// Batch processing constants
export const BATCH_SIZE = 5;

// Certified locations radius - for fetching all certified dark sky locations globally
export const DEFAULT_CERTIFIED_RADIUS = 20000; // km - large enough to get worldwide locations
