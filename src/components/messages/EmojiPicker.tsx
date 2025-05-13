
import React, { useState } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { siqsEmojis } from './SiqsEmojiData';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("siqs");
  
  // Group emojis by categories
  const siqsConditionEmojis = siqsEmojis.filter(emoji => emoji.category === "siqs");
  const locationEmojis = siqsEmojis.filter(emoji => emoji.category === "location");
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  return (
    <div className="w-full">
      <Tabs defaultValue="siqs" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-2">
          <TabsTrigger value="siqs">{t("SIQS Emojis", "SIQS 表情")}</TabsTrigger>
          <TabsTrigger value="location">{t("Location Emojis", "位置表情")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="siqs" className="mt-0">
          <div className="grid grid-cols-3 gap-2">
            {siqsConditionEmojis.map((emoji) => (
              <Button
                key={emoji.id}
                variant="ghost"
                className="flex flex-col items-center justify-center p-2 hover:bg-cosmic-800/50 cursor-pointer rounded-lg transition-all hover:scale-110 h-auto"
                onClick={() => onEmojiSelect(`[${emoji.id}]`)}
              >
                <div className="p-1 transform hover:scale-110 transition-transform">
                  {emoji.icon}
                </div>
                <span className="text-xs text-cosmic-300 mt-1 text-center line-clamp-1">
                  {emoji.name}
                </span>
              </Button>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="location" className="mt-0">
          <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            {locationEmojis.map((emoji) => (
              <Button
                key={emoji.id}
                variant="ghost"
                className="flex flex-col items-center justify-center p-2 hover:bg-cosmic-800/50 cursor-pointer rounded-lg transition-all hover:scale-110 h-auto"
                onClick={() => onEmojiSelect(`[${emoji.id}]`)}
              >
                <div className="p-1 transform hover:scale-110 transition-transform">
                  {emoji.icon}
                </div>
                <span className="text-xs text-cosmic-300 mt-1 text-center line-clamp-1">
                  {emoji.name}
                </span>
              </Button>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmojiPicker;
