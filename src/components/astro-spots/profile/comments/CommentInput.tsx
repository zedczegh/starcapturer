
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, ImagePlus, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCommentImageUpload } from "@/hooks/comments/useCommentImageUpload";
import { toast } from "sonner";

interface CommentInputProps {
  onSubmit: (content: string, images?: File[], imageUrls?: string[]) => Promise<void>;
  sending: boolean;
  isReply?: boolean;
}

const CommentInput: React.FC<CommentInputProps> = ({ onSubmit, sending, isReply = false }) => {
  const { t } = useLanguage();
  const { uploadImages, uploading, uploadProgress } = useCommentImageUpload();
  const [commentText, setCommentText] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Allow either text or images (or both)
    if (!commentText.trim() && imageFiles.length === 0) {
      toast.error(t("Please enter a comment or attach an image", "请输入评论或附加图片"));
      return;
    }
    
    try {
      // Upload images first if any
      let uploadedImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        console.log('CommentInput: Uploading images before submitting comment');
        uploadedImageUrls = await uploadImages(imageFiles);
        
        // If we had files but no successful uploads, don't submit
        if (imageFiles.length > 0 && uploadedImageUrls.length === 0) {
          console.error('CommentInput: All image uploads failed, aborting comment submission');
          toast.error(t("Image upload failed, comment not submitted", "图片上传失败，评论未提交"));
          return;
        }
        
        console.log(`CommentInput: Successfully uploaded ${uploadedImageUrls.length}/${imageFiles.length} images`);
      }
      
      // Submit comment with uploaded image URLs
      console.log('CommentInput: Submitting comment with URLs:', uploadedImageUrls);
      await onSubmit(commentText.trim(), [], uploadedImageUrls);
      
      // Clear form on success
      setCommentText('');
      setImageFiles([]);
      setImagePreviews([]);
    } catch (error) {
      console.error('Comment submission failed:', error);
      toast.error(t("Failed to submit comment", "评论提交失败"));
    }
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
        
        // Validate file size (60MB limit)
        if (file.size > 60 * 1024 * 1024) {
          toast.error(t(`${file.name} must be less than 60MB`, `${file.name} 必须小于60MB`));
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={isReply ? t("Write a reply...", "撰写回复...") : t("Add a comment...", "添加评论...")}
          className={`${isReply ? 'min-h-20' : 'min-h-28'} resize-none bg-background/50 border-border/50 focus:border-primary/60 focus:bg-background/80 transition-all duration-200 placeholder:text-muted-foreground/60`}
          disabled={sending}
        />
        {commentText.length > 0 && (
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground/60">
            {commentText.length}/1000
          </div>
        )}
      </div>

      {imagePreviews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square overflow-hidden rounded-lg border border-border/50 bg-muted/30">
                <img 
                  src={preview} 
                  alt={isReply ? `Reply attachment ${index + 1} preview` : `Comment attachment ${index + 1} preview`}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute -top-2 -right-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full p-1.5 shadow-md transition-colors duration-200 opacity-0 group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <label className="cursor-pointer group">
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 group-hover:scale-105">
            <ImagePlus className="h-4 w-4" />
            <span>{t("Add Image", "添加图片")}</span>
          </div>
          <input 
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            disabled={sending || uploading}
          />
        </label>
        <Button 
          type="submit" 
          size="sm" 
          disabled={sending || uploading || (!commentText.trim() && imageFiles.length === 0)}
          className="min-w-20 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 hover:scale-105 disabled:scale-100"
        >
          {(sending || uploading) ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
              {uploading ? `${Math.round(uploadProgress)}%` : (isReply ? t("Reply", "回复") : t("Submit", "提交"))}
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-1" />
              {isReply ? t("Reply", "回复") : t("Submit", "提交")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default CommentInput;
