
import React, { useState, useRef } from "react";
import { Send, Image, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import EmojiPicker from "./EmojiPicker";
import { extractLocationIdFromUrl } from '@/utils/messageUtils';

interface MessageInputProps {
  onSend: (message: string, imageFile?: File | null, locationData?: any) => Promise<void>;
  sending: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, sending }) => {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (sending) return;
    
    if (!message.trim() && !imageFile) return;

    try {
      // Check if the message contains a location URL
      const locationData = await extractLocationIdFromUrl(message);
      
      // Send the message with any location data found
      await onSend(message, imageFile, locationData);
      
      // Clear the input fields after successful send
      setMessage("");
      setImageFile(null);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleAddEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  return (
    <div className="p-3 border-t border-cosmic-800/30 bg-cosmic-950/50 backdrop-blur-sm">
      {imageFile && (
        <div className="mb-2 flex items-center gap-2">
          <div className="text-xs bg-cosmic-800/40 px-2 py-1 rounded-md">
            {imageFile.name}
          </div>
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => setImageFile(null)}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          >
            ✕
          </Button>
        </div>
      )}
      
      <div className="flex gap-2 items-end">
        <Textarea
          placeholder={t("Type a message...", "输入消息...")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[40px] max-h-[120px] bg-cosmic-800/20 border-cosmic-700/30"
          rows={1}
        />
        
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleImageSelect}
            className="h-10 w-10 text-primary"
            disabled={sending}
          >
            <Image className="h-5 w-5" />
          </Button>
          
          <EmojiPicker onSelect={handleAddEmoji} />
          
          <Button
            variant="default"
            size="icon"
            onClick={handleSend}
            className="h-10 w-10"
            disabled={sending || (!message.trim() && !imageFile)}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default MessageInput;
