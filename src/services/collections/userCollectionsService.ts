
import { supabase } from '@/integrations/supabase/client';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { toast } from 'sonner';

export interface SavedLocation extends SharedAstroSpot {
  user_id: string;
}

export const userCollectionsService = {
  async getUserLocations(userId: string): Promise<SavedLocation[]> {
    try {
      const { data, error } = await supabase
        .from('saved_locations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user collections:', error);
      throw error;
    }
  },

  async deleteLocation(locationId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('saved_locations')
        .delete()
        .eq('id', locationId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  },

  async addLocation(location: SharedAstroSpot, userId: string): Promise<void> {
    try {
      // Check if location already exists
      const { data: existingLocation } = await supabase
        .from('saved_locations')
        .select('id')
        .eq('user_id', userId)
        .eq('latitude', location.latitude)
        .eq('longitude', location.longitude)
        .maybeSingle();

      if (existingLocation) {
        toast.info("Already in Collection", {
          description: "This location is already in your collection"
        });
        return;
      }

      const { error } = await supabase.from('saved_locations').insert({
        user_id: userId,
        name: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        bortleScale: location.bortleScale,
        certification: location.certification,
        isDarkSkyReserve: location.isDarkSkyReserve,
        siqs: location.siqs
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving location:', error);
      throw error;
    }
  }
};
