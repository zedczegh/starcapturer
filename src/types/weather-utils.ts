
/**
 * Type guard function to check if an object has a specific property
 * @param obj The object to check
 * @param prop The property name to check for
 * @returns True if the property exists on the object
 */
export function hasProperty<T extends object, K extends string>(
  obj: T,
  prop: K
): obj is T & Record<K, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 * Type guard to check if an object has a numeric property
 * @param obj The object to check
 * @param prop The property name to check for
 * @returns True if the property exists and is a number
 */
export function hasNumericProperty<T extends object, K extends string>(
  obj: T,
  prop: K
): obj is T & Record<K, number> {
  return hasProperty(obj, prop) && typeof obj[prop] === 'number';
}

/**
 * Type guard to check if an object has a string property
 * @param obj The object to check
 * @param prop The property name to check for
 * @returns True if the property exists and is a string
 */
export function hasStringProperty<T extends object, K extends string>(
  obj: T,
  prop: K
): obj is T & Record<K, string> {
  return hasProperty(obj, prop) && typeof obj[prop] === 'string';
}

/**
 * Weather data type with all the expected properties
 */
export interface WeatherData {
  temperature: number;
  humidity: number;
  cloudCover: number;
  windSpeed: number;
  precipitation: number;
  time: string;
  condition: string;
  weatherCondition?: string;
  aqi?: number;
  bortleScale?: number;
}

/**
 * Type guard to check if an object is a valid WeatherData object
 * @param obj The object to check
 * @returns True if the object matches the WeatherData interface
 */
export function isWeatherData(obj: unknown): obj is WeatherData {
  if (!obj || typeof obj !== 'object') return false;
  
  return (
    hasNumericProperty(obj, 'temperature') &&
    hasNumericProperty(obj, 'humidity') &&
    hasNumericProperty(obj, 'cloudCover') &&
    hasNumericProperty(obj, 'windSpeed') &&
    hasNumericProperty(obj, 'precipitation') &&
    hasStringProperty(obj, 'time') &&
    hasStringProperty(obj, 'condition')
  );
}
