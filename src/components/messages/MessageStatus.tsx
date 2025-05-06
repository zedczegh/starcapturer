
import React from 'react';
import { Check, X } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { Message } from '@/hooks/messaging/types';

interface MessageStatusProps {
  message: Message;
  currentUserId: string;
}

const MessageStatus: React.FC<MessageStatusProps> = ({ message, currentUserId }) => {
  const { t } = useLanguage();
  
  if (message.sender_id !== currentUserId) return null;
  
  // Default to sent if status not specified
  const status = message.status || (message.read ? 'read' : 'sent');
  
  if (status === 'failed') {
    return (
      <Tooltip>
        <TooltipTrigger>
          <X className="h-3.5 w-3.5 text-red-500 ml-1" />
        </TooltipTrigger>
        <TooltipContent>{t("Failed to send", "发送失败")}</TooltipContent>
      </Tooltip>
    );
  } else if (status === 'read') {
    return (
      <Tooltip>
        <TooltipTrigger>
          <div className="flex text-green-500 ml-1">
            <Check className="h-3.5 w-3.5" />
            <Check className="h-3.5 w-3.5 -ml-2" />
          </div>
        </TooltipTrigger>
        <TooltipContent>{t("Read", "已读")}</TooltipContent>
      </Tooltip>
    );
  } else {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Check className="h-3.5 w-3.5 text-cosmic-300 ml-1" />
        </TooltipTrigger>
        <TooltipContent>{t("Sent", "已发送")}</TooltipContent>
      </Tooltip>
    );
  }
};

export default MessageStatus;
