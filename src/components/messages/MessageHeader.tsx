
import React from 'react';
import { ChevronLeft, User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface MessageHeaderProps {
  activeConversation: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
  onBack: () => void;
}

const MessageHeader: React.FC<MessageHeaderProps> = ({ activeConversation, onBack }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="p-3 md:p-4 border-b border-cosmic-800/50 bg-cosmic-900/50 flex items-center gap-3">
      <Button 
        variant="ghost" 
        size="icon"
        className="md:hidden text-cosmic-400 hover:text-white hover:bg-cosmic-800/50" 
        onClick={onBack}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Avatar className="h-10 w-10 md:h-12 md:w-12 ring-2 ring-offset-2 ring-offset-cosmic-900 ring-primary/20">
        {activeConversation.avatar_url ? (
          <AvatarImage
            src={activeConversation.avatar_url}
            alt={activeConversation.username || "User"}
            className="object-cover"
          />
        ) : (
          <AvatarFallback className="bg-primary/10">
            <User className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </AvatarFallback>
        )}
      </Avatar>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white text-base md:text-lg truncate">
          {activeConversation.username || t("User", "用户")}
        </h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="link"
              className="p-0 h-auto text-xs md:text-sm text-primary hover:text-primary/80"
              onClick={() => navigate(`/profile/${activeConversation.id}`)}
            >
              {t("View Profile", "查看资料")}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t("Visit profile page", "访问个人资料页面")}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default MessageHeader;
