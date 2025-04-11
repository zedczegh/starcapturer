
// Re-export all SIQS functionality from services
export * from '../realTimeSiqsService';
export * from '../bestLocationsService';
export { 
  updateLocationsWithRealTimeSiqs,
  clearLocationCache as clearLocationCache,
  clearLocationCache as clearSiqsCache // Export with alias for backward compatibility
} from './locationUpdateService';
