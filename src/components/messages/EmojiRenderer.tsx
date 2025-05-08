
import React from 'react';
import { siqsEmojis } from './SiqsEmojiData';

interface EmojiRendererProps {
  text: string;
}

const EmojiRenderer: React.FC<EmojiRendererProps> = ({ text }) => {
  if (!text) return null;
  
  // Split the text on emoji tags like [siqs-1], [sun], etc.
  const parts = text.split(/(\[[a-zA-Z0-9_-]+\])/g);
  
  return (
    <>
      {parts.map((part, index) => {
        // Check if this part is an emoji tag
        if (part.match(/^\[[a-zA-Z0-9_-]+\]$/)) {
          const emojiId = part.slice(1, -1); // Remove the square brackets
          const emoji = siqsEmojis.find(e => e.id === emojiId);
          
          if (emoji) {
            // Render the emoji icon if found in emoji data
            return <span key={`emoji-${index}`}>{emoji.icon}</span>;
          }
        }
        
        // Return the text part if it's not an emoji or the emoji wasn't found
        return part ? <span key={`text-${index}`}>{part}</span> : null;
      })}
    </>
  );
};

export default EmojiRenderer;
