
import React, { useRef, useEffect } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import MessageHeader from './MessageHeader';
import MessageDateGroup from './MessageDateGroup';
import EmptyMessages from './EmptyMessages';
import { Message } from '@/hooks/messaging/types';

interface ConversationPartner {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  activeConversation: ConversationPartner;
  onBack: () => void;
  isMobile?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  activeConversation,
  onBack,
  isMobile = false
}) => {
  const { t } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [prevMessagesLength, setPrevMessagesLength] = React.useState(messages.length);

  useEffect(() => {
    // Only scroll to bottom for new messages or initial load
    if (messages.length > prevMessagesLength || prevMessagesLength === 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    setPrevMessagesLength(messages.length);
  }, [messages.length, prevMessagesLength]);

  // Group messages by day
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <div className="flex flex-col h-full">
      <MessageHeader 
        activeConversation={activeConversation}
        onBack={onBack}
      />

      <div ref={messageContainerRef} className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4">
        {messages.length === 0 ? (
          <EmptyMessages />
        ) : (
          Object.keys(groupedMessages).map(date => (
            <MessageDateGroup 
              key={date} 
              date={date} 
              messages={groupedMessages[date]} 
              currentUserId={currentUserId} 
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;
