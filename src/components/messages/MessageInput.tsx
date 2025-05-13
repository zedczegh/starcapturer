
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Send, Plus } from "lucide-react";
import EmojiPicker from './EmojiPicker';
import EmojiRenderer from './EmojiRenderer';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useMessageInputState } from '@/hooks/messaging/useMessageInputState';
import MessageOptions from './input/MessageOptions';
import ImagePreview from './input/ImagePreview';
import MessageInputField from './input/MessageInputField';
import { useIsMobile } from "@/hooks/use-mobile";

interface MessageInputProps {
  onSend: (text: string, imageFile?: File | null, locationData?: any) => void;
  sending: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, sending }) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  const {
    message,
    setMessage,
    displayMessage,
    setDisplayMessage,
    imageFile,
    imagePreview,
    fileInputRef,
    textareaRef,
    showOptions,
    setShowOptions,
    showEmojiPicker,
    setShowEmojiPicker,
    gettingLocation,
    handleSend,
    handleKeyDown,
    handleFileChange,
    handleRemoveImage,
    triggerFileInput,
    toggleEmojiPicker,
    handleEmojiSelect,
    handleShareLocation
  } = useMessageInputState(onSend, sending);
  
  // Update display message when message changes
  useEffect(() => {
    setDisplayMessage(<EmojiRenderer text={message} />);
  }, [message, setDisplayMessage]);

  return (
    <div className={`border-t border-cosmic-800/50 p-3 md:p-4 bg-cosmic-900/70 space-y-2 md:space-y-3 
      ${isMobile ? 'fixed bottom-0 left-0 right-0 z-30' : 'sticky bottom-0'} 
      backdrop-blur-md shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]`}>
      <ImagePreview imagePreview={imagePreview} onRemoveImage={handleRemoveImage} />
      
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
          <MessageOptions 
            sending={sending}
            gettingLocation={gettingLocation}
            onImageSelect={triggerFileInput}
            onEmojiToggle={toggleEmojiPicker}
            onShareLocation={handleShareLocation}
          />
        </Popover>
        
        <MessageInputField 
          message={message}
          setMessage={setMessage}
          onKeyDown={handleKeyDown}
          sending={sending}
          showEmojiPicker={showEmojiPicker}
          setShowEmojiPicker={setShowEmojiPicker}
          textareaRef={textareaRef}
        />
        
        <Button
          className="flex-shrink-0 rounded-full h-10 w-10 p-0"
          onClick={handleSend}
          disabled={sending || (!message.trim() && !imageFile)}
          variant={message.trim() || imageFile ? "default" : "ghost"}
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">{t("Send", "发送")}</span>
        </Button>
        
        <input 
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          disabled={sending}
        />
      </div>
      
      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <PopoverContent align="end" alignOffset={-40} className="p-2 bg-cosmic-900/95 border-cosmic-700 backdrop-blur-lg w-72 z-50">
          <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MessageInput;
