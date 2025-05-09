
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConversationPartner } from '@/hooks/messaging/useConversations';
import MessageItem from './message/MessageItem';
import MessageHeader from './message/MessageHeader';
import EmptyMessages from './message/EmptyMessages';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader } from 'lucide-react';

interface MessageListProps {
  messages: any[];
  currentUserId: string;
  activeConversation: ConversationPartner;
  onBack: () => void;
  onUnsendMessage: (id: string) => Promise<boolean>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  activeConversation,
  onBack,
  onUnsendMessage
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };
  
  // Initial load and message changes
  useEffect(() => {
    if (messages.length > 0) {
      if (isInitialLoad) {
        // Use instant scroll for initial load
        scrollToBottom('auto');
        // Delay setting initial load to false for smoother UI
        const timer = setTimeout(() => setIsInitialLoad(false), 300);
        return () => clearTimeout(timer);
      } else {
        // Smooth scroll for new messages
        scrollToBottom();
      }
    }
  }, [messages, isInitialLoad]);
  
  // Handle image loading
  useEffect(() => {
    const handleImageLoad = () => {
      // Only smooth scroll for image loads after initial render
      if (!isInitialLoad) {
        scrollToBottom();
      }
    };
    
    window.addEventListener('message-image-loaded', handleImageLoad);
    return () => {
      window.removeEventListener('message-image-loaded', handleImageLoad);
    };
  }, [isInitialLoad]);
  
  // Handle scroll events to update UI state
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolling(true);
    
    if (scrollTimeoutRef.current !== null) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsScrolling(false);
      scrollTimeoutRef.current = null;
    }, 200);
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <div className="flex flex-col h-full overflow-hidden bg-gradient-to-b from-cosmic-900/40 to-cosmic-950/40">
      <MessageHeader 
        conversation={activeConversation} 
        onBack={onBack}
      />
      
      <ScrollArea 
        className="flex-1 p-4 pt-6 scrollbar-hide" 
        onScrollCapture={handleScroll}
      >
        <div className="space-y-2">
          {isInitialLoad && messages.length > 5 ? (
            <div className="flex justify-center py-4">
              <Loader className="h-5 w-5 animate-spin text-primary/70" />
            </div>
          ) : messages.length === 0 ? (
            <EmptyMessages />
          ) : (
            <>
              {messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  isSender={message.sender_id === currentUserId}
                  onUnsend={onUnsendMessage}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MessageList;
