
import React from 'react';
import { ChevronLeft, User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

interface MessageHeaderProps {
  conversation: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
  onBack: () => void;
}

const MessageHeader: React.FC<MessageHeaderProps> = ({ conversation, onBack }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  return (
    <div className="p-4 border-b border-cosmic-800/50 bg-cosmic-900/90 flex items-center gap-3 sticky top-0 z-30 backdrop-blur-md shadow-sm">
      <Button 
        variant="ghost" 
        className="md:hidden mr-2 text-cosmic-400 hover:text-white hover:bg-cosmic-800/50" 
        onClick={onBack}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
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
      <div className="flex-1">
        <h3 className="font-semibold text-white text-lg">
          {conversation.username || t("User", "用户")}
        </h3>
        <Button
          variant="link"
          className="p-0 h-auto text-sm text-primary hover:text-primary/80"
          onClick={() => navigate(`/profile/${conversation.id}`)}
        >
          {t("View Profile", "查看资料")}
        </Button>
      </div>
    </div>
  );
};

export default MessageHeader;
