
import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from 'framer-motion';

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    profiles?: {
      username: string | null;
      avatar_url: string | null;
    };
  };
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const { t } = useLanguage();
  const username = comment.profiles?.username || t("Anonymous", "匿名用户");
  const initial = username.charAt(0).toUpperCase();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex gap-3 p-3 bg-cosmic-800/20 rounded-lg border border-cosmic-600/20"
    >
      <Avatar className="h-8 w-8 border border-cosmic-700/30">
        {comment.profiles?.avatar_url ? (
          <AvatarImage src={comment.profiles.avatar_url} alt={username} />
        ) : (
          <AvatarFallback className="bg-cosmic-800 text-primary">{initial}</AvatarFallback>
        )}
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-medium text-gray-200 truncate">
            {username}
          </span>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {new Date(comment.created_at).toLocaleDateString()}
          </span>
        </div>
        <p className="text-gray-300 break-words">{comment.content}</p>
      </div>
    </motion.div>
  );
};

export default CommentItem;
