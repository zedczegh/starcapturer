
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMessageNavigation } from "@/hooks/useMessageNavigation";
import { fetchUserProfile } from "@/utils/profileUtils";
import type { ProfileData } from "@/utils/profile/profileCore";
import ProfileTag from "@/components/profile/ProfileTag";
import { motion } from "framer-motion";

const ProfileMini: React.FC = () => {
  const { id: profileId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();
  
  // Check if we came from messages to hide the "Send message" button
  const isFromMessages = location.state?.fromMessages;
  const { activeConversation } = useMessageNavigation();

  useEffect(() => {
    if (!profileId) return;
    
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("Loading profile in ProfileMini for user:", profileId);
        
        // Simply fetch the profile without trying to ensure it exists
        // This fixes the permission error when viewing other profiles
        const profileData = await fetchUserProfile(profileId);
        
        if (profileData) {
          console.log("Profile loaded in ProfileMini:", profileData);
          setProfile({
            username: profileData.username || "Stargazer",
            avatar_url: profileData.avatar_url,
            tags: profileData.tags || [],
          });
        } else {
          setProfile({
            username: "Stargazer",
            avatar_url: null,
            tags: [],
          });
        }
      } catch (err) {
        console.error("Exception fetching profile data in ProfileMini:", err);
        setError("Failed to load profile");
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [profileId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-cosmic-900">{t("Loading...", "加载中...")}</div>;
  }
  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cosmic-900 text-white">
        <User className="w-10 h-10 mb-4 text-cosmic-400" />
        <div>{t("User not found.", "找不到用户。")}</div>
        <Button className="mt-4" onClick={() => navigate(-1)}>{t("Back", "返回")}</Button>
      </div>
    );
  }

  const handleSendMessage = () => {
    if (!profileId) return;
    
    // Navigate directly to messages page with the profileId
    navigate(`/messages`, { 
      state: { 
        selectedUserId: profileId,
        selectedUsername: profile.username
      } 
    });
  };

  // Animation variants for tags container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      } 
    }
  };
  
  // Animation variants for individual tags
  const tagVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950 flex flex-col items-center px-4 pt-20">
      <Card className="max-w-xl w-full mx-auto mt-4 glassmorphism p-8 rounded-xl shadow-glow">
        <div className="flex gap-4 items-center mb-6">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-20 h-20 rounded-full object-cover shadow-lg border-2 border-primary/30" />
          ) : (
            <div className="w-20 h-20 flex items-center justify-center rounded-full bg-cosmic-800/60 shadow-lg border-2 border-primary/20">
              <User className="w-10 h-10 text-cosmic-400" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-white">
              {profile.username ? `@${profile.username}` : t("Stargazer", "星空观察者")}
            </h2>
            
            {/* Tag display with animations - only show if there are tags */}
            {profile.tags && profile.tags.length > 0 && (
              <motion.div 
                className="mt-3 flex flex-wrap gap-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {profile.tags.map(tag => (
                  <motion.div key={tag} variants={tagVariants}>
                    <ProfileTag tag={tag} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between mt-6">
          {!isFromMessages && user && user.id !== profileId && (
            <Button
              onClick={handleSendMessage}
              className="w-full mr-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-md"
            >
              {t("Send Message", "发送消息")}
            </Button>
          )}
          <Button 
            variant="secondary" 
            onClick={() => navigate(-1)}
            className={isFromMessages || (user && user.id !== profileId) ? "" : "w-full"}
          >
            {t("Back", "返回")}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ProfileMini;
