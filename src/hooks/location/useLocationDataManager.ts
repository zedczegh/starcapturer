
import { useState, useCallback, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocationUpdate } from "@/hooks/useLocationUpdate";
import { useLocationInit } from "./useLocationInit";
import { NavigateFunction } from "react-router-dom";
import { saveLocationDetails } from "@/utils/locationStorage";

interface UseLocationDataManagerProps {
  id: string | undefined;
  initialState: any;
  navigate: NavigateFunction;
  noRedirect?: boolean;
}

export const useLocationDataManager = ({ 
  id, 
  initialState, 
  navigate,
  noRedirect = false
}: UseLocationDataManagerProps) => {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error' | null>('info');
  const updatingRef = useRef(false);
  
  const { t } = useLanguage();
  
  const { 
    locationData, 
    setLocationData, 
    isLoading 
  } = useLocationInit(id, initialState, navigate, noRedirect);
  
  const { loading, handleLocationUpdate } = useLocationUpdate(locationData, setLocationData);

  // Wrapped setLocationData to ensure persistence and prevent race conditions
  const updateLocationData = useCallback((newData: any) => {
    if (updatingRef.current || !newData) return;
    
    try {
      updatingRef.current = true;
      
      // Ensure we have valid data with required fields
      const safeData = {
        ...newData,
        id: newData.id || id,
        timestamp: newData.timestamp || new Date().toISOString()
      };
      
      setLocationData(safeData);
      
      // Also save to localStorage for persistence
      if (id && safeData) {
        saveLocationDetails(id, safeData);
      }
      
      setTimeout(() => {
        updatingRef.current = false;
      }, 100);
    } catch (error) {
      console.error("Error updating location data:", error);
      updatingRef.current = false;
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
