
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, ImagePlus, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface CommentInputProps {
  onSubmit: (content: string, images?: File[]) => void;
  sending: boolean;
  isReply?: boolean;
}

const CommentInput: React.FC<CommentInputProps> = ({ onSubmit, sending, isReply = false }) => {
  const { t } = useLanguage();
  const [commentText, setCommentText] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Allow either text or images (or both)
    if (!commentText.trim() && imageFiles.length === 0) {
      toast.error(t("Please enter a comment or attach an image", "请输入评论或附加图片"));
      return;
    }
    
    onSubmit(commentText.trim(), imageFiles);
    setCommentText('');
    setImageFiles([]);
    setImagePreviews([]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles: File[] = [];
      const newPreviews: string[] = [];
      
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(t(`${file.name} is not an image file`, `${file.name} 不是图片文件`));
          continue;
        }
        
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(t(`${file.name} must be less than 5MB`, `${file.name} 必须小于5MB`));
          continue;
        }
        
        validFiles.push(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setImagePreviews(prev => [...prev, result]);
        };
        reader.readAsDataURL(file);
      }
      
      if (validFiles.length > 0) {
        setImageFiles(prev => [...prev, ...validFiles]);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
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

      {imagePreviews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative inline-block">
              <img 
                src={preview} 
                alt={isReply ? `Reply attachment ${index + 1} preview` : `Comment attachment ${index + 1} preview`}
                className="h-24 w-auto rounded-md border border-cosmic-700/50"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground p-1 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
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
            multiple
            onChange={handleImageSelect}
            disabled={sending}
          />
        </label>
        <Button 
          type="submit" 
          size="sm" 
          disabled={sending || (!commentText.trim() && imageFiles.length === 0)}
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
