import { useState, useEffect } from "react";
import { checkBookingAvailability, getBulkBookingAvailability, BookingAvailabilityData } from "@/utils/bookingAvailability";

export const useBookingAvailability = (spotId: string) => {
  const [availability, setAvailability] = useState<BookingAvailabilityData>({
    hasAvailableSlots: false,
    totalSlots: 0,
    availableSlots: 0,
    bookedSlots: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!spotId) return;
      
      setLoading(true);
      try {
        const data = await checkBookingAvailability(spotId);
        setAvailability(data);
      } catch (error) {
        console.error('Error fetching booking availability:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [spotId]);

  return { availability, loading };
};

export const useBulkBookingAvailability = (spotIds: string[]) => {
  const [availabilities, setAvailabilities] = useState<Record<string, BookingAvailabilityData>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAvailabilities = async () => {
      if (!spotIds.length) return;
      
      setLoading(true);
      try {
        const data = await getBulkBookingAvailability(spotIds);
        setAvailabilities(data);
      } catch (error) {
        console.error('Error fetching bulk booking availability:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailabilities();
  }, [spotIds.join(',')]);

  return { availabilities, loading };
};