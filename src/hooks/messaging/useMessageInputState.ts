
import { useState, useRef } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { useLocationSharing } from '@/hooks/location/useLocationSharing';

export const useMessageInputState = (
  onSend: (text: string, imageFile?: File | null, locationData?: any) => void,
  sending: boolean
) => {
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
  
  const handleSend = () => {
    if ((!message.trim() && !imageFile) || sending) return;
    
    onSend(message, imageFile);
    setMessage("");
    setDisplayMessage(null);
    setImageFile(null);
    setImagePreview(null);
    
    // Focus back on textarea after sending
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };
  
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
        
        // Create image preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
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

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    setShowOptions(false);
  };

  const handleEmojiSelect = (emojiTag: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newMessage = message.substring(0, start) + emojiTag + message.substring(end);
      setMessage(newMessage);
      
      // Focus back on textarea and place cursor after the inserted emoji
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = start + emojiTag.length;
          textareaRef.current.selectionStart = newCursorPos;
          textareaRef.current.selectionEnd = newCursorPos;
        }
      }, 10);
    }
    
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
  
  return {
    message,
    setMessage,
    displayMessage,
    setDisplayMessage,
    imageFile,
    imagePreview,
    fileInputRef,
    textareaRef,
    showOptions,
    setShowOptions,
    showEmojiPicker,
    setShowEmojiPicker,
    gettingLocation,
    handleSend,
    handleKeyDown,
    handleFileChange,
    handleRemoveImage,
    triggerFileInput,
    toggleEmojiPicker,
    handleEmojiSelect,
    handleShareLocation
  };
};
