
export * from './waterLocationValidator';
export * from './astronomyLocationValidator';
export * from './coordinateValidator';

// Re-export from main validation file for backwards compatibility
export { isWaterLocation, isValidAstronomyLocation } from './waterLocationValidator';
