
import React, { useState, useCallback } from 'react';
import { Send, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from "@/components/ui/use-toast"
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import { useTheme } from 'next-themes';
import { extractLocationFromUrl } from '@/utils/locationLinkParser';

interface MessageInputProps {
  onSend: (message: string, imageUrl?: string | null, locationData?: any) => Promise<void>;
  sending: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, sending }) => {
  const [inputValue, setInputValue] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationData, setLocationData] = useState<any>(null);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { theme } = useTheme();
  
  // Simplified onDrop without using the file resizer library
  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    if (file) {
      setImageFile(file);
    }
  }, []);
  
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {'image/*': []},
    maxFiles: 1,
    disabled: sending,
  });
  
  const handleLocationToggle = () => {
    if (!locationEnabled) {
      if (navigator.geolocation) {
        setInputValue(t("Fetching location...", "获取位置信息中..."));
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocationData({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              name: t("My Current Location", "我的当前位置"),
              timestamp: new Date(position.timestamp).toISOString()
            });
            setInputValue(`${t("Location", "位置")}: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
            setLocationEnabled(true);
          },
          (error) => {
            console.error("Error getting location:", error);
            toast({
              title: t("Error", "错误"),
              description: t("Could not retrieve location", "无法获取位置信息"),
              variant: "destructive",
            });
            setInputValue('');
            setLocationEnabled(false);
          }
        );
      } else {
        toast({
          title: t("Error", "错误"),
          description: t("Geolocation is not supported by this browser", "该浏览器不支持地理位置功能"),
          variant: "destructive",
        });
      }
    } else {
      setLocationData(null);
      setInputValue('');
      setLocationEnabled(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  
  const handleRemoveImage = () => {
    setImageFile(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: t("Error", "错误"),
        description: t("You must be logged in to send messages", "您必须登录才能发送消息"),
        variant: "destructive",
      });
      return;
    }
    
    if (!inputValue.trim() && !imageFile && !locationData) {
      return;
    }

    // Check if the message contains a location URL
    const extractedLocation = extractLocationFromUrl(inputValue);
    if (extractedLocation) {
      console.log("Message contains location link, extracted data:", extractedLocation);
    }
    
    try {
      if (imageFile) {
        // In a real implementation, we would upload the file to a storage service
        // For now, let's create a local object URL as a placeholder
        const imageUrl = URL.createObjectURL(imageFile);
        await onSend('', imageUrl);
      } else if (extractedLocation) {
        // Send just the extracted location data, with blank text to hide the URL
        await onSend('', null, extractedLocation);
      } else {
        // Send text message or location data
        await onSend(inputValue, null, locationData);
      }
      
      // Clear input and states after sending
      setInputValue('');
      setImageFile(null);
      setLocationData(null);
      setLocationEnabled(false);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: t("Error", "错误"),
        description: t("Failed to send message", "发送消息失败"),
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="border-t border-cosmic-800/30 bg-gradient-to-t from-cosmic-950/60 to-transparent p-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleLocationToggle}
            disabled={sending}
            className="h-9 w-9"
          >
            <MapPin className="h-4 w-4" fill={locationEnabled ? "currentColor" : "none"} />
            <span className="sr-only">Toggle location</span>
          </Button>
          
          <div
            {...getRootProps()}
            className={`relative rounded-full overflow-hidden h-9 w-9 flex items-center justify-center border border-dashed border-cosmic-700/50 hover:border-primary/50 transition-colors duration-200 ${sending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <input {...getInputProps()} />
            <Button type="button" variant="ghost" size="icon" disabled={sending} className="h-9 w-9">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm-1.5 14.75a.75.75 0 01.75-.75h2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-.75.75h-2.25a.75.75 0 01-.75-.75v-2.25zm4.5-8.25a3 3 0 11-6 0 3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="sr-only">{t("Attach image", "附加图片")}</span>
            </Button>
          </div>
          
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={`${t("Type a message", "输入消息")}...`}
            disabled={sending}
            className="flex-1 rounded-full bg-cosmic-900/50 border-cosmic-700/50 text-cosmic-100 focus-visible:ring-cosmic-300/30 focus-visible:border-primary/40 shadow-sm"
          />
          
          <Button
            type="submit"
            disabled={sending}
            className="rounded-full h-9 w-9 p-0 bg-primary text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50"
            style={{ minWidth: 'unset', padding: 0 }}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">{t("Send", "发送")}</span>
          </Button>
        </div>
      </form>
      
      {imageFile && (
        <div className="relative mt-2">
          <img
            src={URL.createObjectURL(imageFile)}
            alt="Attached"
            className="w-24 h-24 rounded-md object-cover"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemoveImage}
            className="absolute top-0 right-0 h-6 w-6 rounded-full p-0 bg-cosmic-900/50 text-cosmic-300 hover:text-cosmic-100 hover:bg-cosmic-800/70"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-3 h-3"
            >
              <path
                fillRule="evenodd"
                d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 5.47z"
                clipRule="evenodd"
              />
            </svg>
            <span className="sr-only">{t("Remove", "删除")}</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
