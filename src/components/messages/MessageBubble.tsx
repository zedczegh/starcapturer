
import React from 'react';
import { format } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { motion } from "framer-motion";
import MessageStatus from './MessageStatus';
import { Message } from '@/hooks/messaging/types';

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
  index: number;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, currentUserId, index }) => {
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return format(date, "h:mm a");
    } else {
      return format(date, "MMM d, h:mm a");
    }
  };

  const isCurrentUser = message.sender_id === currentUserId;
  const isShortMessage = message.message.length < 10;

  const staggerVariants = {
    hidden: { opacity: 0 },
    visible: (i: number) => ({
      opacity: 1,
      transition: {
        delay: i * 0.05,
        duration: 0.1
      }
    })
  };

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={staggerVariants}
      className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <Avatar className="h-8 w-8 ring-2 ring-offset-2 ring-offset-cosmic-900 ring-primary/20 flex-shrink-0">
        {message.sender_profile?.avatar_url ? (
          <AvatarImage 
            src={message.sender_profile.avatar_url} 
            alt={message.sender_profile.username || "User"}
            className="object-cover"
          />
        ) : (
          <AvatarFallback className="bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </AvatarFallback>
        )}
      </Avatar>
      <div className={`max-w-[75%] space-y-1 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-2 ${
          isCurrentUser 
            ? 'bg-gradient-to-br from-primary/90 to-primary/70 text-white ml-auto shadow-lg shadow-primary/10' 
            : 'bg-cosmic-800/50 text-cosmic-100 rounded-tl-none'
        } ${isShortMessage ? 'rounded-full py-1.5' : ''}`}>
          <p className="break-words">{message.message}</p>
        </div>
        <div className={`flex items-center gap-1 text-xs text-cosmic-400 ${
          isCurrentUser ? 'justify-end' : 'justify-start'
        }`}>
          <span>{formatMessageTime(message.created_at)}</span>
          <MessageStatus message={message} currentUserId={currentUserId} />
        </div>
      </div>
    </motion.div>
  );
}

export default MessageBubble;
