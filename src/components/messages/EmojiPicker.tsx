
import React from 'react';
import { Smile } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { siqsEmojis } from "./SiqsEmojiData";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
  const { t } = useLanguage();
  
  // Group emojis by categories
  const siqsConditionEmojis = siqsEmojis.filter(emoji => emoji.category === "siqs");
  const locationEmojis = siqsEmojis.filter(emoji => emoji.category === "location");
  
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
      <DropdownMenuContent align="start" className="p-2 bg-cosmic-900/95 border-cosmic-700 backdrop-blur-lg w-72">
        <Tabs defaultValue="siqs">
          <TabsList className="grid w-full grid-cols-2 mb-2">
            <TabsTrigger value="siqs">{t("SIQS Emojis", "SIQS 表情")}</TabsTrigger>
            <TabsTrigger value="location">{t("Location Emojis", "位置表情")}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="siqs" className="mt-0">
            <div className="grid grid-cols-3 gap-2">
              {siqsConditionEmojis.map((emoji) => (
                <DropdownMenuItem
                  key={emoji.id}
                  className="flex flex-col items-center justify-center p-2 hover:bg-cosmic-800/50 cursor-pointer rounded-lg transition-all hover:scale-110"
                  onClick={() => onEmojiSelect(`[${emoji.id}]`)}
                >
                  <div className="p-1 transform hover:scale-110 transition-transform">
                    {emoji.icon}
                  </div>
                  <span className="text-xs text-cosmic-300 mt-1 text-center">
                    {emoji.name}
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="location" className="mt-0">
            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
              {locationEmojis.map((emoji) => (
                <DropdownMenuItem
                  key={emoji.id}
                  className="flex flex-col items-center justify-center p-2 hover:bg-cosmic-800/50 cursor-pointer rounded-lg transition-all hover:scale-110"
                  onClick={() => onEmojiSelect(`[${emoji.id}]`)}
                >
                  <div className="p-1 transform hover:scale-110 transition-transform">
                    {emoji.icon}
                  </div>
                  <span className="text-xs text-cosmic-300 mt-1 text-center">
                    {emoji.name}
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EmojiPicker;
