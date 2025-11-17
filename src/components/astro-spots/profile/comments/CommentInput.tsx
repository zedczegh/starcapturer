
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, ImagePlus, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { UploadProgress } from '@/components/ui/upload-progress';

interface CommentInputProps {
  onSubmit: (content: string, imageFile?: File | null) => Promise<void>;
  sending: boolean;
  isReply?: boolean;
}

const CommentInput: React.FC<CommentInputProps> = ({ onSubmit, sending, isReply = false }) => {
  const { t } = useLanguage();
  const [commentText, setCommentText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Allow either text or images (or both)
    if (!commentText.trim() && !imageFile) {
      toast.error(t("Please enter a comment or attach an image", "请输入评论或附加图片"));
      return;
    }
    
    try {
      // Submit comment with image file directly (like messages)
      await onSubmit(commentText.trim(), imageFile);
      
      // Clear form on success
      setCommentText('');
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Comment submission failed:', error);
      toast.error(t("Failed to submit comment", "评论提交失败"));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        // Check file size (100MB limit)
        if (file.size > 100 * 1024 * 1024) {
          toast.error(t('Image must be less than 100MB', '图片必须小于100MB'));
          return;
        }
        
        setImageFile(file);
        setUploading(true);
        setUploadProgress(0);
        
        // Create image preview
        const reader = new FileReader();
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
          setUploading(false);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <UploadProgress 
        progress={uploadProgress} 
        fileName={imageFile?.name || ''}
        show={uploading} 
      />
      {imagePreview && (
        <div className="relative inline-block">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="h-20 rounded-md border border-border/50"
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
      <div className="relative">
        <Textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={isReply ? t("Write a reply...", "撰写回复...") : t("Add a comment...", "添加评论...")}
          className={`${isReply ? 'min-h-20 pr-24 pb-10' : 'min-h-28 pr-24 pb-10'} resize-none bg-muted/50 border-border focus:border-primary/60 focus:bg-background/80 transition-all duration-200 placeholder:text-muted-foreground/60`}
          disabled={sending}
        />
        {commentText.length > 0 && (
          <div className="absolute top-2 right-2 text-xs text-muted-foreground/60">
            {commentText.length}/1000
          </div>
        )}
        <div className="absolute bottom-2 right-2 flex gap-1">
          <label className="cursor-pointer group">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              disabled={sending}
              asChild
            >
              <div className="flex items-center justify-center">
                <ImagePlus className="h-4 w-4" />
              </div>
            </Button>
            <input 
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageSelect}
              disabled={sending}
            />
          </label>
          <Button 
            type="submit" 
            size="icon"
            className="h-8 w-8"
            disabled={sending || (!commentText.trim() && !imageFile)}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default CommentInput;
