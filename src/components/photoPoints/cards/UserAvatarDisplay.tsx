
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useCreatorProfile from "@/hooks/astro-spots/useCreatorProfile";
import { AdminBadgeForUser } from '@/components/profile/AdminBadge';

interface UserAvatarDisplayProps {
  userId?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const UserAvatarDisplay: React.FC<UserAvatarDisplayProps> = ({ 
  userId, 
  className = "",
  size = "sm"
}) => {
  const { creatorProfile } = useCreatorProfile(userId);
  
  if (!userId) return null;
  
  // Determine avatar size based on the size prop
  const sizeClass = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  }[size];
  
  return (
    <div className={`relative ${className}`}>
      <Avatar className={`${sizeClass} border border-cosmic-700/50`}>
        <AvatarImage src={creatorProfile?.avatar_url} alt={creatorProfile?.username || 'User'} />
        <AvatarFallback className="bg-primary/20 text-primary-foreground text-xs">
          {creatorProfile?.username?.substring(0, 2)?.toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>
      {size !== "sm" && userId && (
        <div className="absolute -top-1 -right-1 scale-75">
          <AdminBadgeForUser userId={userId} size="sm" />
        </div>
      )}
    </div>
  );
};

export default UserAvatarDisplay;
