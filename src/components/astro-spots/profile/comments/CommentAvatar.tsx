
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";

interface CommentAvatarProps {
  avatarUrl?: string | null;
  username?: string | null;
  size?: 'sm' | 'md';
}

const CommentAvatar: React.FC<CommentAvatarProps> = ({
  avatarUrl,
  username,
  size = 'md'
}) => {
  const { t } = useLanguage();
  const displayName = username || t("Anonymous", "匿名用户");
  const userInitial = displayName.charAt(0).toUpperCase();
  
  const avatarSize = size === 'sm' ? "w-7 h-7" : "w-9 h-9";
  const fallbackSize = size === 'sm' ? "text-xs" : "text-sm";

  return (
    <Avatar className={avatarSize}>
      {avatarUrl ? (
        <AvatarImage 
          src={avatarUrl} 
          alt={displayName} 
          className="object-cover"
        />
      ) : (
        <AvatarFallback className={`bg-cosmic-800 text-cosmic-200 ${fallbackSize}`}>
          {userInitial}
        </AvatarFallback>
      )}
    </Avatar>
  );
};

export default CommentAvatar;
