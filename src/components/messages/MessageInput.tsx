
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Send, Image, X, Smile, Plus } from "lucide-react";
import { toast } from "sonner";
import EmojiPicker from './EmojiPicker';
import EmojiRenderer from './EmojiRenderer';
import { siqsEmojis } from './SiqsEmojiData';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface MessageInputProps {
  onSend: (text: string, imageFile?: File | null) => void;
  sending: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, sending }) => {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [displayMessage, setDisplayMessage] = useState<React.ReactNode>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const handleSend = () => {
    if ((!message.trim() && !imageFile) || sending) return;
    
    onSend(message, imageFile);
    setMessage("");
    setDisplayMessage(null);
    setImageFile(null);
    setImagePreview(null);
    
    // Focus back on textarea after sending
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  // Update display message when message changes
  useEffect(() => {
    setDisplayMessage(<EmojiRenderer text={message} />);
  }, [message]);
  
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
    setShowOptions(false);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    setShowOptions(false);
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
    
    setShowEmojiPicker(false);
  };

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  return (
    <div className="border-t border-cosmic-800/50 p-4 bg-cosmic-900/70 space-y-3 sticky bottom-0 backdrop-blur-md z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
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
        <Popover open={showOptions} onOpenChange={setShowOptions}>
          <PopoverTrigger asChild>
            <Button
              className="h-10 w-10 p-0 rounded-full bg-cosmic-800/30 hover:bg-cosmic-700/50 text-cosmic-400 hover:text-primary transition-colors"
              variant="ghost"
              type="button"
              disabled={sending}
            >
              <Plus className="h-5 w-5" />
              <span className="sr-only">{t("Options", "选项")}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="p-2 bg-cosmic-900/95 border-cosmic-700 backdrop-blur-lg w-auto"
            side="top"
            align="start"
            sideOffset={10}
          >
            <div className="flex gap-2">
              <Button
                className="flex flex-col items-center gap-1 w-16 h-16 p-1 rounded-lg hover:bg-cosmic-800/50"
                variant="ghost"
                onClick={triggerFileInput}
                disabled={sending}
              >
                <div className="h-8 w-8 rounded-full bg-cosmic-800/50 flex items-center justify-center">
                  <Image className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs text-cosmic-300">
                  {t("Image", "图片")}
                </span>
              </Button>
              
              <Button
                className="flex flex-col items-center gap-1 w-16 h-16 p-1 rounded-lg hover:bg-cosmic-800/50"
                variant="ghost"
                onClick={toggleEmojiPicker}
                disabled={sending}
              >
                <div className="h-8 w-8 rounded-full bg-cosmic-800/50 flex items-center justify-center">
                  <Smile className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs text-cosmic-300">
                  {t("Emoji", "表情")}
                </span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        <div className="relative flex-grow bg-cosmic-800/30 rounded-full border border-cosmic-700/50">
          <div className="flex items-center">
            <textarea
              ref={textareaRef}
              className="w-full bg-transparent rounded-full py-2 px-4 pr-12 text-cosmic-100 min-h-[45px] max-h-[120px] resize-none focus:outline-none"
              placeholder={t("Type your message...", "输入您的消息...")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={sending}
            />
            <div className="absolute right-2 flex items-center space-x-1 py-2 z-10">
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-0 h-8 w-8 rounded-full text-cosmic-400 hover:text-primary hover:bg-cosmic-800/30"
                    aria-label={t("Insert emoji", "插入表情")}
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" alignOffset={-40} className="p-2 bg-cosmic-900/95 border-cosmic-700 backdrop-blur-lg w-72">
                  <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    {siqsEmojis.map((emoji) => (
                      <Button
                        key={emoji.id}
                        variant="ghost"
                        className="flex flex-col items-center justify-center p-2 hover:bg-cosmic-800/50 cursor-pointer rounded-lg transition-all hover:scale-110 h-auto"
                        onClick={() => handleEmojiSelect(`[${emoji.id}]`)}
                      >
                        <div className="p-1 transform hover:scale-110 transition-transform">
                          {emoji.icon}
                        </div>
                        <span className="text-xs text-cosmic-300 mt-1 text-center">
                          {emoji.name}
                        </span>
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
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
        </div>
        <Button
          className="flex-shrink-0 rounded-full h-10 w-10 p-0"
          onClick={handleSend}
          disabled={sending || (!message.trim() && !imageFile)}
          variant={message.trim() || imageFile ? "default" : "ghost"}
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">{t("Send", "发送")}</span>
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
