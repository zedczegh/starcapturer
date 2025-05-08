
import React, { useEffect, useRef } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConversationPartner } from '@/hooks/messaging/useConversations';
import MessageItem from './message/MessageItem';
import MessageHeader from './message/MessageHeader';
import EmptyMessages from './message/EmptyMessages';

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
      />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2 pt-6">
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
    </div>
  );
};

export default MessageList;
