
import React from "react";
import { User } from "lucide-react";
import { motion } from "framer-motion";
import ProfileTag from "@/components/profile/ProfileTag";
import { AdminBadgeForUser } from "@/components/profile/AdminBadge";
import type { ProfileData } from "@/utils/profile/profileCore";

interface ProfileHeaderProps {
  profile: ProfileData;
  userId?: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, userId }) => {
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

  return (
    <div className="flex gap-4 items-center mb-6">
      {profile.avatar_url ? (
        <img src={profile.avatar_url} alt="avatar" className="w-20 h-20 rounded-full object-cover shadow-lg" />
      ) : (
        <div className="w-20 h-20 flex items-center justify-center rounded-full bg-cosmic-800/60 shadow-lg">
          <User className="w-10 h-10 text-cosmic-400" />
        </div>
      )}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-2xl font-bold text-white">
            {profile.username ? `@${profile.username}` : "Stargazer"}
          </h2>
          {userId && <AdminBadgeForUser userId={userId} size="sm" />}
        </div>
        {profile.tags && profile.tags.length > 0 && (
          <motion.div 
            className="mt-2 flex flex-wrap gap-2"
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
  );
};

export default ProfileHeader;
