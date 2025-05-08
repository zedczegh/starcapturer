
import React from 'react';
import { getFormattedDate } from './utils/dateFormatUtils';
import { useLanguage } from "@/contexts/LanguageContext";

interface CommentContentProps {
  username?: string | null;
  createdAt: string;
  content: string;
  imageUrl?: string | null;
  isReply?: boolean;
}

const CommentContent: React.FC<CommentContentProps> = ({
  username,
  createdAt,
  content,
  imageUrl,
  isReply = false
}) => {
  const { t } = useLanguage();
  const formattedDate = getFormattedDate(createdAt);
  const displayName = username || t("Anonymous", "匿名用户");

  return (
    <div className={`${isReply ? 'bg-cosmic-800/30' : 'bg-cosmic-800/40'} rounded-lg p-${isReply ? '2' : '3'}`}>
      <div className="flex justify-between items-start">
        <span className={`font-medium ${isReply ? 'text-xs' : 'text-sm'} text-cosmic-200`}>
          {displayName}
        </span>
        <span className={`text-xs ${isReply ? 'text-cosmic-500' : 'text-cosmic-400'}`}>
          {formattedDate}
        </span>
      </div>
      
      <p className={`${isReply ? 'mt-0.5' : 'mt-1'} text-sm text-cosmic-100`}>
        {content}
      </p>
      
      {/* Image attachment */}
      {imageUrl && (
        <div className="mt-2">
          <img 
            src={imageUrl}
            alt={t(`${isReply ? 'Reply' : 'Comment'} attachment`, `${isReply ? '回复' : '评论'}附件`)}
            className={`${isReply ? 'max-h-32' : 'max-h-48'} rounded-md border border-cosmic-700/50`}
            onError={(e) => {
              // Handle image loading errors
              console.error(`Failed to load ${isReply ? 'reply' : 'comment'} image:`, imageUrl);
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CommentContent;
