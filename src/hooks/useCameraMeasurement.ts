
import { useState, useCallback, useEffect } from 'react';
import { cameraBrightnessToBortleEnhanced, cameraBrightnessToMpsasEnhanced, applyComprehensiveCorrection, getBortleNowSIQS } from '@/utils/bortleNowUtils';

interface CameraMeasurementOptions {
  deviceType?: string;
  exposureTimeMs?: number;
  angleFromZenith?: number;
  moonPhase?: number;
  humidity?: number;
  temperature?: number;
  altitude?: number;
}

interface CameraMeasurementResult {
  brightness: number | null;
  mpsas: number | null;
  bortle: number | null;
  quality: string | null;
  siqs: number | null;
  timestamp: string | null;
  corrections: Record<string, number> | null;
}

export const useCameraMeasurement = (options: CameraMeasurementOptions = {}) => {
  const [measurementResult, setMeasurementResult] = useState<CameraMeasurementResult>({
    brightness: null,
    mpsas: null,
    bortle: null,
    quality: null,
    siqs: null,
    timestamp: null,
    corrections: null
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // On mount, try to get cached measurement
  useEffect(() => {
    try {
      const storedMeasurement = localStorage.getItem('sky_brightness_measurement');
      if (storedMeasurement) {
        const measurement = JSON.parse(storedMeasurement);
        if (measurement && typeof measurement.value === 'number') {
          processMeasurement(measurement.value, options);
        }
      }
    } catch (e) {
      console.error("Error retrieving stored sky brightness measurement:", e);
    }
  }, []);
  
  // Process a raw brightness measurement
  const processMeasurement = useCallback((
    brightness: number,
    opts: CameraMeasurementOptions = {}
  ) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Merge default options with provided options
      const mergedOptions = {
        deviceType: opts.deviceType || 'default',
        exposureTimeMs: opts.exposureTimeMs || 250,
        angleFromZenith: opts.angleFromZenith || 0,
        moonPhase: opts.moonPhase || 0,
        humidity: opts.humidity || 50,
        temperature: opts.temperature || 15,
        altitude: opts.altitude || 0
      };
      
      // Apply comprehensive corrections to get accurate results
      const result = applyComprehensiveCorrection(
        brightness,
        mergedOptions.deviceType,
        mergedOptions.exposureTimeMs,
        mergedOptions.angleFromZenith,
        mergedOptions.moonPhase,
        mergedOptions.humidity,
        mergedOptions.temperature,
        mergedOptions.altitude
      );
      
      // Get SIQS estimate from brightness
      const siqs = getBortleNowSIQS(
        brightness,
        0, // cloud cover will be applied separately
        3, // default seeing conditions
        mergedOptions.moonPhase,
        mergedOptions.deviceType
      );
      
      const timestamp = new Date().toISOString();
      
      // Update the measurement result
      setMeasurementResult({
        brightness,
        mpsas: result.mpsas,
        bortle: result.bortle,
        quality: result.quality,
        siqs,
        timestamp,
        corrections: result.corrections
      });
      
      // Save to local storage
      saveMeasurement(brightness, result.mpsas, result.bortle, timestamp);
      
      return {
        brightness,
        mpsas: result.mpsas,
        bortle: result.bortle,
        quality: result.quality,
        siqs,
        timestamp,
        corrections: result.corrections
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error processing measurement';
      setError(errorMessage);
      console.error("Error processing camera measurement:", err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  // Save the measurement to local storage
  const saveMeasurement = useCallback((
    brightness: number,
    mpsas: number,
    bortle: number,
    timestamp: string
  ) => {
    try {
      localStorage.setItem('sky_brightness_measurement', JSON.stringify({
        value: brightness,
        mpsas,
        bortle,
        timestamp
      }));
    } catch (e) {
      console.error("Error saving sky brightness measurement:", e);
    }
  }, []);
  
  // Clear the stored measurement
  const clearMeasurement = useCallback(() => {
    try {
      localStorage.removeItem('sky_brightness_measurement');
      setMeasurementResult({
        brightness: null,
        mpsas: null,
        bortle: null,
        quality: null,
        siqs: null,
        timestamp: null,
        corrections: null
      });
    } catch (e) {
      console.error("Error clearing sky brightness measurement:", e);
    }
  }, []);
  
  return {
    measurementResult,
    isProcessing,
    error,
    processMeasurement,
    clearMeasurement
  };
};
