
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, ImagePlus, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CommentInputProps {
  onSubmit: (content: string, image?: File | null) => void;
  sending: boolean;
  isReply?: boolean;
}

const CommentInput: React.FC<CommentInputProps> = ({ onSubmit, sending, isReply = false }) => {
  const { t } = useLanguage();
  const [commentText, setCommentText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim() || imageFile) {
      onSubmit(commentText.trim(), imageFile);
      setCommentText('');
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert(t('Image must be less than 5MB', '图片必须小于5MB'));
        return;
      }
      
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        placeholder={isReply ? t("Write a reply...", "撰写回复...") : t("Add a comment...", "添加评论...")}
        className={`${isReply ? 'min-h-16' : 'min-h-24'} bg-cosmic-800/40 border-cosmic-700/40 focus:border-primary`}
        disabled={sending}
      />

      {imagePreview && (
        <div className="relative inline-block">
          <img 
            src={imagePreview} 
            alt={isReply ? "Reply attachment preview" : "Comment attachment preview"}
            className="h-24 w-auto rounded-md border border-cosmic-700/50"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 bg-destructive text-white p-1 rounded-full"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <label className="cursor-pointer">
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-primary/90 hover:text-primary hover:bg-cosmic-800/30 rounded-md">
            <ImagePlus className="h-4 w-4" />
            <span>{t("Add Image", "添加图片")}</span>
          </div>
          <input 
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleImageSelect}
            disabled={sending}
          />
        </label>
        <Button 
          type="submit" 
          size="sm" 
          disabled={sending || (!commentText.trim() && !imageFile)}
          className="flex gap-1 items-center"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isReply ? t("Reply", "回复") : t("Submit", "提交")}
        </Button>
      </div>
    </form>
  );
};

export default CommentInput;
