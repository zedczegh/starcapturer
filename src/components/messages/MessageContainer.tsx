import React from "react";
import { Card } from "@/components/ui/card";
import ConversationList from "@/components/messages/ConversationList";
import MessageList from "@/components/messages/MessageList";
import MessageInput from "@/components/messages/MessageInput";
import EmptyConversationState from "@/components/messages/EmptyConversationState";
import { ConversationPartner } from "@/hooks/messaging/useConversations";
import { useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import MessagesSkeleton from "@/components/messages/MessagesSkeleton";

interface MessageContainerProps {
  activeConversation: ConversationPartner | null;
  conversations: ConversationPartner[];
  loading: boolean;
  messages: any[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectConversation: (conversation: ConversationPartner) => void;
  onBack: () => void;
  onSendMessage: (message: string, imageFile?: File | null, locationData?: any) => Promise<void>;
  onUnsendMessage: (messageId: string) => Promise<boolean>;
  onDeleteConversation: (partnerId: string) => Promise<boolean>;
  sending: boolean;
  isProcessingAction: boolean;
  currentUserId: string;
}

const MessageContainer: React.FC<MessageContainerProps> = ({
  activeConversation,
  conversations,
  loading,
  messages,
  searchQuery,
  setSearchQuery,
  onSelectConversation,
  onBack,
  onSendMessage,
  onUnsendMessage,
  onDeleteConversation,
  sending,
  isProcessingAction,
  currentUserId,
}) => {
  const messageListRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const conversationListVisible = !activeConversation || !isMobile;
  const messagesVisible = activeConversation || !isMobile;
  const showMessageSkeleton = loading && activeConversation && messages.length === 0;

  return (
    <div className={`flex flex-col md:flex-row gap-4 ${isMobile ? 'h-[calc(100vh-5rem)]' : 'h-[80vh]'} scrollbar-hide`}>
      <Card 
        className={`md:flex md:w-1/3 overflow-hidden flex-col bg-cosmic-800/40 backdrop-blur-xl border border-primary/10 shadow-xl ${isMobile ? (conversationListVisible ? 'flex h-full max-h-[calc(100vh-5rem)]' : 'hidden') : 'flex'}`}
      >
        <ConversationList 
          conversations={conversations}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeConversation={activeConversation}
          onSelectConversation={onSelectConversation}
          onDeleteConversation={onDeleteConversation}
          isProcessingAction={isProcessingAction}
        />
      </Card>
      
      <Card 
        className={`md:flex md:w-2/3 overflow-hidden flex flex-col bg-cosmic-800/40 backdrop-blur-xl border border-primary/10 shadow-xl relative h-full ${isMobile ? (messagesVisible ? 'flex h-full max-h-[calc(100vh-5rem)]' : 'hidden') : 'flex'}`}
        ref={messageListRef}
        data-active-conversation-id={activeConversation?.id || ''}
      >
        {activeConversation ? (
          <div className="flex flex-col h-full overflow-hidden">
            {showMessageSkeleton ? (
              <MessagesSkeleton />
            ) : (
              <MessageList 
                messages={messages}
                currentUserId={currentUserId}
                activeConversation={activeConversation}
                onBack={onBack}
                onUnsendMessage={onUnsendMessage}
              />
            )}
            <MessageInput 
              onSend={onSendMessage}
              sending={sending || isProcessingAction}
            />
          </div>
        ) : (
          <EmptyConversationState />
        )}
      </Card>
    </div>
  );
};

export default MessageContainer;
