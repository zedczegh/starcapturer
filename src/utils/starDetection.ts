/**
 * Advanced star detection utilities for astronomy images
 * 
 * This file now re-exports from the refactored modular implementation
 * for backward compatibility while maintaining the same API.
 * 
 * Refactored: 2025-11-01
 * Original functionality preserved, now organized into focused modules.
 */

// Re-export everything from the refactored implementation
export type { DetectedStar, StarDetectionSettings } from './starDetection/types';
export { DEFAULT_SETTINGS } from './starDetection/types';
export { detectStarsFromImage, separateStarsAndNebula } from './starDetection/index';
