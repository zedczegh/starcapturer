import { useState, useEffect } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { fetchForecastData } from '@/lib/api/forecast';
import { calculateNighttimeSiqs as calculateNighttimeSIQS } from '@/utils/nighttimeSIQS';
import { useLanguage } from '@/contexts/LanguageContext';

interface UseLocationDetailsProps {
  latitude: number;
  longitude: number;
  bortleScale?: number;
  name?: string;
}

export const useLocationDetails = ({
  latitude,
  longitude,
  bortleScale = 4,
  name
}: UseLocationDetailsProps) => {
  const { t } = useLanguage();
  const [forecastData, setForecastData] = useState<any>(null);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [errorForecast, setErrorForecast] = useState<string | null>(null);
  const [siqsResult, setSiqsResult] = useState<any>(null);
  const [loadingSiqs, setLoadingSiqs] = useState(false);
  const [errorSiqs, setErrorSiqs] = useState<string | null>(null);

  useEffect(() => {
    const fetchForecast = async () => {
      setLoadingForecast(true);
      setErrorForecast(null);
      try {
        const data = await fetchForecastData(latitude, longitude);
        setForecastData(data);
      } catch (error: any) {
        console.error("Failed to fetch forecast data:", error);
        setErrorForecast(t("Failed to fetch forecast data", "获取预报数据失败"));
      } finally {
        setLoadingForecast(false);
      }
    };

    fetchForecast();
  }, [latitude, longitude, t]);

  useEffect(() => {
    const calculateSiqs = async () => {
      if (!forecastData) return;

      setLoadingSiqs(true);
      setErrorSiqs(null);

      try {
        const siqs = calculateNighttimeSIQS(
          {
            latitude,
            longitude,
            bortleScale,
            name
          },
          forecastData,
          t
        );
        setSiqsResult(siqs);
      } catch (error: any) {
        console.error("Failed to calculate SIQS:", error);
        setErrorSiqs(t("Failed to calculate SIQS", "计算SIQS失败"));
      } finally {
        setLoadingSiqs(false);
      }
    };

    calculateSiqs();
  }, [forecastData, latitude, longitude, bortleScale, name, t]);

  return {
    forecastData,
    loadingForecast,
    errorForecast,
    siqsResult,
    loadingSiqs,
    errorSiqs
  };
};
