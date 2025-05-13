import React, { memo } from 'react';
import { motion } from "framer-motion";
import { User, Trash2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import EmojiRenderer from '../EmojiRenderer';
import { ConversationPartner } from '@/hooks/messaging/types';

interface ConversationItemProps {
  conversation: ConversationPartner;
  isActive: boolean;
  onSelect: () => void;
  onDeleteClick: (e: React.MouseEvent) => void;
  isMobile: boolean;
  formatMessageTime: (timestamp: string) => string;
  isProcessingAction: boolean;
}

const ConversationItem = memo(({
  conversation,
  isActive,
  onSelect,
  onDeleteClick,
  isMobile,
  formatMessageTime,
  isProcessingAction
}: ConversationItemProps) => (
  <motion.div
    key={conversation.id}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.2 }}
    onClick={onSelect}
    className={`${isMobile ? 'p-2' : 'p-3'} rounded-xl cursor-pointer transition-all flex items-center gap-2 
      hover:bg-primary/5 border border-transparent group
      ${isActive 
        ? 'bg-primary/10 border-primary/20 shadow-lg' 
        : 'hover:border-cosmic-700/30'
      }`}
  >
    <div className="relative">
      <Avatar className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12'} ring-2 ring-offset-2 ring-offset-cosmic-900 ring-primary/20`}>
        {conversation.avatar_url ? (
          <AvatarImage
            src={conversation.avatar_url}
            alt={conversation.username || "User"}
            className="object-cover"
          />
        ) : (
          <AvatarFallback className="bg-primary/10">
            <User className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-primary`} />
          </AvatarFallback>
        )}
      </Avatar>
      {conversation.unread_count > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-white rounded-full w-5 h-5 
          flex items-center justify-center text-xs font-medium shadow-lg
          ring-2 ring-cosmic-900">
          {conversation.unread_count}
        </span>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center">
        <p className={`font-medium text-white truncate ${isMobile ? 'text-sm' : ''}`}>
          {conversation.username || "User"}
        </p>
        <span className={`text-cosmic-400 ${isMobile ? 'text-xs' : 'text-xs'}`}>
          {formatMessageTime(conversation.last_message_time)}
        </span>
      </div>
      <div className={`text-cosmic-300 truncate mt-0.5 ${isMobile ? 'text-xs' : 'text-sm'}`}>
        <EmojiRenderer text={conversation.last_message} inline />
      </div>
    </div>
    <Button
      variant="ghost"
      size="icon"
      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-cosmic-400 hover:text-red-500 hover:bg-red-500/10"
      onClick={onDeleteClick}
      disabled={isProcessingAction}
    >
      <Trash2 className="h-4 w-4" />
      <span className="sr-only">Delete conversation</span>
    </Button>
  </motion.div>
));

export default ConversationItem;
