
import React, { useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import { Popover } from "@/components/ui/popover";
import { useIsMobile } from '@/hooks/use-mobile';

interface MessageInputFieldProps {
  message: string;
  setMessage: (message: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  sending: boolean;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

const MessageInputField: React.FC<MessageInputFieldProps> = ({
  message,
  setMessage,
  onKeyDown,
  sending,
  showEmojiPicker,
  setShowEmojiPicker,
  textareaRef,
}) => {
  const isMobile = useIsMobile();
  
  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message, textareaRef]);
  
  return (
    <div className="relative flex-grow bg-cosmic-800/30 rounded-full border border-cosmic-700/50">
      <div className="flex items-center">
        <textarea
          ref={textareaRef}
          className="w-full bg-transparent rounded-full py-2 px-4 pr-12 text-cosmic-100 min-h-[45px] max-h-[120px] resize-none focus:outline-none"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          disabled={sending}
        />
        <div className={`absolute right-2 flex items-center space-x-1 py-2 ${isMobile ? 'z-50' : 'z-10'}`}>
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 h-8 w-8 rounded-full text-cosmic-400 hover:text-primary hover:bg-cosmic-800/30"
              aria-label="Insert emoji"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-5 w-5" />
            </Button>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default MessageInputField;
