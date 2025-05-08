import React, { useRef, useEffect } from 'react';
import { motion } from "framer-motion";
import { ChevronLeft, User, MessageCircle, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import EmojiRenderer from './EmojiRenderer';

interface Message {
  id: string;
  sender_id: string;
  message: string;
  image_url?: string | null;
  created_at: string;
  sender_profile?: {
    username: string | null;
    avatar_url: string | null;
  };
}

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
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  activeConversation,
  onBack
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return format(date, "h:mm a");
    } else {
      return format(date, "MMM d, h:mm a");
    }
  };
  
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
          return <EmojiRenderer text={part} />;
        })}
      </p>
    );
  };

  // Improved scroll handling - called both on new messages AND when images load
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
    
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle scrolling when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle image loading to ensure scroll works after images load
  const handleImageLoad = () => {
    scrollToBottom();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-cosmic-800/50 bg-cosmic-900/50 flex items-center gap-3">
        <Button 
          variant="ghost" 
          className="md:hidden mr-2 text-cosmic-400 hover:text-white hover:bg-cosmic-800/50" 
          onClick={onBack}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-offset-cosmic-900 ring-primary/20">
          {activeConversation.avatar_url ? (
            <AvatarImage
              src={activeConversation.avatar_url}
              alt={activeConversation.username || "User"}
              className="object-cover"
            />
          ) : (
            <AvatarFallback className="bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-white text-lg">
            {activeConversation.username || t("User", "用户")}
          </h3>
          <Button
            variant="link"
            className="p-0 h-auto text-sm text-primary hover:text-primary/80"
            onClick={() => navigate(`/profile/${activeConversation.id}`)}
          >
            {t("View Profile", "查看资料")}
          </Button>
        </div>
      </div>

      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4" 
        ref={scrollAreaRef}
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-cosmic-400 space-y-2">
              <MessageCircle className="mx-auto h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">{t("No messages yet", "暂无消息")}</p>
              <p className="text-sm">
                {t("Send a message to start the conversation", "发送消息开始对话")}
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${
                message.sender_id === currentUserId ? 'flex-row-reverse' : 'flex-row'
              }`}
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
              <div className={`max-w-[70%] space-y-1 ${
                message.sender_id === currentUserId ? 'items-end' : 'items-start'
              }`}>
                <div className={`rounded-2xl px-4 py-2 ${
                  message.sender_id === currentUserId 
                    ? 'bg-primary text-white ml-auto' 
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
                <div className={`flex items-center gap-2 text-xs text-cosmic-400 ${
                  message.sender_id === currentUserId ? 'flex-row-reverse' : 'flex-row'
                }`}>
                  <span>{message.sender_profile?.username || t("User", "用户")}</span>
                  <span>•</span>
                  <span>{formatMessageTime(message.created_at)}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;
