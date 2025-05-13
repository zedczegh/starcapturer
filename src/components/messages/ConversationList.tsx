
import React, { useState, useCallback } from 'react';
import { format } from "date-fns";
import { AnimatePresence } from "framer-motion";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { ConversationPartner } from '@/hooks/messaging/types';
import ConversationItem from './conversation/ConversationItem';
import DeleteConversationDialog from './conversation/DeleteConversationDialog';
import ConversationHeader from './conversation/ConversationHeader';
import { LoadingState, EmptyState } from './conversation/ConversationListStates';

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
  const isMobile = useIsMobile();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<ConversationPartner | null>(null);

  const formatMessageTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return format(date, "h:mm a");
    } else {
      return format(date, "MMM d, h:mm a");
    }
  }, []);

  const filteredConversations = conversations.filter(conv => 
    conv.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteClick = useCallback((e: React.MouseEvent, conversation: ConversationPartner) => {
    e.stopPropagation();
    setConversationToDelete(conversation);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (conversationToDelete) {
      const success = await onDeleteConversation(conversationToDelete.id);
      if (success) {
        console.log("Conversation successfully deleted:", conversationToDelete.id);
      }
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  }, [conversationToDelete, onDeleteConversation]);

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <ConversationHeader 
          searchQuery={searchQuery} 
          onSearchChange={onSearchChange} 
        />
        
        <ScrollArea className="flex-1 p-2">
          {loading ? (
            <LoadingState isMobile={isMobile} />
          ) : filteredConversations.length === 0 ? (
            <EmptyState isMobile={isMobile} searchQuery={searchQuery} />
          ) : (
            <div className="space-y-1">
              <AnimatePresence>
                {filteredConversations.map(conversation => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={activeConversation?.id === conversation.id}
                    onSelect={() => onSelectConversation(conversation)}
                    onDeleteClick={(e) => handleDeleteClick(e, conversation)}
                    isMobile={isMobile}
                    formatMessageTime={formatMessageTime}
                    isProcessingAction={isProcessingAction}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </div>

      <DeleteConversationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        conversation={conversationToDelete}
        isProcessingAction={isProcessingAction}
      />
    </>
  );
};

export default ConversationList;
