
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface CommentProfile {
  username?: string;
  avatar_url?: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles?: CommentProfile | null;
}

interface SpotCommentsProps {
  comments: Comment[];
  onShowAllComments: () => void;
}

const SpotComments: React.FC<SpotCommentsProps> = ({ comments, onShowAllComments }) => {
  const { t } = useLanguage();

  const getUsername = (comment: Comment): string => {
    if (!comment || !comment.profiles) return t("Anonymous", "匿名用户");
    if (comment.profiles.username) {
      return comment.profiles.username;
    }
    return t("Anonymous", "匿名用户");
  };

  if (!comments || comments.length === 0) {
    return (
      <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30 flex flex-col items-center justify-center text-center">
        <MessageCircle className="h-10 w-10 text-gray-500 mb-2" />
        <p className="text-gray-400">
          {t("No comments yet", "暂无评论")}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold text-gray-200 flex items-center">
          <MessageCircle className="h-5 w-5 mr-2 text-primary/80" />
          {t("Comments", "评论")} ({comments.length})
        </h2>
        
        <Button 
          variant="ghost" 
          onClick={onShowAllComments}
          className="text-sm text-primary hover:bg-cosmic-700/30"
        >
          {t("View All", "查看全部")}
        </Button>
      </div>
      
      <div className="space-y-3">
        {comments.slice(0, 2).map((comment) => (
          <div 
            key={comment.id}
            className="p-3 bg-cosmic-800/20 rounded-lg border border-cosmic-600/20"
          >
            <div className="flex items-center mb-2">
              <div className="font-medium text-gray-200">
                {getUsername(comment)}
              </div>
              <span className="text-gray-500 text-sm ml-2">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-300">{comment.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpotComments;
