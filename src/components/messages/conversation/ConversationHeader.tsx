
import React from 'react';
import { Search, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from '@/hooks/use-mobile';

interface ConversationHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  searchQuery,
  onSearchChange
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  return (
    <div className={`${isMobile ? 'p-2 pb-3' : 'p-4'} border-b border-cosmic-800/50 bg-slate-900/50`}>
      <h2 className={`${isMobile ? 'text-lg mb-2' : 'text-xl mb-4'} font-semibold text-white flex items-center gap-2`}>
        <MessageCircle className="h-5 w-5 text-primary" /> {t("Messages", "消息")}
      </h2>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cosmic-400" />
        <Input 
          placeholder={t("Search conversations", "搜索对话")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-cosmic-800/30 border-cosmic-700/50 focus:border-primary/50 focus:ring-primary/20
            placeholder:text-cosmic-500"
        />
      </div>
    </div>
  );
};

export default ConversationHeader;
