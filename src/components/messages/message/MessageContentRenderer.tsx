
import React from 'react';
import LocationShareCard from '@/components/messages/LocationShareCard';
import EmojiRenderer from '@/components/messages/EmojiRenderer';
import { isLocationPayload } from '@/utils/messageUtils';

interface MessageContentRendererProps {
  content: string;
  payload?: any;
}

const MessageContentRenderer: React.FC<MessageContentRendererProps> = ({ 
  content, 
  payload
}) => {
  // First, check if we have a location payload - special rendering
  if (payload && isLocationPayload(payload)) {
    return (
      <div className="mb-2">
        <LocationShareCard 
          id={payload.id}
          name={payload.name}
          latitude={payload.latitude}
          longitude={payload.longitude}
          siqs={payload.siqs}
          timestamp={payload.timestamp || new Date().toISOString()}
          isCertified={payload.certification || payload.isDarkSkyReserve}
        />
        {content && <div className="mt-2 text-sm">{content}</div>}
      </div>
    );
  }
  
  // Regular text message with emoji support
  return (
    <div className="whitespace-pre-wrap break-words">
      <EmojiRenderer text={content} />
    </div>
  );
};

export default MessageContentRenderer;
