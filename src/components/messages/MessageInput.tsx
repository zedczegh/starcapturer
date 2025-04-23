
import React, { useState } from 'react';
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface MessageInputProps {
  onSend: (message: string) => Promise<void>;
  sending: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, sending }) => {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    await onSend(message);
    setMessage("");
  };

  return (
    <div className="p-4 border-t border-cosmic-800/50 bg-cosmic-900/30">
      <div className="flex gap-2">
        <Input
          placeholder={t("Type a message...", "输入消息...")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          disabled={sending}
          className="flex-1 bg-cosmic-800/30 border-cosmic-700/50 focus:border-primary/50 
            focus:ring-primary/20 placeholder:text-cosmic-500"
        />
        <Button 
          onClick={handleSend} 
          disabled={!message.trim() || sending}
          className="px-6 bg-primary hover:bg-primary/90 text-white shadow-lg
            disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {sending ? (
            <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              {t("Send", "发送")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
