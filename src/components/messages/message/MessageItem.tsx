
import React, { useState } from 'react';
import { formatRelative } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import EmojiRenderer from '../EmojiRenderer';
import { MoreVertical, CheckCheck, Check } from 'lucide-react';
import UnsendDialog from './UnsendDialog';
import { Button } from '@/components/ui/button';
import LocationShareCard from '../LocationShareCard';

interface MessageItemProps {
  message: any;
  isSender: boolean;
  onUnsend: (id: string) => void;
  isProcessingAction?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isSender,
  onUnsend,
  isProcessingAction = false
}) => {
  const { language } = useLanguage();
  const [showUnsendDialog, setShowUnsendDialog] = useState(false);
  
  const locale = language === 'zh' ? zhCN : enUS;
  const messageDate = new Date(message.created_at);
  
  const formattedDate = formatRelative(messageDate, new Date(), {
    locale,
  });

  const hasContent = message.text || message.image_url || message.location;
  
  if (!hasContent) return null;
  
  return (
    <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className="max-w-[75%]">
        <div
          className={`relative group rounded-2xl p-3 ${
            isSender
              ? 'bg-primary/90 text-white rounded-tr-none'
              : 'bg-cosmic-800/40 text-cosmic-100 rounded-tl-none'
          }`}
        >
          {isSender && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-3 -right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-cosmic-900/50 text-cosmic-300 hover:text-cosmic-100 hover:bg-cosmic-800/70"
              onClick={() => setShowUnsendDialog(true)}
              disabled={isProcessingAction}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Message options</span>
            </Button>
          )}
          
          {message.text && (
            <div className="mb-2 whitespace-pre-wrap">
              <EmojiRenderer text={message.text} />
            </div>
          )}
          
          {message.image_url && (
            <div className="mt-2">
              <img
                src={message.image_url}
                alt="Message attachment"
                className="w-full h-auto rounded-lg"
                style={{ maxHeight: '200px', objectFit: 'cover' }}
                onLoad={() => {
                  // Dispatch a custom event when an image loads to trigger scroll adjustment
                  window.dispatchEvent(new Event('message-image-loaded'));
                }}
              />
            </div>
          )}
          
          {message.location && (
            <div className="mt-2">
              <LocationShareCard 
                name={message.location.name}
                latitude={message.location.latitude}
                longitude={message.location.longitude}
                timestamp={message.location.timestamp}
                siqs={message.location.siqs}
                spotId={message.location.spotId}
                isAstroSpot={message.location.isAstroSpot}
                fromLink={message.location.fromLink}
              />
            </div>
          )}
        </div>
        
        <div
          className={`flex items-center text-xs text-gray-500 mt-1 ${
            isSender ? 'justify-end' : 'justify-start'
          }`}
        >
          {/* Message read status indicators with improved styling */}
          {isSender && (
            <span className="mr-2 flex items-center">
              {message.read ? (
                <CheckCheck className="h-3 w-3 text-green-500 drop-shadow-sm" />
              ) : (
                <Check className="h-3 w-3 text-cosmic-400 opacity-75" />
              )}
            </span>
          )}
          {formattedDate}
        </div>
      </div>
      
      {showUnsendDialog && (
        <UnsendDialog
          open={showUnsendDialog}
          onOpenChange={(isOpen) => {
            if (!isProcessingAction && !isOpen) {
              setShowUnsendDialog(false);
            }
          }}
          onUnsend={() => {
            onUnsend(message.id);
            setShowUnsendDialog(false);
          }}
          onCancel={() => setShowUnsendDialog(false)}
          isProcessing={isProcessingAction}
        />
      )}
    </div>
  );
};

export default MessageItem;
