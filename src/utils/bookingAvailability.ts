import { supabase } from "@/integrations/supabase/client";
import { isAfter, parseISO } from "date-fns";

export interface BookingAvailabilityData {
  hasAvailableSlots: boolean;
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
}

/**
 * Check if an astro spot has available booking slots
 * @param spotId - The ID of the astro spot
 * @returns Promise with booking availability data
 */
export const checkBookingAvailability = async (spotId: string): Promise<BookingAvailabilityData> => {
  try {
    // Fetch all future timeslots for this spot
    const { data: timeslots, error: timeslotsError } = await supabase
      .from('astro_spot_timeslots')
      .select(`
        id,
        start_time,
        end_time,
        max_capacity,
        astro_spot_reservations (
          id,
          status
        )
      `)
      .eq('spot_id', spotId)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    if (timeslotsError) {
      console.error('Error fetching timeslots:', timeslotsError);
      return {
        hasAvailableSlots: false,
        totalSlots: 0,
        availableSlots: 0,
        bookedSlots: 0
      };
    }

    if (!timeslots || timeslots.length === 0) {
      return {
        hasAvailableSlots: false,
        totalSlots: 0,
        availableSlots: 0,
        bookedSlots: 0
      };
    }

    let availableSlots = 0;
    let bookedSlots = 0;
    const totalSlots = timeslots.length;

    // Check each timeslot for availability
    for (const slot of timeslots) {
      // Count confirmed reservations for this slot
      const confirmedReservations = slot.astro_spot_reservations?.filter(
        (reservation: any) => reservation.status === 'confirmed'
      ) || [];

      const bookedCapacity = confirmedReservations.length;
      const remainingCapacity = slot.max_capacity - bookedCapacity;

      if (remainingCapacity > 0) {
        availableSlots++;
      } else {
        bookedSlots++;
      }
    }

    return {
      hasAvailableSlots: availableSlots > 0,
      totalSlots,
      availableSlots,
      bookedSlots
    };
  } catch (error) {
    console.error('Error checking booking availability:', error);
    return {
      hasAvailableSlots: false,
      totalSlots: 0,
      availableSlots: 0,
      bookedSlots: 0
    };
  }
};

/**
 * Hook to get booking availability for multiple spots
 * @param spotIds - Array of spot IDs to check
 * @returns Record of spot ID to availability data
 */
export const getBulkBookingAvailability = async (spotIds: string[]): Promise<Record<string, BookingAvailabilityData>> => {
  const results: Record<string, BookingAvailabilityData> = {};
  
  // Process spots in batches to avoid overwhelming the database
  const batchSize = 10;
  for (let i = 0; i < spotIds.length; i += batchSize) {
    const batch = spotIds.slice(i, i + batchSize);
    const batchPromises = batch.map(async (spotId) => ({
      spotId,
      data: await checkBookingAvailability(spotId)
    }));
    
    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(({ spotId, data }) => {
      results[spotId] = data;
    });
  }
  
  return results;
};