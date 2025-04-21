
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

  // Simple weather data validity check: must exist and have a temperature/humidity/cloudCover fields present
  function isWeatherDataValid(data: any): boolean {
    if (!data) return false;
    if (typeof data.temperature !== "number" || typeof data.humidity !== "number" || typeof data.cloudCover !== "number") return false;
    return true;
  }

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
      const timer = setTimeout(() => {
        retryCountRef.current += 1;
        refreshFn();
        isRefreshingRef.current = false;
      }, retryDelay);

      return () => clearTimeout(timer);
    }
  }, [weatherData, refreshFn, maxRetries, retryDelay]);
}
