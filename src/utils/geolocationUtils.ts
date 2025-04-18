
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

// Keep track of ongoing geolocation requests to prevent duplicates
const pendingRequests: Record<string, boolean> = {};

/**
 * Enhanced getCurrentPosition with better mobile support
 * and handling of common mobile browser issues
 * Improved for faster performance and better error handling
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
      errorCallback(error);
    }
    return;
  }
  
  // Create a request key based on the options
  const requestKey = JSON.stringify(options || {});
  
  // Check if there's already a pending request with these options
  if (pendingRequests[requestKey]) {
    console.log("Geolocation request already in progress, skipping duplicate");
    return;
  }
  
  // Mark this request as pending
  pendingRequests[requestKey] = true;
  
  // Use shorter timeout for faster feedback
  const defaultTimeout = 5000; // 5 seconds instead of 6
  const opts = {
    enableHighAccuracy: true,
    timeout: defaultTimeout,
    maximumAge: 0, // Reduced from 60000 to 0 to always get fresh position
    ...options
  };
  
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
        pendingRequests[requestKey] = false; // Clear pending flag
        return;
      }
    }
    
    // Check if we need the most recent position or can use cached
    if (opts.maximumAge > 0) {
      // Use cached position if available and not expired
      const cachedPosition = localStorage.getItem('last_position');
      const cachedTimestamp = parseInt(localStorage.getItem('last_position_timestamp') || '0', 10);
      
      if (cachedPosition && Date.now() - cachedTimestamp < opts.maximumAge) {
        try {
          const position = JSON.parse(cachedPosition);
          // Return cached position immediately for faster response
          successCallback(position);
          pendingRequests[requestKey] = false; // Clear pending flag
          
          // Still try to get fresh position in the background
          navigator.geolocation.getCurrentPosition(
            (freshPosition) => {
              // Update cache with fresh position
              try {
                localStorage.setItem('last_position', JSON.stringify(freshPosition));
                localStorage.setItem('last_position_timestamp', Date.now().toString());
              } catch (e) {
                console.warn('Could not cache position:', e);
              }
            },
            () => {}, // Ignore errors since we already have cached position
            { enableHighAccuracy: opts.enableHighAccuracy, timeout: 10000 }
          );
          
          return;
        } catch (e) {
          console.warn('Could not parse cached position:', e);
          // Continue to get fresh position
        }
      }
    }
  } catch (err) {
    console.error("Error checking saved permissions:", err);
    // Continue even if localStorage check fails
  }

  // On iOS, sometimes timeout doesn't work as expected
  // Set up our own additional timeout just in case
  let timeoutId: number | null = null;
  const timeoutDuration = opts.timeout || defaultTimeout;
  
  if (timeoutDuration > 0) {
    timeoutId = window.setTimeout(() => {
      if (errorCallback) {
        const error = new Error("Geolocation request timed out.") as any;
        error.code = 3; // Timeout
        errorCallback(error);
      }
      pendingRequests[requestKey] = false; // Clear pending flag on timeout
    }, timeoutDuration + 1000); // Add 1 second buffer to browser's internal timeout
  }
  
  // Create wrapper callbacks to clear our manual timeout
  const successWrapper: PositionCallback = (position) => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
    
    try {
      // Save successful permission state
      localStorage.setItem('geolocation_permission', 'granted');
      
      // Cache the position for future use
      localStorage.setItem('last_position', JSON.stringify(position));
      localStorage.setItem('last_position_timestamp', Date.now().toString());
    } catch (err) {
      console.error("Error saving position data:", err);
    }
    
    successCallback(position);
    pendingRequests[requestKey] = false; // Clear pending flag on success
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
    
    pendingRequests[requestKey] = false; // Clear pending flag on error
  };
  
  // Use standard options
  const standardOptions = toStandardGeolocationOptions(opts);
  
  // Finally make the actual geolocation request
  navigator.geolocation.getCurrentPosition(successWrapper, errorWrapper, standardOptions);
}
