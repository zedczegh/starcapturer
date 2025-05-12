
import React from 'react';
import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface LoadingStateProps {
  isMobile: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ isMobile }) => {
  const { t } = useLanguage();
  
  return (
    <div className={`${isMobile ? 'p-4' : 'p-8'} flex flex-col items-center justify-center space-y-3 text-cosmic-400`}>
      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"/>
      <p className="text-sm">{t("Loading conversations...", "加载对话中...")}</p>
    </div>
  );
};

interface EmptyStateProps {
  isMobile: boolean;
  searchQuery: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ isMobile, searchQuery }) => {
  const { t } = useLanguage();
  
  return (
    <div className={`${isMobile ? 'p-4' : 'p-8'} text-center text-cosmic-400 space-y-2`}>
      <MessageCircle className="mx-auto h-12 w-12 opacity-30 mb-2" />
      <p>
        {searchQuery 
          ? t("No conversations match your search", "没有匹配的对话") 
          : t("No conversations yet", "暂无对话")
        }
      </p>
    </div>
  );
};
