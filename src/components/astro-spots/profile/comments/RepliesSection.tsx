
import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Comment } from '../types/comments';
import ReplyItem from './ReplyItem';

interface RepliesSectionProps {
  replies: Comment[];
}

const RepliesSection: React.FC<RepliesSectionProps> = ({ replies }) => {
  const { t } = useLanguage();
  const [showAllReplies, setShowAllReplies] = React.useState(false);
  
  // Determine if we should collapse replies
  const hasReplies = replies && replies.length > 0;
  const hasMoreThanFiveReplies = hasReplies && replies.length > 5;
  const visibleReplies = showAllReplies || !hasMoreThanFiveReplies 
    ? replies || []
    : (replies || []).slice(0, 5);

  if (!hasReplies) return null;

  const handleToggleReplies = () => {
    setShowAllReplies(!showAllReplies);
  };

  return (
    <div className="mt-3 space-y-3">
      {visibleReplies.map((reply) => (
        <ReplyItem key={reply.id} reply={reply} />
      ))}
      
      {/* View more/less replies toggle */}
      {hasMoreThanFiveReplies && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleReplies}
          className="text-xs text-cosmic-400 hover:text-cosmic-200 p-1 h-auto ml-4"
        >
          {showAllReplies ? (
            <>
              <ChevronUp className="h-3.5 w-3.5 mr-1" />
              {t("Show less replies", "显示更少回复")}
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5 mr-1" />
              {t("Show all replies", "显示所有回复")} 
              ({replies.length - 5} {t("more", "更多")})
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default RepliesSection;
