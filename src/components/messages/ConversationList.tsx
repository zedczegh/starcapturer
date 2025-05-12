
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { Search, User, MessageCircle, Trash2, AlertCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import EmojiRenderer from './EmojiRenderer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

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
  onDeleteConversation: (partnerId: string) => Promise<boolean>;
  isProcessingAction: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  loading,
  searchQuery,
  onSearchChange,
  activeConversation,
  onSelectConversation,
  onDeleteConversation,
  isProcessingAction,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<ConversationPartner | null>(null);

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

  const handleDeleteClick = (e: React.MouseEvent, conversation: ConversationPartner) => {
    e.stopPropagation();
    setConversationToDelete(conversation);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (conversationToDelete) {
      await onDeleteConversation(conversationToDelete.id);
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className={`${isMobile ? 'p-2 pb-3' : 'p-4'} border-b border-cosmic-800/50 bg-cosmic-900/50`}>
          <h2 className={`${isMobile ? 'text-lg mb-2' : 'text-xl mb-4'} font-semibold text-white flex items-center gap-2`}>
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
        
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {loading ? (
              <div className={`${isMobile ? 'p-4' : 'p-8'} flex flex-col items-center justify-center space-y-3 text-cosmic-400`}>
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"/>
                <p className="text-sm">{t("Loading conversations...", "加载对话中...")}</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className={`${isMobile ? 'p-4' : 'p-8'} text-center text-cosmic-400 space-y-2`}>
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
                  className={`${isMobile ? 'p-2' : 'p-3'} rounded-xl cursor-pointer transition-all flex items-center gap-2 
                    hover:bg-primary/5 border border-transparent group
                    ${activeConversation?.id === conversation.id 
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
                        {conversation.username || t("User", "用户")}
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
                    onClick={(e) => handleDeleteClick(e, conversation)}
                    disabled={isProcessingAction}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete conversation</span>
                  </Button>
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-cosmic-950 border-cosmic-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              {t("Delete Conversation", "删除对话")}
            </DialogTitle>
            <DialogDescription className="text-cosmic-300">
              {t("This will permanently delete all messages between you and", "这将永久删除您与")} {conversationToDelete?.username}. {t("This action cannot be undone.", "此操作无法撤销。")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              className="border-cosmic-700 text-cosmic-300 hover:bg-cosmic-800 hover:text-white"
            >
              {t("Cancel", "取消")}
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDelete}
              disabled={isProcessingAction}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessingAction ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  {t("Deleting...", "删除中...")}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("Delete", "删除")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConversationList;
