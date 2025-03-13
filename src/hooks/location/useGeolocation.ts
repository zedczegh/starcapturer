
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  language: string;
}

export const useGeolocation = (options: GeolocationOptions) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();
  const { language } = options;

  const clearTimeoutRef = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleSuccess = (position: GeolocationPosition) => {
    clearTimeoutRef();
    setLoading(false);
    setError(null);
    setCoords({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    });
  };

  const handleError = (geolocationError: GeolocationPositionError) => {
    clearTimeoutRef();
    setLoading(false);
    
    let errorMessage = "";
    switch (geolocationError.code) {
      case geolocationError.PERMISSION_DENIED:
        errorMessage = language === 'en'
          ? "Location permission denied. Please check your browser settings."
          : "位置权限被拒绝。请检查您的浏览器设置。";
        break;
      case geolocationError.POSITION_UNAVAILABLE:
        errorMessage = language === 'en'
          ? "Location information is unavailable. Try another method."
          : "位置信息不可用。请尝试其他方法。";
        break;
      case geolocationError.TIMEOUT:
        errorMessage = language === 'en'
          ? "Location request timed out. Please try again."
          : "位置请求超时。请重试。";
        break;
      default:
        errorMessage = language === 'en'
          ? "An unknown error occurred while getting your location."
          : "获取位置时发生未知错误。";
    }
    
    setError(errorMessage);
    console.error("Geolocation error:", geolocationError);
  };

  const getPosition = () => {
    if (!navigator.geolocation) {
      const message = language === 'en' 
        ? "Your browser doesn't support geolocation. Please enter coordinates manually."
        : "您的浏览器不支持地理位置，请手动输入坐标。";
      setError(message);
      return;
    }
    
    setLoading(true);
    
    // Set timeout as a backup
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError(language === 'en' 
          ? "Location request timed out. Please try again or enter coordinates manually." 
          : "位置请求超时。请重试或手动输入坐标。");
      }
    }, options.timeout || 12000);
    
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: options.enableHighAccuracy || true,
        timeout: options.timeout || 12000,
        maximumAge: options.maximumAge || 0
      }
    );
  };

  // Cleanup on unmount
  useEffect(() => {
    return clearTimeoutRef;
  }, []);

  return {
    loading,
    error,
    coords,
    getPosition
  };
};
