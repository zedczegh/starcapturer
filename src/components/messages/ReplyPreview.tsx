import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReplyPreviewProps {
  replyToMessage: {
    id: string;
    text?: string;
    image_url?: string;
    sender_id: string;
  };
  onCancel: () => void;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({ replyToMessage, onCancel }) => {
  const { t } = useLanguage();
  
  return (
    <div className="px-4 py-2 bg-cosmic-800/50 border-t border-cosmic-700/40 flex items-start gap-2">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-primary font-semibold mb-1">
          {t('Replying to message', '回复消息')}
        </div>
        <div className="text-sm text-cosmic-300 truncate">
          {replyToMessage.image_url && !replyToMessage.text && t('Image', '图片')}
          {replyToMessage.text || t('Message', '消息')}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-cosmic-400 hover:text-cosmic-100"
        onClick={onCancel}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
