
import { describe, it, expect, beforeEach } from 'vitest';
import { generateRandomPoint, generateDistributedPoints } from '../services/location/pointGenerationService';
import { getCachedSpots, cacheSpots, clearSpotCache } from '../services/location/spotCacheService';
import { createSpotFromPoint } from '../services/location/spotCreationService';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

describe('Point Generation Service', () => {
  it('generates random point within radius', () => {
    const centerLat = 40;
    const centerLng = 116;
    const radius = 100;
    
    const point = generateRandomPoint(centerLat, centerLng, radius);
    
    expect(point.latitude).toBeDefined();
    expect(point.longitude).toBeDefined();
    expect(point.distance).toBeLessThanOrEqual(radius);
  });

  it('generates distributed points', () => {
    const centerLat = 40;
    const centerLng = 116;
    const radius = 100;
    const count = 10;
    
    const points = generateDistributedPoints(centerLat, centerLng, radius, count);
    
    expect(points.length).toBe(count);
    points.forEach(point => {
      expect(point.distance).toBeLessThanOrEqual(radius);
    });
  });
});

describe('Spot Cache Service', () => {
  beforeEach(() => {
    clearSpotCache();
  });

  it('caches and retrieves spots', () => {
    const centerLat = 40;
    const centerLng = 116;
    const radius = 100;
    const limit = 10;
    
    const mockSpots: SharedAstroSpot[] = [{
      id: 'test-1',
      name: 'Test Location',
      latitude: 40.1,
      longitude: 116.1,
      bortleScale: 3,
      siqs: 70,
      isViable: true,
      distance: 10,
      timestamp: new Date().toISOString()
    }];
    
    cacheSpots(centerLat, centerLng, radius, limit, mockSpots);
    
    const cachedSpots = getCachedSpots(centerLat, centerLng, radius, limit);
    expect(cachedSpots).toEqual(mockSpots);
  });

  it('returns null for expired cache', () => {
    const centerLat = 40;
    const centerLng = 116;
    const radius = 100;
    const limit = 10;
    
    const mockSpots: SharedAstroSpot[] = [{
      id: 'test-1',
      name: 'Test Location',
      latitude: 40.1,
      longitude: 116.1,
      bortleScale: 3,
      siqs: 70,
      isViable: true,
      distance: 10,
      timestamp: new Date().toISOString()
    }];
    
    // Mock Date.now to simulate cache expiration
    const realDateNow = Date.now;
    Date.now = () => new Date().getTime() + (31 * 60 * 1000); // 31 minutes in the future
    
    cacheSpots(centerLat, centerLng, radius, limit, mockSpots);
    const cachedSpots = getCachedSpots(centerLat, centerLng, radius, limit);
    
    expect(cachedSpots).toBeNull();
    
    // Restore Date.now
    Date.now = realDateNow;
  });
});

describe('Spot Creation Service', () => {
  it('creates valid spot from point', async () => {
    const point = {
      latitude: 40,
      longitude: 116,
      distance: 50
    };
    
    const spot = await createSpotFromPoint(point);
    
    if (spot) {
      expect(spot.id).toBeDefined();
      expect(spot.latitude).toBe(point.latitude);
      expect(spot.longitude).toBe(point.longitude);
      expect(spot.distance).toBe(point.distance);
      expect(spot.siqs).toBeGreaterThan(0);
      expect(spot.bortleScale).toBeDefined();
    }
  });

  it('returns null for low quality spots', async () => {
    const point = {
      latitude: 40,
      longitude: 116,
      distance: 50
    };
    
    const spot = await createSpotFromPoint(point, 100); // Very high quality threshold
    expect(spot).toBeNull();
  });
});
