
/**
 * Extended GeolocationOptions with language support
 * Note: The language property is not part of the standard GeolocationOptions
 * but we need it for our application's language handling
 */
export interface ExtendedGeolocationOptions extends Omit<PositionOptions, 'language'> {
  language?: string;
}

/**
 * Convert our extended options to standard GeolocationOptions
 * by removing any non-standard properties
 */
export function toStandardGeolocationOptions(options: ExtendedGeolocationOptions): PositionOptions {
  // Extract only the properties that are part of the standard GeolocationOptions
  const { enableHighAccuracy, timeout, maximumAge } = options;
  
  return { 
    enableHighAccuracy,
    timeout,
    maximumAge
  };
}

/**
 * Enhanced getCurrentPosition with better mobile support
 * and handling of common mobile browser issues
 */
export function getCurrentPosition(
  successCallback: PositionCallback,
  errorCallback?: PositionErrorCallback,
  options?: ExtendedGeolocationOptions
): void {
  // First check if geolocation is supported
  if (!navigator.geolocation) {
    if (errorCallback) {
      const error = new Error("Geolocation is not supported by this browser.") as any;
      error.code = 0;
      error.PERMISSION_DENIED = 1;
      errorCallback(error);
    }
    return;
  }
  
  // Check for saved permissions to avoid repeated prompts
  // This helps with some mobile browsers that repeatedly request permission
  try {
    const permissionStatus = localStorage.getItem('geolocation_permission');
    
    // If previously denied and it hasn't been 24 hours, use fallback
    if (permissionStatus === 'denied') {
      const deniedTimestamp = parseInt(localStorage.getItem('geolocation_denied_at') || '0', 10);
      const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (Date.now() - deniedTimestamp < oneDay) {
        if (errorCallback) {
          const error = new Error("Location permission previously denied.") as any;
          error.code = 1; // Permission denied
          errorCallback(error);
        }
        return;
      }
    }
  } catch (err) {
    console.error("Error checking saved permissions:", err);
    // Continue even if localStorage check fails
  }

  // On iOS, sometimes timeout doesn't work as expected
  // Set up our own additional timeout just in case
  let timeoutId: number | null = null;
  const timeoutDuration = options?.timeout || 10000;
  
  if (timeoutDuration > 0) {
    timeoutId = window.setTimeout(() => {
      if (errorCallback) {
        const error = new Error("Geolocation request timed out.") as any;
        error.code = 3; // Timeout
        errorCallback(error);
      }
    }, timeoutDuration + 2000); // Add 2 seconds buffer to browser's internal timeout
  }
  
  // Create wrapper callbacks to clear our manual timeout
  const successWrapper: PositionCallback = (position) => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
    
    try {
      // Save successful permission state
      localStorage.setItem('geolocation_permission', 'granted');
    } catch (err) {
      console.error("Error saving permission state:", err);
    }
    
    successCallback(position);
  };
  
  const errorWrapper: PositionErrorCallback = (error) => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
    
    try {
      // Track denied permissions
      if (error.code === 1) { // Permission denied
        localStorage.setItem('geolocation_permission', 'denied');
        localStorage.setItem('geolocation_denied_at', Date.now().toString());
      }
    } catch (err) {
      console.error("Error saving permission state:", err);
    }
    
    if (errorCallback) {
      errorCallback(error);
    }
  };
  
  // Use standard options
  const standardOptions = options ? toStandardGeolocationOptions(options) : undefined;
  
  // Finally make the actual geolocation request
  navigator.geolocation.getCurrentPosition(successWrapper, errorWrapper, standardOptions);
}
