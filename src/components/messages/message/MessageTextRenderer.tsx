import React from 'react';
import { useNavigate } from 'react-router-dom';
import EmojiRenderer from '../EmojiRenderer';

interface MessageTextRendererProps {
  text: string;
}

export const MessageTextRenderer: React.FC<MessageTextRendererProps> = ({ text }) => {
  const navigate = useNavigate();

  // URL regex pattern that matches http(s) URLs
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  
  // Check if text contains URLs
  const hasUrls = urlPattern.test(text);
  
  if (!hasUrls) {
    // No URLs, just render with emoji support
    return <EmojiRenderer text={text} />;
  }

  // Split text by URLs
  const parts = text.split(urlPattern);
  
  return (
    <>
      {parts.map((part, index) => {
        // Check if this part is a URL
        if (part.match(urlPattern)) {
          // Check if it's an internal post link
          const isInternalLink = part.includes(window.location.origin + '/profile/');
          
          if (isInternalLink) {
            // Extract the path for internal navigation
            const url = new URL(part);
            const internalPath = url.pathname + url.search;
            
            return (
              <span
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(internalPath);
                }}
                className="text-primary hover:text-primary-focus underline cursor-pointer transition-colors"
              >
                {part}
              </span>
            );
          } else {
            // External link
            return (
              <a
                key={index}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-primary hover:text-primary-focus underline transition-colors"
              >
                {part}
              </a>
            );
          }
        } else {
          // Regular text with emoji support
          return <EmojiRenderer key={index} text={part} />;
        }
      })}
    </>
  );
};
