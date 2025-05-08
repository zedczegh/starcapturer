
import React from 'react';
import { siqsEmojis } from "./SiqsEmojiData";

interface EmojiRendererProps {
  text: string;
  inline?: boolean;
}

const EmojiRenderer: React.FC<EmojiRendererProps> = ({ text, inline = false }) => {
  // If no text is provided, return null
  if (!text) return null;
  
  // Regular expression to match emoji tags [emoji-id]
  const emojiRegex = /\[([\w-]+)\]/g;
  
  // Check if the text is just a single emoji
  if (text.trim().match(/^\[([\w-]+)\]$/)) {
    const emojiId = text.trim().replace('[', '').replace(']', '');
    const emoji = siqsEmojis.find(e => e.id === emojiId);
    
    if (emoji) {
      return (
        <span className="inline-block align-middle" title={emoji.description}>
          {emoji.icon}
        </span>
      );
    }
  }
  
  // Split the text by emoji tags and render both text and emojis
  const parts = [];
  let lastIndex = 0;
  let match;
  
  // Clone the regex to reset lastIndex
  const regex = new RegExp(emojiRegex);
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before the emoji
    if (match.index > lastIndex) {
      parts.push(
        <React.Fragment key={`text-${lastIndex}`}>
          {text.substring(lastIndex, match.index)}
        </React.Fragment>
      );
    }
    
    // Find and add the emoji
    const emojiId = match[1];
    const emoji = siqsEmojis.find(e => e.id === emojiId);
    
    if (emoji) {
      parts.push(
        <span key={`emoji-${match.index}`} className="inline-block align-middle mx-0.5" title={emoji.description}>
          {emoji.icon}
        </span>
      );
    } else {
      // If emoji not found, just add the original tag
      parts.push(
        <React.Fragment key={`unknown-${match.index}`}>
          {match[0]}
        </React.Fragment>
      );
    }
    
    lastIndex = regex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      <React.Fragment key={`text-end`}>
        {text.substring(lastIndex)}
      </React.Fragment>
    );
  }
  
  return <span className={inline ? "inline" : ""}>{parts}</span>;
};

export default EmojiRenderer;
