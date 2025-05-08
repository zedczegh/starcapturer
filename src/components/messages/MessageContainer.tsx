
import React from "react";
import { Card } from "@/components/ui/card";
import ConversationList from "@/components/messages/ConversationList";
import MessageList from "@/components/messages/MessageList";
import MessageInput from "@/components/messages/MessageInput";
import { ConversationPartner } from "@/hooks/messaging/useConversations";
import { useRef, useState } from "react";

interface MessageContainerProps {
  activeConversation: ConversationPartner | null;
  conversations: ConversationPartner[];
  loading: boolean;
  messages: any[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectConversation: (conversation: ConversationPartner) => void;
  onBack: () => void;
  onSendMessage: (message: string, imageFile?: File | null) => Promise<void>;
  onUnsendMessage: (messageId: string) => Promise<boolean>;
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
  sending,
  isProcessingAction,
  currentUserId,
}) => {
  const messageListRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[80vh]">
      <Card className={`${activeConversation ? 'hidden md:flex' : 'flex'} 
        w-full md:w-1/3 glassmorphism overflow-hidden flex-col
        border border-cosmic-800/30 shadow-xl backdrop-blur-lg`}
      >
        <ConversationList 
          conversations={conversations}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeConversation={activeConversation}
          onSelectConversation={onSelectConversation}
        />
      </Card>
      
      <Card className={`${!activeConversation ? 'hidden md:flex' : 'flex'} 
        w-full md:w-2/3 glassmorphism overflow-hidden flex flex-col
        border border-cosmic-800/30 shadow-xl backdrop-blur-lg relative h-full`}
        ref={messageListRef}
      >
        {activeConversation ? (
          <div className="flex flex-col h-full overflow-hidden">
            <MessageList 
              messages={messages}
              currentUserId={currentUserId}
              activeConversation={activeConversation}
              onBack={onBack}
              onUnsendMessage={onUnsendMessage}
            />
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
