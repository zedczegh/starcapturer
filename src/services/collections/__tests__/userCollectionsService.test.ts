
import { userCollectionsService } from '../userCollectionsService';
import { supabase } from '@/integrations/supabase/client';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

// Mock the Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      delete: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
      maybeSingle: jest.fn()
    }))
  }
}));

describe('userCollectionsService', () => {
  const mockUserId = 'test-user-id';
  const mockLocation: SharedAstroSpot = {
    id: 'test-id',
    name: 'Test Location',
    latitude: 40,
    longitude: -70,
    bortleScale: 4,
    siqs: 7,
    certification: null,
    isDarkSkyReserve: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserLocations', () => {
    it('should fetch user locations successfully', async () => {
      const mockData = [mockLocation];
      const mockSupabase = supabase.from('').select();
      mockSupabase.eq = jest.fn().mockReturnThis();
      mockSupabase.order = jest.fn().mockResolvedValue({ data: mockData, error: null });

      const result = await userCollectionsService.getUserLocations(mockUserId);
      expect(result).toEqual(mockData);
    });
  });

  describe('deleteLocation', () => {
    it('should delete location successfully', async () => {
      const mockSupabase = supabase.from('').delete();
      mockSupabase.eq = jest.fn().mockResolvedValue({ error: null });

      await expect(userCollectionsService.deleteLocation('test-id', mockUserId))
        .resolves.not.toThrow();
    });
  });

  describe('addLocation', () => {
    it('should add new location successfully', async () => {
      const mockSupabase = supabase.from('').insert();
      mockSupabase.eq = jest.fn().mockResolvedValue({ error: null });

      await expect(userCollectionsService.addLocation(mockLocation, mockUserId))
        .resolves.not.toThrow();
    });
  });
});
