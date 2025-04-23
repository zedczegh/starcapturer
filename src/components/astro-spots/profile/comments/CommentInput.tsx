
import React, { useState } from 'react';
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from '@/lib/utils';

interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>;
  sending: boolean;
  className?: string;
}

const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  sending,
  className
}) => {
  const { t } = useLanguage();
  const [content, setContent] = useState("");

  const handleSubmit = async () => {
    if (!content.trim() || sending) return;
    await onSubmit(content);
    setContent("");
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Textarea
        placeholder={t("Write your comment here...", "在此处写下您的评论...")}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="bg-cosmic-900/40 border-cosmic-700/30 text-gray-300 resize-none min-h-[100px]
          focus:border-primary/50 focus:ring-primary/20"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.metaKey) {
            handleSubmit();
          }
        }}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-cosmic-400">
          {t("Press ⌘ + Enter to submit", "按 ⌘ + Enter 发送")}
        </p>
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || sending}
          size="sm"
        >
          {sending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("Posting...", "发布中...")}
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              {t("Post Comment", "发布评论")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CommentInput;
