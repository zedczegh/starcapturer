import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { Search, User, MessageCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import EmojiRenderer from './EmojiRenderer';

interface ConversationPartner {
  id: string;
  username: string | null;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface ConversationListProps {
  conversations: ConversationPartner[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeConversation: ConversationPartner | null;
  onSelectConversation: (conversation: ConversationPartner) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  loading,
  searchQuery,
  onSearchChange,
  activeConversation,
  onSelectConversation,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return format(date, "h:mm a");
    } else {
      return format(date, "MMM d, h:mm a");
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-cosmic-800/50 bg-cosmic-900/50">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
          <MessageCircle className="h-5 w-5 text-primary" /> {t("Messages", "消息")}
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cosmic-400" />
          <Input 
            placeholder={t("Search conversations", "搜索对话")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-cosmic-800/30 border-cosmic-700/50 focus:border-primary/50 focus:ring-primary/20
              placeholder:text-cosmic-500"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center space-y-3 text-cosmic-400">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"/>
            <p className="text-sm">{t("Loading conversations...", "加载对话中...")}</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-cosmic-400 space-y-2">
            <MessageCircle className="mx-auto h-12 w-12 opacity-30 mb-2" />
            <p>{searchQuery ? t("No conversations match your search", "没有匹配的对话") 
              : t("No conversations yet", "暂无对话")}</p>
          </div>
        ) : (
          filteredConversations.map(conversation => (
            <motion.div
              key={conversation.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => onSelectConversation(conversation)}
              className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 
                hover:bg-primary/5 border border-transparent
                ${activeConversation?.id === conversation.id 
                  ? 'bg-primary/10 border-primary/20 shadow-lg' 
                  : 'hover:border-cosmic-700/30'
                }`}
            >
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-offset-cosmic-900 ring-primary/20">
                  {conversation.avatar_url ? (
                    <AvatarImage
                      src={conversation.avatar_url}
                      alt={conversation.username || "User"}
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-primary/10">
                      <User className="h-6 w-6 text-primary" />
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
                  <p className="font-medium text-white truncate">
                    {conversation.username || t("User", "用户")}
                  </p>
                  <span className="text-xs text-cosmic-400">
                    {formatMessageTime(conversation.last_message_time)}
                  </span>
                </div>
                <div className="text-sm text-cosmic-300 truncate mt-0.5">
                  <EmojiRenderer text={conversation.last_message} inline />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
