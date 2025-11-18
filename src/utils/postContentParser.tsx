import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ParsedContentProps {
  content: string;
  onHashtagClick?: (hashtag: string) => void;
}

export const ParsedPostContent: React.FC<ParsedContentProps> = ({ 
  content, 
  onHashtagClick 
}) => {
  const navigate = useNavigate();

  const parseContent = (text: string) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Regex to match @mentions and #hashtags
    const regex = /(@[\w]+)|(\#[\w]+)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchText = match[0];
      const matchIndex = match.index;

      // Add text before the match
      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }

      // Add the matched mention or hashtag
      if (matchText.startsWith('@')) {
        const username = matchText.substring(1);
        parts.push(
          <span
            key={matchIndex}
            className="text-primary font-medium cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              // Search for user by username and navigate to their profile
              handleMentionClick(username);
            }}
          >
            {matchText}
          </span>
        );
      } else if (matchText.startsWith('#')) {
        const hashtag = matchText.substring(1);
        parts.push(
          <span
            key={matchIndex}
            className="text-primary font-medium cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              if (onHashtagClick) {
                onHashtagClick(hashtag);
              }
            }}
          >
            {matchText}
          </span>
        );
      }

      lastIndex = matchIndex + matchText.length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const handleMentionClick = async (username: string) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (error || !data) {
        console.error('User not found:', username);
        return;
      }

      navigate(`/user/${data.id}`);
    } catch (error) {
      console.error('Error finding user:', error);
    }
  };

  return <>{parseContent(content)}</>;
};

export const extractHashtags = (text: string): string[] => {
  const hashtags: string[] = [];
  const regex = /#([\w]+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    hashtags.push(match[1]);
  }

  return hashtags;
};

export const extractMentions = (text: string): string[] => {
  const mentions: string[] = [];
  const regex = /@([\w]+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    mentions.push(match[1]);
  }

  return mentions;
};
