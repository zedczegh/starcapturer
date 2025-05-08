
import React from 'react';
import { siqsEmojis } from "./SiqsEmojiData";

interface EmojiRendererProps {
  text: string;
  inline?: boolean;
}

const EmojiRenderer: React.FC<EmojiRendererProps> = ({ text, inline = false }) => {
  // Split text by emoji tags and render them accordingly
  const renderTextWithEmojis = () => {
    if (!text) return null;
    
    // Regex to match our emoji format [emoji-id]
    const regex = /\[(stellar-star|happy-moon|curious-cloud|content-observer|worried-weather|sad-satellite)\]/g;
    
    // If the text is just an emoji tag, only render the emoji
    if (regex.test(text) && text.trim().match(regex)?.[0] === text.trim()) {
      const emojiId = text.trim().replace('[', '').replace(']', '');
      const emoji = siqsEmojis.find(e => e.id === emojiId);
      
      if (emoji) {
        return (
          <span className="inline-block align-middle mx-0.5" title={emoji.description}>
            {emoji.icon}
          </span>
        );
      }
    }
    
    // Reset regex state after test
    regex.lastIndex = 0;
    
    // Split the text into parts that are either text or emoji tags
    const parts = text.split(regex);
    const matches = text.match(regex) || [];
    
    return (
      <>
        {parts.map((part, i) => {
          // If this is just text, render it as is
          if (i === 0 || !matches[i - 1]) {
            return part;
          }
          
          // If this is an emoji tag, render only the emoji icon (skip the text part)
          const emojiId = matches[i - 1].replace('[', '').replace(']', '');
          const emoji = siqsEmojis.find(e => e.id === emojiId);
          
          if (!emoji) return part;
          
          return (
            <React.Fragment key={i}>
              <span className="inline-block align-middle mx-0.5" title={emoji.description}>
                {emoji.icon}
              </span>
            </React.Fragment>
          );
        })}
      </>
    );
  };

  return <span className={inline ? "inline" : ""}>{renderTextWithEmojis()}</span>;
};

export default EmojiRenderer;
