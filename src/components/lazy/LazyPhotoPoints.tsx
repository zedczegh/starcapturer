
import { lazy } from 'react';

// Lazy load photo points components that are heavy
export const LazyPhotoPointsNearby = lazy(() => import('../../pages/PhotoPointsNearby'));
export const LazyLocationDetails = lazy(() => import('../../pages/LocationDetails'));
export const LazyCommunityAstroSpots = lazy(() => import('../../pages/CommunityAstroSpots'));
