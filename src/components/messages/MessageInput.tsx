
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Send, Image, X } from "lucide-react";

interface MessageInputProps {
  onSend: (text: string, imageFile?: File | null) => void;
  sending: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, sending }) => {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleSend = () => {
    if ((!message.trim() && !imageFile) || sending) return;
    
    onSend(message, imageFile);
    setMessage("");
    setImageFile(null);
    setImagePreview(null);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          alert(t('Image must be less than 5MB', '图片必须小于5MB'));
          return;
        }
        
        setImageFile(file);
        
        // Create image preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // Not an image file
        alert(t('Only image files are allowed', '仅允许上传图片文件'));
      }
    }
  };
  
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="border-t border-cosmic-800/50 p-4 bg-cosmic-900/20 space-y-3">
      {imagePreview && (
        <div className="relative inline-block">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="h-20 rounded-md border border-cosmic-700/50"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
            onClick={handleRemoveImage}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <div className="relative flex-grow">
          <textarea
            className="w-full bg-cosmic-800/30 border border-cosmic-700/50 rounded-lg py-2 px-4 text-cosmic-100 min-h-[45px] max-h-[120px] resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={t("Type your message...", "输入您的消息...")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          <button
            className="absolute bottom-2 left-2 text-cosmic-400 hover:text-primary"
            onClick={triggerFileInput}
            type="button"
          >
            <Image className="h-5 w-5" />
          </button>
        </div>
        <Button
          className="flex-shrink-0"
          onClick={handleSend}
          disabled={sending || (!message.trim() && !imageFile)}
        >
          <Send className="h-4 w-4" />
          <span className="ml-2">{t("Send", "发送")}</span>
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
