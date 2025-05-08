import React from 'react';
import { motion } from "framer-motion";
import { User, LinkIcon, MoreVertical, Trash2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import EmojiRenderer from '../EmojiRenderer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface MessageItemProps {
  message: {
    id: string;
    sender_id: string;
    message: string;
    image_url?: string | null;
    created_at: string;
    is_unsent?: boolean;
    sender_profile?: {
      username: string | null;
      avatar_url: string | null;
    };
  };
  currentUserId: string;
  formatMessageTime: (timestamp: string) => string;
  onUnsendMessage?: (messageId: string) => void;
  isProcessing: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentUserId,
  formatMessageTime,
  onUnsendMessage,
  isProcessing
}) => {
  const { t } = useLanguage();
  const isCurrentUser = message.sender_id === currentUserId;
  
  // Function to linkify text (convert URLs to clickable links)
  const linkifyText = (text: string) => {
    // Regex to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    if (!text.match(urlRegex)) {
      return <EmojiRenderer text={text} />;
    }
    
    // Split text by URLs and create array of text and link elements
    const parts = text.split(urlRegex);
    const matches = text.match(urlRegex) || [];
    
    return (
      <p>
        {parts.map((part, i) => {
          // If this part is a URL (from the matches array), render it as a link
          if (i < parts.length - 1 && i < matches.length) {
            return (
              <React.Fragment key={i}>
                <EmojiRenderer text={part} />
                <a 
                  href={matches[i]} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center"
                >
                  {matches[i]}
                  <LinkIcon className="h-3 w-3 ml-1 inline" />
                </a>
              </React.Fragment>
            );
          }
          // Otherwise render as regular text
          return <EmojiRenderer key={`text-${i}`} text={part} />;
        })}
      </p>
    );
  };
  
  // Handle image loading for scroll adjustment
  const handleImageLoad = () => {
    // This will be handled by the parent component
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('message-image-loaded'));
    }
  };

  return (
    <motion.div
      key={message.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 group ${
        isCurrentUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      <Avatar className="h-8 w-8 ring-2 ring-offset-2 ring-offset-cosmic-900 ring-primary/20 flex-shrink-0 mt-1">
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
      <div className={`max-w-[70%] space-y-1 ${
        isCurrentUser ? 'items-end' : 'items-start'
      }`}>
        <div className="flex items-start">
          <div className={`rounded-2xl px-4 py-2 ${
            message.is_unsent 
              ? 'bg-cosmic-800/30 text-cosmic-400 italic' 
              : isCurrentUser
                ? 'bg-primary text-white' 
                : 'bg-cosmic-800/50 text-cosmic-100'
          }`}>
            {linkifyText(message.message)}
            
            {/* Display image if present with onLoad handler */}
            {message.image_url && (
              <div className="mt-2">
                <a 
                  href={message.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img 
                    src={message.image_url}
                    alt={t("Shared image", "分享的图片")}
                    className="max-w-full rounded-lg border border-cosmic-700/30 max-h-[200px] object-contain"
                    onLoad={handleImageLoad}
                  />
                </a>
              </div>
            )}
          </div>
          
          {/* Message actions dropdown - only show for user's messages that aren't unsent */}
          {isCurrentUser && !message.is_unsent && onUnsendMessage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-full ml-1 opacity-0 group-hover:opacity-100 hover:bg-cosmic-800/50"
                >
                  <MoreVertical className="h-4 w-4 text-cosmic-400" />
                  <span className="sr-only">{t("Message actions", "消息操作")}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isCurrentUser ? "end" : "start"} className="bg-cosmic-900/95 border-cosmic-700 z-50">
                <DropdownMenuItem
                  className="flex gap-2 text-red-500 cursor-pointer"
                  onClick={() => {
                    if (!isProcessing && onUnsendMessage) {
                      onUnsendMessage(message.id);
                    }
                  }}
                  disabled={isProcessing}
                >
                  <Trash2 className="h-4 w-4" />
                  {t("Unsend", "撤回")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className={`flex items-center gap-2 text-xs text-cosmic-400 ${
          isCurrentUser ? 'flex-row-reverse' : 'flex-row'
        }`}>
          <span>{message.sender_profile?.username || t("User", "用户")}</span>
          <span>•</span>
          <span>{formatMessageTime(message.created_at)}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageItem;
