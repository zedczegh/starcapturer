
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import MessageStatus from './MessageStatus';
import { MessageStatusType } from '@/hooks/useMessaging';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  status?: MessageStatusType;
  sender_profile?: {
    username: string | null;
    avatar_url: string | null;
  };
}

interface ConversationPartner {
  id: string;
  username: string | null;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
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
  
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return format(date, 'h:mm a');
  };
  
  useEffect(() => {
    // Scroll to the latest message
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-4 py-3 border-b border-cosmic-800/50 bg-cosmic-900/50 gap-3">
        {isMobile && (
          <button 
            onClick={onBack}
            className="p-1 rounded-full hover:bg-cosmic-800/50"
          >
            <ArrowLeft className="h-5 w-5 text-cosmic-400" />
          </button>
        )}
        
        <Link to={`/profile/${activeConversation.id}`} className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-offset-cosmic-900 ring-primary/20">
            {activeConversation.avatar_url ? (
              <AvatarImage
                src={activeConversation.avatar_url}
                alt={activeConversation.username || "User"}
              />
            ) : (
              <AvatarFallback className="bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </AvatarFallback>
            )}
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate">
              {activeConversation.username || t("User", "用户")}
            </h3>
          </div>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-cosmic-400">
            <span>{t("No messages yet", "暂无消息")}</span>
          </div>
        ) : (
          messages.map((message) => {
            const isSender = message.sender_id === currentUserId;
            
            return (
              <div 
                key={message.id} 
                className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-end gap-2 max-w-[80%]">
                  {!isSender && (
                    <Link to={`/profile/${message.sender_id}`}>
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        {message.sender_profile?.avatar_url ? (
                          <AvatarImage
                            src={message.sender_profile.avatar_url}
                            alt={message.sender_profile.username || "User"}
                          />
                        ) : (
                          <AvatarFallback className="bg-cosmic-800 text-cosmic-400">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </Link>
                  )}
                  
                  <div className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-4 py-2 rounded-xl ${
                        isSender
                          ? 'bg-primary/80 text-white rounded-tr-none'
                          : 'bg-cosmic-800 text-cosmic-100 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.message}</p>
                    </div>
                    
                    <div className="flex items-center gap-1 mt-1 text-xs text-cosmic-400">
                      <span>{formatMessageTime(message.created_at)}</span>
                      {isSender && message.status && <MessageStatus status={message.status} />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;
