
import { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocationUpdate } from "@/hooks/useLocationUpdate";
import { useLocationInit } from "./useLocationInit";
import { NavigateFunction } from "react-router-dom";
import { saveLocationDetails } from "@/utils/locationStorage";

interface UseLocationDataManagerProps {
  id: string | undefined;
  initialState: any;
  navigate: NavigateFunction;
}

export const useLocationDataManager = ({ 
  id, 
  initialState, 
  navigate 
}: UseLocationDataManagerProps) => {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error' | null>('info');
  
  const { t } = useLanguage();
  
  const { 
    locationData, 
    setLocationData, 
    isLoading 
  } = useLocationInit(id, initialState, navigate);
  
  const { loading, handleLocationUpdate } = useLocationUpdate(locationData, setLocationData);

  // Wrapped setLocationData to ensure persistence
  const updateLocationData = useCallback((newData: any) => {
    setLocationData(newData);
    
    // Also save to localStorage for persistence
    if (id && newData) {
      saveLocationDetails(id, newData);
    }
  }, [id, setLocationData]);

  const handleUpdateLocation = useCallback(async (newLocation: { name: string; latitude: number; longitude: number }) => {
    try {
      await handleLocationUpdate(newLocation);
      setStatusMessage(t("SIQS score has been recalculated for the new location.", 
                   "已为新位置重新计算SIQS评分。"));
      setMessageType('success');
      setTimeout(() => setStatusMessage(null), 3000);
      return Promise.resolve();
    } catch (error) {
      setStatusMessage(t("Failed to update location and recalculate SIQS score. Please try again.", 
                   "无法更新位置并重新计算SIQS评分。请重试。"));
      setMessageType('error');
      return Promise.reject(error);                   
    }
  }, [handleLocationUpdate, t]);

  return {
    locationData,
    setLocationData: updateLocationData,
    statusMessage,
    messageType,
    setStatusMessage,
    handleUpdateLocation,
    isLoading
  };
};
