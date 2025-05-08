import React, { useRef, useEffect, useState } from 'react';
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import MessageHeader from './message/MessageHeader';
import MessageItem from './message/MessageItem';
import EmptyMessages from './message/EmptyMessages';
import UnsendDialog from './message/UnsendDialog';
import { Trash2 } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  message?: string;
  text?: string;
  image_url?: string | null;
  created_at: string;
  sender_profile?: {
    username: string | null;
    avatar_url: string | null;
  };
  is_unsent?: boolean;
  location?: any;
  read?: boolean;
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
  onUnsendMessage: (messageId: string) => Promise<boolean>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  activeConversation,
  onBack,
  onUnsendMessage
}) => {
  const { t } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [messageToUnsend, setMessageToUnsend] = useState<string | null>(null);
  const [unsendDialogOpen, setUnsendDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return format(date, "h:mm a");
    } else {
      return format(date, "MMM d, h:mm a");
    }
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

  // Set up event listener for image loading
  useEffect(() => {
    const handleImageLoad = () => {
      scrollToBottom();
    };
    
    window.addEventListener('message-image-loaded', handleImageLoad);
    
    return () => {
      window.removeEventListener('message-image-loaded', handleImageLoad);
    };
  }, []);
  
  // Handle initiating unsend flow
  const handleUnsendRequest = (messageId: string) => {
    if (!isProcessing) {
      setMessageToUnsend(messageId);
      setUnsendDialogOpen(true);
    }
  };
  
  // Handle unsend message with improved error handling
  const handleUnsendMessage = async () => {
    if (messageToUnsend && onUnsendMessage && !isProcessing) {
      try {
        setIsProcessing(true);
        const success = await onUnsendMessage(messageToUnsend);
        
        // Add a small delay before clearing state to ensure everything processes correctly
        setTimeout(() => {
          if (success) {
            setMessageToUnsend(null);
          }
          setUnsendDialogOpen(false);
          setIsProcessing(false);
        }, 300);
      } catch (error) {
        console.error("Error during unsend operation:", error);
        setIsProcessing(false);
        setUnsendDialogOpen(false);
      }
    } else {
      setUnsendDialogOpen(false);
    }
  };
  
  // Handle dialog closing separately
  const handleDialogClose = () => {
    if (!isProcessing) {
      setUnsendDialogOpen(false);
      setMessageToUnsend(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Message Header Component */}
      <MessageHeader 
        conversation={activeConversation} 
        onBack={onBack} 
      />

      {/* Messages container with hidden scrollbars */}
      <div 
        className="flex-1 overflow-y-auto scrollbar-hide p-4 pb-6 space-y-4 h-[calc(100%-130px)]" 
        ref={scrollAreaRef}
        style={{ overflowX: "hidden", msOverflowStyle: "none", scrollbarWidth: "none" }}
      >
        {messages.length === 0 ? (
          <EmptyMessages />
        ) : (
          messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isSender={message.sender_id === currentUserId}
              onUnsend={(id) => handleUnsendRequest(id)}
              isProcessingAction={isProcessing}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Unsend Message Confirmation Dialog */}
      <UnsendDialog
        open={unsendDialogOpen}
        isProcessing={isProcessing}
        onOpenChange={(isOpen) => {
          if (!isProcessing && !isOpen) {
            handleDialogClose();
          }
        }}
        onUnsend={handleUnsendMessage}
        onCancel={handleDialogClose}
      />
    </div>
  );
};

export default MessageList;
