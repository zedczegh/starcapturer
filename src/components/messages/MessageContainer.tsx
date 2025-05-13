
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

  // Using CSS visibility instead of conditional rendering to prevent layout shifts
  const conversationListVisible = !activeConversation || !isMobile;
  const messagesVisible = activeConversation || !isMobile;

  // Determine if we should show a loading skeleton
  const showMessageSkeleton = loading && activeConversation && messages.length === 0;

  // Adjust height for mobile view when conversation is active to ensure input is visible
  // The navbar is hidden in this case, so we can use full height
  const mobileHeight = isMobile && activeConversation 
    ? 'h-[100vh]' 
    : isMobile ? 'h-[calc(100vh-5rem)]' : 'h-[80vh]';

  return (
    <div className={`flex flex-col md:flex-row gap-4 ${mobileHeight} scrollbar-hide`}>
      <Card 
        className={`md:flex md:w-1/3 glassmorphism overflow-hidden flex-col
          border border-cosmic-800/30 shadow-xl backdrop-blur-lg
          ${isMobile ? 
            (conversationListVisible ? 'flex h-full max-h-[calc(100vh-5rem)]' : 'hidden') : 
            'flex'}
        `}
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
        className={`md:flex md:w-2/3 glassmorphism overflow-hidden flex flex-col
          border border-cosmic-800/30 shadow-xl backdrop-blur-lg relative h-full
          ${isMobile ? 
            (messagesVisible ? 'flex h-full max-h-[100vh]' : 'hidden') : 
            'flex'}
        `}
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
