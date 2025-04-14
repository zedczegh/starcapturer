
/**
 * Map service URL generators for various mapping platforms
 */

import { wgs84ToGcj02 } from './coordinateConversion';

/**
 * Get a URL for directions to a location using Gaode Maps
 * This works within China without VPN
 */
export const generateGaodeMapUrl = (
  lat: number, 
  lng: number, 
  name: string
): string => {
  // Convert to GCJ-02 for Gaode Maps
  const { lat: gcjLat, lng: gcjLng } = wgs84ToGcj02(lat, lng);
  
  // Encode the location name
  const encodedName = encodeURIComponent(name);
  
  return `https://uri.amap.com/marker?position=${gcjLng},${gcjLat}&name=${encodedName}`;
};

/**
 * Get a URL for directions to a location using Google Maps
 * This works better for international users
 */
export const generateGoogleMapUrl = (
  lat: number, 
  lng: number, 
  name: string
): string => {
  const encodedName = encodeURIComponent(name);
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodedName}`;
};

/**
 * Get a URL for directions to a location using Baidu Maps
 * This works within China without VPN
 */
export const generateBaiduMapUrl = (
  lat: number, 
  lng: number, 
  name: string
): string => {
  // Convert to GCJ-02 for Baidu Maps
  const { lat: gcjLat, lng: gcjLng } = wgs84ToGcj02(lat, lng);
  
  // Encode the location name
  const encodedName = encodeURIComponent(name);
  
  return `https://api.map.baidu.com/marker?location=${gcjLat},${gcjLng}&title=${encodedName}&output=html`;
};

/**
 * Get a URL for directions to a location using Apple Maps
 * For iOS devices
 */
export const generateAppleMapUrl = (
  lat: number, 
  lng: number, 
  name: string
): string => {
  const encodedName = encodeURIComponent(name);
  return `https://maps.apple.com/?q=${encodedName}&ll=${lat},${lng}&z=15`;
};
