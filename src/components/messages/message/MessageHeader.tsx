
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, MoreVertical } from 'lucide-react';
import { ConversationPartner } from '@/hooks/messaging/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/utils/profileUtils';

interface MessageHeaderProps {
  conversation: ConversationPartner;
  onBack: () => void;
}

const MessageHeader: React.FC<MessageHeaderProps> = ({ conversation, onBack }) => {
  return (
    <div className="px-4 py-3 border-b border-cosmic-800/50 flex items-center gap-3 sticky top-0 bg-cosmic-900/95 backdrop-blur-md z-10">
      <Button 
        variant="ghost" 
        size="icon" 
        className="md:hidden" 
        onClick={onBack}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      
      <Avatar className="h-9 w-9">
        <AvatarImage src={conversation.avatar_url || ''} alt={conversation.username} />
        <AvatarFallback className="bg-primary/20 text-primary">
          {getInitials(conversation.username)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-cosmic-100 truncate">{conversation.username}</h3>
      </div>
      
      <Button variant="ghost" size="icon" className="text-cosmic-400 hover:text-cosmic-200">
        <MoreVertical className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default MessageHeader;
