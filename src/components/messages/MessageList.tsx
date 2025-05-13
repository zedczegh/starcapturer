
import React, { useEffect, useRef, memo, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConversationPartner } from '@/hooks/messaging/useConversations';
import MessageItem from './message/MessageItem';
import MessageHeader from './message/MessageHeader';
import EmptyMessages from './message/EmptyMessages';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';

interface MessageListProps {
  messages: any[];
  currentUserId: string;
  activeConversation: ConversationPartner;
  onBack: () => void;
  onUnsendMessage: (id: string) => Promise<boolean>;
}

// Memoize the MessageItem to prevent unnecessary re-renders
const MemoizedMessageItem = memo(MessageItem);

const MessageList: React.FC<MessageListProps> = memo(({
  messages,
  currentUserId,
  activeConversation,
  onBack,
  onUnsendMessage
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // Add event listener for image loading to adjust scroll
  useEffect(() => {
    const handleImageLoad = () => {
      scrollToBottom();
    };
    
    window.addEventListener('message-image-loaded', handleImageLoad);
    
    return () => {
      window.removeEventListener('message-image-loaded', handleImageLoad);
    };
  }, [scrollToBottom]);
  
  return (
    <div className="flex flex-col h-full overflow-hidden bg-gradient-to-b from-cosmic-900/40 to-cosmic-950/40">
      <MessageHeader 
        conversation={activeConversation} 
        onBack={onBack}
      />
      
      <ScrollArea className="flex-1 p-4 pt-6 pb-1">
        <div className="space-y-2 min-h-[calc(100%-90px)]">
          {messages.length === 0 ? (
            <EmptyMessages />
          ) : (
            <>
              {messages.map((message) => (
                <MemoizedMessageItem
                  key={message.id}
                  message={message}
                  isSender={message.sender_id === currentUserId}
                  onUnsend={onUnsendMessage}
                />
              ))}
              <div ref={messagesEndRef} className="h-2 mb-16" />
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
});

export default MessageList;
