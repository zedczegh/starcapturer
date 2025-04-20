
import { useState, useCallback, useRef } from "react";
import { useLocationInit } from "./useLocationInit";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { saveLocationDetails } from "@/utils/locationStorage";

/**
 * Centralized hook for managing location data with performance optimizations
 */
export function useLocationDataManager({ id, initialState, navigate: externalNavigate, noRedirect = false }) {
  const navigate = externalNavigate || useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"info" | "error" | "success" | null>(null);
  const updatingRef = useRef(false);
  const pendingUpdateRef = useRef<any>(null);
  
  // Use the locationInit hook with optimized loading
  const { locationData, setLocationData, isLoading } = useLocationInit(
    id,
    initialState,
    navigate,
    noRedirect
  );
  
  // Debounced update handler to prevent excessive re-renders
  const handleUpdateLocation = useCallback(async (updatedData: any) => {
    if (updatingRef.current) {
      // Store the most recent update request
      pendingUpdateRef.current = updatedData;
      return;
    }
    
    updatingRef.current = true;
    try {
      // Update location data
      const newLocationData = {
        ...locationData,
        ...updatedData,
        timestamp: updatedData.timestamp || new Date().toISOString()
      };
      
      // Maintain any existing IDs
      if (id && !newLocationData.id) {
        newLocationData.id = id;
      }
      
      // Only save to storage if we have an ID
      if (newLocationData.id) {
        await saveLocationDetails(newLocationData.id, newLocationData);
      }
      
      setLocationData(newLocationData);
      setStatusMessage(t("Location updated", "位置已更新"));
      setMessageType("success");
      
      // Auto-clear success message after 2 seconds
      setTimeout(() => {
        if (statusMessage === t("Location updated", "位置已更新")) {
          setStatusMessage(null);
        }
      }, 2000);
      
    } catch (error) {
      console.error("Error updating location:", error);
      setStatusMessage(t("Failed to update location", "更新位置失败"));
      setMessageType("error");
      toast({
        title: t("Error", "错误"),
        description: t("Failed to update location data", "更新位置数据失败"),
        variant: "destructive",
      });
    } finally {
      updatingRef.current = false;
      
      // Process any pending updates
      if (pendingUpdateRef.current) {
        const pendingUpdate = pendingUpdateRef.current;
        pendingUpdateRef.current = null;
        handleUpdateLocation(pendingUpdate);
      }
    }
  }, [locationData, setLocationData, id, t, statusMessage, toast]);
  
  return {
    locationData,
    setLocationData,
    statusMessage,
    setStatusMessage,
    messageType,
    setMessageType,
    handleUpdateLocation,
    isLoading
  };
}
