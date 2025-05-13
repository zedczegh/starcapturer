
import { useLanguage } from "@/contexts/LanguageContext";
import { extractLocationFromUrl } from '@/utils/locationLinkParser';

/**
 * Format message text for conversation preview 
 * @param message - The raw message text
 * @param t - Translation function
 * @returns Formatted message preview text
 */
export const formatMessagePreview = (message: string, t: (en: string, zh: string) => string): string => {
  if (!message) return "";
  
  // Check if the message is a JSON string containing location data
  if (message.startsWith('{"type":"location"')) {
    try {
      const parsedData = JSON.parse(message);
      if (parsedData.type === 'location' && parsedData.data) {
        return t("📍 Shared a location", "📍 分享了位置");
      }
    } catch (e) {
      // Not valid JSON, continue with other checks
    }
  }
  
  // Check if message contains a location link
  const extractedLocation = extractLocationFromUrl(message);
  if (extractedLocation) {
    if (extractedLocation.isAstroSpot) {
      return t("🔭 AstroSpot", "🔭 观星点");
    } else {
      return t("📍 Shared a location", "📍 分享了位置");
    }
  }
  
  // If it's a regular message, return it (truncated if needed)
  if (message.length > 30) {
    return message.substring(0, 30) + "...";
  }
  
  return message;
};

/**
 * Hook wrapper for formatMessagePreview with translation context
 */
export const useMessageFormatter = () => {
  const { t } = useLanguage();
  
  return {
    formatMessagePreview: (message: string) => formatMessagePreview(message, t)
  };
};
