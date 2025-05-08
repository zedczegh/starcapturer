
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Send, Image, X } from "lucide-react";
import { toast } from "sonner";
import EmojiPicker from './EmojiPicker';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const handleSend = () => {
    if ((!message.trim() && !imageFile) || sending) return;
    
    onSend(message, imageFile);
    setMessage("");
    setImageFile(null);
    setImagePreview(null);
    
    // Focus back on textarea after sending
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
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
          toast.error(t('Image must be less than 5MB', '图片必须小于5MB'));
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
        toast.error(t('Only image files are allowed', '仅允许上传图片文件'));
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

  const handleEmojiSelect = (emojiTag: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newMessage = message.substring(0, start) + emojiTag + message.substring(end);
      setMessage(newMessage);
      
      // Focus back on textarea and place cursor after the inserted emoji
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = start + emojiTag.length;
          textareaRef.current.selectionStart = newCursorPos;
          textareaRef.current.selectionEnd = newCursorPos;
        }
      }, 10);
    }
  };

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

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
            ref={textareaRef}
            className="w-full bg-cosmic-800/30 border border-cosmic-700/50 rounded-lg py-2 px-4 pl-16 text-cosmic-100 min-h-[45px] max-h-[120px] resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={t("Type your message...", "输入您的消息...")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={sending}
          />
          <div className="absolute bottom-2 left-2 flex items-center space-x-1">
            <button
              className="text-cosmic-400 hover:text-primary"
              onClick={triggerFileInput}
              type="button"
              disabled={sending}
            >
              <Image className="h-5 w-5" />
            </button>
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </div>
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={sending}
          />
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
