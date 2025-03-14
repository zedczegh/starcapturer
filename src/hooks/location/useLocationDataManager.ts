
import { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocationUpdate } from "@/hooks/useLocationUpdate";
import { useLocationInit } from "./useLocationInit";
import { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";

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
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info');
  
  const { t } = useLanguage();
  
  const { 
    locationData, 
    setLocationData, 
    isLoading 
  } = useLocationInit(id, initialState, navigate);
  
  const { loading, handleLocationUpdate } = useLocationUpdate(locationData, setLocationData);

  const handleUpdateLocation = useCallback(async (newLocation: { name: string; latitude: number; longitude: number }) => {
    try {
      await handleLocationUpdate(newLocation);
      setStatusMessage(t("SIQS score has been recalculated for the new location.", 
                   "已为新位置重新计算SIQS评分。"));
      setMessageType('success');
      setTimeout(() => setStatusMessage(null), 3000);
      
      // Show additional feedback
      toast.success(t("Location updated successfully", "位置更新成功"));
    } catch (error) {
      console.error("Error updating location:", error);
      setStatusMessage(t("Failed to update location and recalculate SIQS score. Please try again.", 
                   "无法更新位置并重新计算SIQS评分。请重试。"));
      setMessageType('error');
      
      toast.error(t("Failed to update location", "位置更新失败"));
    }
  }, [handleLocationUpdate, t]);

  return {
    locationData,
    setLocationData,
    statusMessage,
    messageType,
    setStatusMessage,
    handleUpdateLocation,
    isLoading
  };
};
