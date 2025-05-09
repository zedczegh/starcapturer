
import React, { useState, useEffect } from 'react';
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
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const locale = language === 'zh' ? zhCN : enUS;
  const messageDate = new Date(message.created_at);
  
  const formattedDate = formatRelative(messageDate, new Date(), {
    locale,
  });

  const hasContent = message.text || message.image_url || message.location;
  
  // Effect to delay showing message options for smoother rendering
  useEffect(() => {
    // Prevent flash of options button on initial render
    const timer = setTimeout(() => {
      // Just a timing effect, no state changes needed
    }, 500);
    return () => clearTimeout(timer);
  }, []);
  
  if (!hasContent) return null;
  
  return (
    <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}>
      <div className="max-w-[75%] sm:max-w-[70%]">
        <div
          className={`relative group rounded-2xl p-3 ${
            isSender
              ? 'message-bubble-sender'
              : 'message-bubble-receiver'
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
            <div className={`mt-2 ${!imageLoaded ? 'lazy-fade-in' : 'lazy-fade-in loaded'}`}>
              <img
                src={message.image_url}
                alt="Message attachment"
                className="w-full h-auto rounded-lg"
                style={{ maxHeight: '200px', objectFit: 'cover' }}
                loading="lazy"
                onLoad={() => {
                  setImageLoaded(true);
                  // Dispatch event for scroll adjustment
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
              />
            </div>
          )}
        </div>
        
        <div
          className={`flex items-center text-xs text-gray-500 mt-1 ${
            isSender ? 'justify-end' : 'justify-start'
          }`}
        >
          {isSender && (
            <span className="mr-2 flex items-center">
              {message.read ? (
                <CheckCheck className="h-3 w-3 read-checkmark" />
              ) : (
                <Check className="h-3 w-3 unread-checkmark" />
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

export default React.memo(MessageItem);
