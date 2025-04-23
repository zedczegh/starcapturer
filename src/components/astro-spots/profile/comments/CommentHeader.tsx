
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface CommentHeaderProps {
  commentCount: number;
  onViewAll: () => void;
  showViewAll?: boolean;
}

const CommentHeader: React.FC<CommentHeaderProps> = ({
  commentCount,
  onViewAll,
  showViewAll = false,
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold text-gray-200 flex items-center">
        <MessageCircle className="h-5 w-5 mr-2 text-primary/80" />
        {t("Comments", "评论")} ({commentCount})
      </h2>
      
      {showViewAll && (
        <Button 
          variant="ghost" 
          onClick={onViewAll}
          className="text-sm text-primary hover:bg-cosmic-700/30"
        >
          {t("View All", "查看全部")}
        </Button>
      )}
    </div>
  );
};

export default CommentHeader;
