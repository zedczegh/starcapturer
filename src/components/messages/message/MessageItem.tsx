import React, { useState } from 'react';
import { format } from 'date-fns';
import { MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import UnsendDialog from './UnsendDialog';
import MessageContentRenderer from './MessageContentRenderer';

interface MessageItemProps {
  message: any;
  isSender: boolean;
  onUnsend: (id: string) => Promise<boolean>;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isSender,
  onUnsend,
}) => {
  const [showUnsendDialog, setShowUnsendDialog] = useState(false);

  const handleUnsendClick = () => {
    setShowUnsendDialog(true);
  };

  const handleConfirmUnsend = async () => {
    const success = await onUnsend(message.id);
    if (success) {
      setShowUnsendDialog(false);
    }
  };

  const handleCancelUnsend = () => {
    setShowUnsendDialog(false);
  };

  return (
    <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`relative max-w-[80%] ${
          isSender 
            ? 'bg-primary/90 text-primary-foreground rounded-2xl rounded-tr-sm' 
            : 'bg-background/95 text-foreground border border-input/30 rounded-2xl rounded-tl-sm'
        } p-3 shadow-sm`}
      >
        <MessageContentRenderer 
          content={message.content} 
          payload={message.payload}
        />
        
        <div className="flex justify-end items-center text-xs mt-1 opacity-70">
          <span>{format(new Date(message.created_at), 'HH:mm')}</span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={handleUnsendClick}>
              <Trash2 className="h-4 w-4 mr-2" />
              Unsend
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <UnsendDialog
        isOpen={showUnsendDialog}
        onConfirm={handleConfirmUnsend}
        onCancel={handleCancelUnsend}
      />
    </div>
  );
};

export default MessageItem;
