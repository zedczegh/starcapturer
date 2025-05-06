
import React from 'react';
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import MessageBubble from './MessageBubble';
import { Message } from '@/hooks/messaging/types';

interface MessageDateGroupProps {
  date: string;
  messages: Message[];
  currentUserId: string;
}

const MessageDateGroup: React.FC<MessageDateGroupProps> = ({ date, messages, currentUserId }) => {
  const { t } = useLanguage();

  // Format date labels
  const formatDateLabel = (dateStr: string) => {
    const messageDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return t("Today", "今天");
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return t("Yesterday", "昨天");
    } else {
      return format(messageDate, "MMM d, yyyy");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="text-xs text-cosmic-400 bg-cosmic-800/30 px-3 py-1 rounded-full">
          {formatDateLabel(date)}
        </div>
      </div>
      
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          currentUserId={currentUserId}
          index={index}
        />
      ))}
    </div>
  );
};

export default MessageDateGroup;
