
import React from 'react';
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Image, Smile, MapPin } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface MessageOptionsProps {
  sending: boolean;
  gettingLocation: boolean;
  onImageSelect: () => void;
  onEmojiToggle: () => void;
  onShareLocation: () => void;
}

const MessageOptions: React.FC<MessageOptionsProps> = ({
  sending,
  gettingLocation,
  onImageSelect,
  onEmojiToggle,
  onShareLocation,
}) => {
  const { t } = useLanguage();
  
  return (
    <PopoverContent 
      className="p-2 bg-cosmic-900/95 border-cosmic-700 backdrop-blur-lg w-auto"
      side="top"
      align="start"
      sideOffset={10}
    >
      <div className="flex gap-2">
        <Button
          className="flex flex-col items-center gap-1 w-16 h-16 p-1 rounded-lg hover:bg-cosmic-800/50"
          variant="ghost"
          onClick={onImageSelect}
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
          onClick={onEmojiToggle}
          disabled={sending}
        >
          <div className="h-8 w-8 rounded-full bg-cosmic-800/50 flex items-center justify-center">
            <Smile className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs text-cosmic-300">
            {t("Emoji", "表情")}
          </span>
        </Button>
        
        <Button
          className="flex flex-col items-center gap-1 w-16 h-16 p-1 rounded-lg hover:bg-cosmic-800/50"
          variant="ghost"
          onClick={onShareLocation}
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
  );
};

export default MessageOptions;
