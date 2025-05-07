/**
 * Utility functions for managing Leaflet map markers, including icon updates and color changes
 */

import L from 'leaflet';
import { getSiqsColorClass } from '@/utils/mapSiqsDisplay';
import { formatSiqsScore, getSiqsScore } from "@/utils/siqsHelpers";

/**
 * Updates the marker color based on the SIQS score
 * @param marker The marker to update
 * @param score The SIQS score (numeric value)
 */
export const updateMarkerColor = (marker: any, score: number) => {
  try {
    if (!marker || !marker.getElement()) return;
    
    const element = marker.getElement();
    if (!element) return;
    
    const innerElement = element.querySelector('.marker-inner');
    if (!innerElement) return;
    
    // Remove existing color classes
    innerElement.classList.remove(
      'text-green-500',
      'text-lime-500',
      'text-yellow-500',
      'text-orange-500',
      'text-red-500',
      'text-muted-foreground'
    );
    
    // Add the new color class based on score
    innerElement.classList.add(getSiqsColorClass(score));
  } catch (error) {
    console.error("Error updating marker color:", error);
  }
};

/**
 * Updates the marker SIQS display with the latest score
 * @param marker The marker to update
 * @param score The new SIQS score (numeric value)
 */
export const updateMarkerSiqs = (marker: any, score: number | any) => {
  try {
    if (!marker || !marker.getElement()) return;
    
    const element = marker.getElement();
    if (!element) return;
    
    const scoreElement = element.querySelector('.marker-inner');
    if (!scoreElement) return;
    
    // Get the numeric SIQS score
    const numericScore = getSiqsScore(score);
    
    // Update the text content
    scoreElement.textContent = formatSiqsScore(numericScore);
    
    // Update the color class based on score
    updateMarkerColor(marker, numericScore);
    
  } catch (error) {
    console.error("Error updating marker SIQS:", error);
  }
};

/**
 * Updates the marker icon with the new HTML
 * @param marker The marker to update
 * @param html The new HTML for the icon
 */
export const updateMarkerIcon = (marker: L.Marker, html: string) => {
  try {
    if (!marker) return;
    
    const newIcon = L.divIcon({
      className: 'custom-marker',
      html: html,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    
    marker.setIcon(newIcon);
  } catch (error) {
    console.error("Error updating marker icon:", error);
  }
};
