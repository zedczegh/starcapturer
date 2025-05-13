import React from 'react';
import { siqsEmojis } from './SiqsEmojiData';
import { extractLocationFromUrl } from '@/utils/locationLinkParser';
import { useLanguage } from '@/contexts/LanguageContext';

interface EmojiRendererProps {
  text: string;
  inline?: boolean;
}

const EmojiRenderer: React.FC<EmojiRendererProps> = ({ text, inline = false }) => {
  const { t } = useLanguage();
  
  if (!text) return null;

  // Check if text contains a location link
  const extractedLocation = extractLocationFromUrl(text);
  if (extractedLocation) {
    if (inline) {
      // For conversation list previews, just return a simple text
      if (extractedLocation.isAstroSpot) {
        return <span>🔭 {t("Shared an AstroSpot", "分享了观星点")}</span>;
      } else {
        return <span>📍 {t("Shared a location", "分享了位置")}</span>;
      }
    }
    // For full message display, the LocationShareCard will be handled by MessageItem component
  }
  
  // Check if text is a location JSON object
  if (text.startsWith('{"type":"location"')) {
    try {
      const parsedData = JSON.parse(text);
      if (parsedData.type === 'location' && parsedData.data) {
        if (inline) {
          return <span>📍 {t("Shared a location", "分享了位置")}</span>;
        }
        // For full message display, the location data will be handled by MessageItem component
        return null;
      }
    } catch (e) {
      // Not valid JSON, continue with emoji processing
    }
  }

  // Process emoji tags
  const emojiRegex = /\[([\w-]+)\]/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = emojiRegex.exec(text)) !== null) {
    // Add text before the emoji
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Find the emoji by id
    const emojiId = match[1];
    const emoji = siqsEmojis.find(e => e.id === emojiId);
    
    if (emoji) {
      // Add the emoji
      parts.push(
        <span key={`${emojiId}-${match.index}`} 
              className={inline ? 'inline-block align-middle' : 'inline-block align-middle transform scale-125'} 
              title={emoji.name}>
          {emoji.icon}
        </span>
      );
    } else {
      // If emoji not found, keep the original text
      parts.push(match[0]);
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return <>{parts}</>;
};

export default EmojiRenderer;
