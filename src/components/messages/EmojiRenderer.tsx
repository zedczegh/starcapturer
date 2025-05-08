
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
          
          // If this is an emoji tag, render the corresponding emoji
          const emojiId = matches[i - 1].replace('[', '').replace(']', '');
          const emoji = siqsEmojis.find(e => e.id === emojiId);
          
          if (!emoji) return part;
          
          return (
            <React.Fragment key={i}>
              {part}
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
