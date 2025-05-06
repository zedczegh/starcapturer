
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, Search, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
  isMobile: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  loading,
  searchQuery,
  onSearchChange,
  activeConversation,
  onSelectConversation,
  isMobile
}) => {
  const { t } = useLanguage();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (conversationId: string) => {
    console.log(`Avatar loading error in ConversationList for ${conversationId}`);
    setImageErrors(prev => ({
      ...prev,
      [conversationId]: true
    }));
  };

  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery.trim()) return true;
    return (
      conversation.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.last_message.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return format(date, "h:mm a");
    } else {
      return format(date, "MMM d");
    }
  };

  const truncateMessage = (message: string, maxLength: number = 40) => {
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 md:p-4 border-b border-cosmic-800/50">
        <h2 className="text-xl font-semibold text-white mb-3">{t("Messages", "消息")}</h2>
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("Search conversations...", "搜索对话...")}
            className="pl-10 bg-cosmic-800/40 border-cosmic-700/50 text-white placeholder:text-cosmic-400"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cosmic-400 h-4 w-4" />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cosmic-400 hover:text-cosmic-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-32">
            <Loader2 className="h-6 w-6 text-primary animate-spin mb-2" />
            <p className="text-cosmic-400">{t("Loading conversations...", "加载对话中...")}</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-4 h-32 text-cosmic-400">
            {searchQuery ? (
              <div className="text-center">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>{t("No conversations matching your search.", "没有匹配的对话。")}</p>
              </div>
            ) : (
              <div className="text-center">
                <User className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>{t("No conversations yet.", "暂无对话。")}</p>
                <p className="text-sm">{t("Visit user profiles to start messaging.", "访问用户资料以开始发送消息。")}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-cosmic-800/30">
            {filteredConversations.map(conversation => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`p-3 md:p-4 cursor-pointer transition-colors duration-200 hover:bg-cosmic-800/20
                  ${activeConversation?.id === conversation.id ? 'bg-cosmic-800/40' : ''}
                `}
              >
                <div className="flex gap-3 items-center">
                  <div className="relative">
                    <Avatar className="h-10 w-10 ring-2 ring-offset-1 ring-offset-cosmic-900 ring-primary/20">
                      {conversation.avatar_url && !imageErrors[conversation.id] ? (
                        <img
                          src={conversation.avatar_url}
                          alt={conversation.username || "User"}
                          className="h-full w-full rounded-full object-cover"
                          onError={() => handleImageError(conversation.id)}
                        />
                      ) : (
                        <AvatarFallback className="bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {conversation.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-xs font-bold text-white rounded-full h-5 w-5 flex items-center justify-center border border-cosmic-900">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className={`font-medium truncate ${conversation.unread_count > 0 ? 'text-white' : 'text-cosmic-200'}`}>
                        {conversation.username || t("User", "用户")}
                      </h3>
                      <span className="text-xs text-cosmic-400 ml-2 shrink-0">
                        {formatTime(conversation.last_message_time)}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${conversation.unread_count > 0 ? 'text-white font-medium' : 'text-cosmic-400'}`}>
                      {truncateMessage(conversation.last_message)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
