import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Send, Image, X, Smile, Plus, MapPin } from "lucide-react";
import { toast } from "sonner";
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import EmojiRenderer from './EmojiRenderer';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocationSharing } from '@/hooks/location/useLocationSharing';
import { UploadProgress } from '@/components/ui/upload-progress';
import { LinkPreview } from './LinkPreview';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from "@/components/ui/textarea";

interface LinkPreviewData {
  postId: string;
  postOwnerId: string;
  imageUrl: string;
  description: string;
  ownerUsername: string;
}

interface MessageInputProps {
  onSend: (text: string, imageFile?: File | null, locationData?: any) => void;
  sending: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, sending }) => {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [displayMessage, setDisplayMessage] = useState<React.ReactNode>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { gettingLocation, shareCurrentLocation } = useLocationSharing();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [linkPreview, setLinkPreview] = useState<LinkPreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  const handleSend = () => {
    if ((!message.trim() && !imageFile) || sending) return;
    
    onSend(message, imageFile);
    setMessage("");
    setDisplayMessage(null);
    setImageFile(null);
    setImagePreview(null);
    setLinkPreview(null);
    
    // Focus back on textarea after sending
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  // Update display message when message changes
  useEffect(() => {
    setDisplayMessage(<EmojiRenderer text={message} />);
  }, [message]);

  // Detect post links in message and fetch preview
  useEffect(() => {
    const detectPostLink = async () => {
      if (loadingPreview || linkPreview) return;
      
      // Regex to match post links
      const postLinkRegex = /https?:\/\/[^\s]+\/user\/([a-f0-9-]+)\?post=([a-f0-9-]+)/i;
      const match = message.match(postLinkRegex);
      
      if (match) {
        const [, userId, postId] = match;
        setLoadingPreview(true);
        
        try {
          // Fetch post data
          const { data: post, error: postError } = await supabase
            .from('user_posts')
            .select('*')
            .eq('id', postId)
            .single();
          
          if (postError) throw postError;
          
          // Fetch owner username
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', userId)
            .single();
          
          // Get image URL
          let imageUrl = '';
          if (post.images && Array.isArray(post.images) && post.images.length > 0) {
            const firstImage = post.images[0] as string;
            // Check if it's already a full URL or a storage path
            if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
              imageUrl = firstImage;
            } else {
              // It's a storage path, get public URL
              const { data } = supabase.storage
                .from('user-posts')
                .getPublicUrl(firstImage);
              imageUrl = data.publicUrl;
            }
          } else if (post.file_path) {
            const { data } = supabase.storage
              .from('user-posts')
              .getPublicUrl(post.file_path);
            imageUrl = data.publicUrl;
          }
          
          setLinkPreview({
            postId,
            postOwnerId: userId,
            imageUrl,
            description: post.description || '',
            ownerUsername: profile?.username || 'Unknown'
          });
        } catch (error) {
          console.error('Error fetching post preview:', error);
        } finally {
          setLoadingPreview(false);
        }
      }
    };
    
    detectPostLink();
  }, [message, loadingPreview, linkPreview]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(t('Image must be less than 5MB', '图片必须小于5MB'));
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
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
    setShowOptions(false);
  };

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleShareLocation = async () => {
    if (sending || gettingLocation) return;
    
    toast.info(t("Getting your location...", "正在获取您的位置..."));
    setShowOptions(false);
    
    const locationData = await shareCurrentLocation();
    if (locationData) {
      onSend("", null, locationData);
      toast.success(t("Location shared successfully", "位置已成功共享"));
    }
  };

  return (
    <div className="border-t border-cosmic-700/40 p-4 bg-gradient-to-t from-slate-900/95 via-slate-800/85 to-slate-700/70 space-y-3 sticky bottom-0 backdrop-blur-xl z-20 shadow-[0_-8px_24px_-12px_rgba(6,182,212,0.15)]">
      <UploadProgress 
        progress={uploadProgress} 
        fileName={imageFile?.name || ''}
        show={uploading} 
      />
      
      {linkPreview && (
        <LinkPreview 
          data={linkPreview} 
          onRemove={() => setLinkPreview(null)} 
        />
      )}
      
      {imagePreview && (
        <div className="relative inline-block">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="h-20 rounded-md border border-cosmic-700/50"
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
          <PopoverContent 
            className="p-2 bg-cosmic-900/95 border-cosmic-700 backdrop-blur-lg w-auto z-50"
            side="top"
            align="start"
            sideOffset={10}
          >
            <div className="flex gap-2">
              <Button
                className="flex flex-col items-center gap-1 w-16 h-16 p-1 rounded-lg hover:bg-cosmic-800/50"
                variant="ghost"
                onClick={triggerFileInput}
                disabled={sending || gettingLocation}
              >
                <div className="h-8 w-8 rounded-full bg-cosmic-800/50 flex items-center justify-center">
                  <Image className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs text-cosmic-300">
                  {t("Image", "图片")}
                </span>
              </Button>
              
              <Button
                className="flex flex-col items-center gap-1 w-16 h-16 p-1 rounded-lg hover:bg-cosmic-800/50"
                variant="ghost"
                onClick={handleShareLocation}
                disabled={sending || gettingLocation}
              >
                <div className="h-8 w-8 rounded-full bg-cosmic-800/50 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs text-cosmic-300">
                  {t("Location", "位置")}
                </span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        <div className="relative flex-grow">
          <Textarea
            ref={textareaRef}
            className="min-h-[45px] max-h-[120px] bg-muted/50 border-border resize-none pr-20 pb-2"
            placeholder={t("Type your message...", "输入您的消息...")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
          />
          <div className="absolute bottom-2 right-2 flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              className="h-8 w-8"
              onClick={handleSend}
              disabled={sending || (!message.trim() && !imageFile)}
            >
              <Send className={`h-4 w-4 ${sending ? 'animate-pulse' : ''}`} />
            </Button>
          </div>
          {showEmojiPicker && (
            <div className="absolute z-50 bottom-full mb-2 right-0">
              <div className="relative bg-background border border-border rounded-lg shadow-lg">
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border border-border z-10"
                  onClick={() => setShowEmojiPicker(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
                <EmojiPicker onEmojiClick={handleEmojiSelect} />
              </div>
            </div>
          )}
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={sending}
          />
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
