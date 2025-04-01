
/**
 * Extended GeolocationOptions with language support
 * Note: The language property is not part of the standard GeolocationOptions
 * but we need it for our application's language handling
 */
export interface ExtendedGeolocationOptions extends Omit<GeolocationOptions, 'language'> {
  language?: string;
}

/**
 * Convert our extended options to standard GeolocationOptions
 * by removing any non-standard properties
 */
export function toStandardGeolocationOptions(options: ExtendedGeolocationOptions): GeolocationOptions {
  // Extract only the properties that are part of the standard GeolocationOptions
  const { enableHighAccuracy, timeout, maximumAge } = options;
  
  return { 
    enableHighAccuracy,
    timeout,
    maximumAge
  };
}

/**
 * Get current position with standardized options
 */
export function getCurrentPosition(
  successCallback: PositionCallback,
  errorCallback?: PositionErrorCallback,
  options?: ExtendedGeolocationOptions
): void {
  if (!navigator.geolocation) {
    if (errorCallback) {
      const error = new Error("Geolocation is not supported by this browser.") as any;
      error.code = 0;
      error.PERMISSION_DENIED = 1;
      errorCallback(error);
    }
    return;
  }
  
  const standardOptions = options ? toStandardGeolocationOptions(options) : undefined;
  navigator.geolocation.getCurrentPosition(successCallback, errorCallback, standardOptions);
}
