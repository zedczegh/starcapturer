
import React, { useEffect, useRef } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConversationPartner } from '@/hooks/messaging/useConversations';
import MessageItem from './message/MessageItem';
import MessageHeader from './message/MessageHeader';
import EmptyMessages from './message/EmptyMessages';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MessageListProps {
  messages: any[];
  currentUserId: string;
  activeConversation: ConversationPartner;
  onBack: () => void;
  onUnsendMessage: (id: string) => Promise<boolean>;
  isMobile?: boolean; // Added prop for mobile-specific UI
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  activeConversation,
  onBack,
  onUnsendMessage,
  isMobile
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Add event listener for image loading to adjust scroll
  useEffect(() => {
    const handleImageLoad = () => {
      scrollToBottom();
    };
    
    window.addEventListener('message-image-loaded', handleImageLoad);
    
    return () => {
      window.removeEventListener('message-image-loaded', handleImageLoad);
    };
  }, []);
  
  return (
    <div className="flex flex-col h-full overflow-hidden bg-gradient-to-b from-cosmic-900/40 to-cosmic-950/40">
      <MessageHeader 
        conversation={activeConversation} 
        onBack={onBack}
        isMobile={isMobile}
      />
      
      <ScrollArea className="flex-1 p-4 pt-6">
        <div className="space-y-2">
          {messages.length === 0 ? (
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
