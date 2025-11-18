
import React from "react";
import { User, Users, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import ProfileTag from "@/components/profile/ProfileTag";
import { AdminBadgeForUser } from "@/components/profile/AdminBadge";
import { Button } from "@/components/ui/button";
import { useFollow } from "@/hooks/profile/useFollow";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ProfileData } from "@/utils/profile/profileCore";

interface ProfileHeaderProps {
  profile: ProfileData;
  userId?: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, userId }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isFollowing, followerCount, followingCount, toggleFollow, loading } = useFollow(userId);
  
  // Animation variants for staggered tag animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const isOwnProfile = user?.id === userId;

  return (
    <div className="mb-6">
      <div className="flex gap-4 items-start">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="avatar" className="w-20 h-20 rounded-full object-cover shadow-lg" />
        ) : (
          <div className="w-20 h-20 flex items-center justify-center rounded-full bg-cosmic-800/60 shadow-lg">
            <User className="w-10 h-10 text-cosmic-400" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-white">
              {profile.username ? `@${profile.username}` : "Stargazer"}
            </h2>
            {userId && <AdminBadgeForUser userId={userId} size="sm" />}
          </div>
          
          {/* Follow stats */}
          <div className="flex items-center gap-4 mt-2 mb-3">
            <div className="flex items-center gap-1 text-sm text-cosmic-300">
              <Users className="w-4 h-4" />
              <span className="font-semibold text-white">{followerCount}</span>
              <span>{t("Followers", "关注者")}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-cosmic-300">
              <UserPlus className="w-4 h-4" />
              <span className="font-semibold text-white">{followingCount}</span>
              <span>{t("Following", "关注中")}</span>
            </div>
          </div>

          {/* Follow button - only show on other users' profiles */}
          {!isOwnProfile && user && (
            <Button
              onClick={toggleFollow}
              disabled={loading}
              variant={isFollowing ? "secondary" : "default"}
              size="sm"
              className="gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {isFollowing ? t("Unfollow", "取消关注") : t("Follow", "关注")}
            </Button>
          )}

          {profile.tags && profile.tags.length > 0 && (
            <motion.div 
              className="mt-3 flex flex-wrap gap-2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {profile.tags.map((tag) => (
                <motion.div key={tag} variants={itemVariants}>
                  <ProfileTag tag={tag} size="sm" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
