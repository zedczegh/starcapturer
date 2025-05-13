
import { extractLocationFromUrl } from '@/utils/locationLinkParser';

/**
 * Parse message data from API response into formatted message objects
 * @param msg - Raw message data from API
 * @returns Formatted message object with processed text and location data
 */
export const parseMessageData = (msg: any) => {
  // Parse location from message JSON if it exists
  let locationData = null;
  if (msg.message && msg.message.startsWith('{"type":"location"')) {
    try {
      const parsedData = JSON.parse(msg.message);
      if (parsedData.type === 'location' && parsedData.data) {
        locationData = parsedData.data;
        console.log("Parsed location data from JSON:", locationData);
      }
    } catch (e) {
      console.error("Failed to parse location data:", e);
    }
  }
  
  // Check if text message contains a location link
  if (!locationData && msg.message) {
    const extractedLocation = extractLocationFromUrl(msg.message);
    if (extractedLocation) {
      locationData = extractedLocation;
      console.log("Location extracted from URL:", locationData);
      // When location is extracted from a URL, set text to empty to hide the raw URL
      return {
        id: msg.id,
        sender_id: msg.sender_id,
        receiver_id: msg.receiver_id,
        text: '', // Clear the raw URL from display
        created_at: msg.created_at,
        image_url: msg.image_url,
        location: extractedLocation, // Use extracted location data
        read: msg.read // Include read status for checkmark functionality
      };
    }
  }
  
  return {
    id: msg.id,
    sender_id: msg.sender_id,
    receiver_id: msg.receiver_id,
    text: locationData ? '' : msg.message, // If it's a location message, set text to empty
    created_at: msg.created_at,
    image_url: msg.image_url,
    location: locationData, // Use parsed location data
    read: msg.read // Include read status for checkmark functionality
  };
};
