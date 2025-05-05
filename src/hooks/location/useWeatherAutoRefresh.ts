
import { useEffect, useRef } from "react";

/**
 * Automatically triggers the provided refresh function if weather data is missing/invalid.
 * Limits retries to avoid infinite loops.
 */
export function useWeatherAutoRefresh({
  weatherData,
  refreshFn,
  maxRetries = 3,
  retryDelay = 2000
}: {
  weatherData: any,
  refreshFn: () => void,
  maxRetries?: number,
  retryDelay?: number
}) {
  const retryCountRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  // Simple weather data validity check: must exist and have a temperature/humidity/cloudCover fields present
  function isWeatherDataValid(data: any): boolean {
    if (!data) return false;
    if (typeof data.temperature !== "number" || typeof data.humidity !== "number" || typeof data.cloudCover !== "number") return false;
    return true;
  }

  useEffect(() => {
    // Clean up the timer on component unmount
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // If valid, reset retry count
    if (isWeatherDataValid(weatherData)) {
      retryCountRef.current = 0;
      isRefreshingRef.current = false;
      return;
    }

    // If not valid, and we haven't exceeded retries, try to refresh
    if (!isRefreshingRef.current && retryCountRef.current < maxRetries) {
      isRefreshingRef.current = true;
      
      // Clear any existing timer
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      
      // Set a new timer
      const timer = setTimeout(() => {
        retryCountRef.current += 1;
        console.log(`Auto-refreshing weather data (attempt ${retryCountRef.current}/${maxRetries})`);
        refreshFn();
        isRefreshingRef.current = false;
      }, retryDelay);
      
      // Store the timer ID
      timerRef.current = timer as unknown as number;

      return () => {
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [weatherData, refreshFn, maxRetries, retryDelay]);
}
