
import React from 'react';
import { Smile } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { siqsEmojis } from "./SiqsEmojiData";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
  const { t } = useLanguage();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-0 h-8 w-8 rounded-full text-cosmic-400 hover:text-primary hover:bg-cosmic-800/30"
          aria-label={t("Insert emoji", "插入表情")}
        >
          <Smile className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="p-2 bg-cosmic-900/95 border-cosmic-700 backdrop-blur-lg">
        <DropdownMenuLabel className="text-cosmic-200">
          {t("SIQS Emojis", "SIQS 表情")}
        </DropdownMenuLabel>
        <div className="grid grid-cols-3 gap-2 mt-1">
          {siqsEmojis.map((emoji) => (
            <DropdownMenuItem
              key={emoji.id}
              className="flex flex-col items-center justify-center p-2 hover:bg-cosmic-800/50 cursor-pointer rounded-lg"
              onClick={() => onEmojiSelect(`[${emoji.id}]`)}
            >
              <div className="p-1">
                {emoji.icon}
              </div>
              <span className="text-xs text-cosmic-300 mt-1 text-center">
                {emoji.name}
              </span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EmojiPicker;
