
import React, { useState, useRef, FormEvent, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSend: (message: string) => Promise<boolean>;
  sending: boolean;
  errorState?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  onSend, 
  sending,
  errorState = false
}) => {
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [rows, setRows] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    
    if (message.trim() && !sending) {
      const success = await onSend(message);
      if (success) {
        setMessage('');
        setRows(1);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to auto to get correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate new height based on scrollHeight
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${newHeight}px`;
    
    // Update rows state based on content
    const newLines = (textarea.value.match(/\n/g) || []).length + 1;
    const newRows = Math.min(Math.max(newLines, 1), 5);
    setRows(newRows);
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={cn(
        "border-t border-cosmic-800/50 p-3 md:p-4 bg-cosmic-900/50", 
        errorState ? "border-red-500/50 bg-red-900/10" : ""
      )}
    >
      <div className="flex gap-2 items-end">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            rows={rows}
            placeholder={t("Type a message...", "输入消息...")}
            className={cn(
              "w-full resize-none rounded-xl p-3 pr-10 bg-cosmic-800/40 border border-cosmic-700/50",
              "text-cosmic-100 placeholder-cosmic-400 focus:outline-none focus:ring-1 focus:ring-primary/50",
              "transition-all ease-in-out duration-200 min-h-[44px] max-h-[120px]",
              errorState ? "border-red-500/50 focus:ring-red-500/50" : ""
            )}
          />
        </div>
        <Button 
          type="submit" 
          size="icon"
          disabled={!message.trim() || sending}
          className={cn(
            "rounded-full h-11 w-11 flex-shrink-0 transition-all",
            "bg-primary hover:bg-primary/90 text-white",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
};

export default MessageInput;
