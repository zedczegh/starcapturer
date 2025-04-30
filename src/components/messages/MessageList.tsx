
import React, { useRef, useEffect } from 'react';
import { motion } from "framer-motion";
import { ChevronLeft, User, MessageCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface Message {
  id: string;
  sender_id: string;
  message: string;
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
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [prevMessagesLength, setPrevMessagesLength] = React.useState(messages.length);

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return format(date, "h:mm a");
    } else {
      return format(date, "MMM d, h:mm a");
    }
  };

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
    <div className="flex flex-col h-full">
      <div className="p-3 md:p-4 border-b border-cosmic-800/50 bg-cosmic-900/50 flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon"
          className="md:hidden text-cosmic-400 hover:text-white hover:bg-cosmic-800/50" 
          onClick={onBack}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10 md:h-12 md:w-12 ring-2 ring-offset-2 ring-offset-cosmic-900 ring-primary/20">
          {activeConversation.avatar_url ? (
            <AvatarImage
              src={activeConversation.avatar_url}
              alt={activeConversation.username || "User"}
              className="object-cover"
            />
          ) : (
            <AvatarFallback className="bg-primary/10">
              <User className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-base md:text-lg truncate">
            {activeConversation.username || t("User", "用户")}
          </h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="link"
                className="p-0 h-auto text-xs md:text-sm text-primary hover:text-primary/80"
                onClick={() => navigate(`/profile/${activeConversation.id}`)}
              >
                {t("View Profile", "查看资料")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t("Visit profile page", "访问个人资料页面")}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div ref={messageContainerRef} className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center text-cosmic-400 space-y-2">
              <MessageCircle className="mx-auto h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">{t("No messages yet", "暂无消息")}</p>
              <p className="text-sm">
                {t("Send a message to start the conversation", "发送消息开始对话")}
              </p>
            </div>
          </div>
        ) : (
          Object.keys(groupedMessages).map(date => (
            <div key={date} className="space-y-4">
              <div className="flex justify-center">
                <div className="text-xs text-cosmic-400 bg-cosmic-800/30 px-3 py-1 rounded-full">
                  {formatDateLabel(date)}
                </div>
              </div>
              
              {groupedMessages[date].map((message, index) => (
                <motion.div
                  key={message.id}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={staggerVariants}
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
                  <div className={`max-w-[75%] space-y-1 ${
                    message.sender_id === currentUserId ? 'items-end' : 'items-start'
                  }`}>
                    <div className={`rounded-2xl px-4 py-2 ${
                      message.sender_id === currentUserId 
                        ? 'bg-primary text-white ml-auto shadow-lg shadow-primary/10' 
                        : 'bg-cosmic-800/50 text-cosmic-100'
                    }`}>
                      <p className="break-words">{message.message}</p>
                    </div>
                    <div className={`flex items-center gap-2 text-xs text-cosmic-400 ${
                      message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                    }`}>
                      <span>{formatMessageTime(message.created_at)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;
