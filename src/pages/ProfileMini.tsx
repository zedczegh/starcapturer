
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
import { toast } from "sonner";
import ProfileTag from "@/components/profile/ProfileTag";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 as Loader } from "@/components/ui/loader"; // Fixed the import to use Loader2 as Loader
import PhotoLocationCard from "@/components/photoPoints/PhotoLocationCard";

const ProfileMini: React.FC = () => {
  const { id: profileId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t, language } = useLanguage();
  const [userAstroSpots, setUserAstroSpots] = useState<any[]>([]);
  const [loadingSpots, setLoadingSpots] = useState(false);
  
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
            bio: profileData.bio,
            tags: profileData.tags || [],
          });
        } else {
          setProfile({
            username: "Stargazer",
            avatar_url: null,
            bio: null,
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

  useEffect(() => {
    const fetchUserAstroSpots = async () => {
      if (!profileId) return;
      
      setLoadingSpots(true);
      try {
        const { data, error } = await supabase
          .from('user_astro_spots')
          .select(`
            id,
            name,
            latitude,
            longitude,
            bortlescale,
            siqs,
            description,
            created_at
          `)
          .eq('user_id', profileId)
          .order('created_at', { ascending: false })
          .limit(3);  // Limit to 3 most recent spots for the mini profile
        
        if (error) throw error;
        
        console.log("User astro spots:", data);
        setUserAstroSpots(data || []);
      } catch (err) {
        console.error("Error fetching user astro spots:", err);
        toast.error(t("Failed to load astro spots", "加载观星点失败"));
      } finally {
        setLoadingSpots(false);
      }
    };
    
    fetchUserAstroSpots();
  }, [profileId, t]);

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

  const handleViewDetails = (location: any) => {
    navigate(`/astro-spot/${location.id}`);
  };

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
    <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950 flex flex-col items-center px-4 pt-20">
      <Card className="max-w-xl w-full mx-auto mt-4 glassmorphism p-8 rounded-xl shadow-glow">
        <div className="flex gap-4 items-center mb-6">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-20 h-20 rounded-full object-cover shadow-lg" />
          ) : (
            <div className="w-20 h-20 flex items-center justify-center rounded-full bg-cosmic-800/60 shadow-lg">
              <User className="w-10 h-10 text-cosmic-400" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-white">
              {profile.username ? `@${profile.username}` : t("Stargazer", "星空观察者")}
            </h2>
            {profile.tags && profile.tags.length > 0 && (
              <motion.div 
                className="mt-2 flex flex-wrap gap-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {profile.tags.map((tag, index) => (
                  <motion.div key={tag} variants={itemVariants}>
                    <ProfileTag tag={tag} size="sm" />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Bio section */}
        {profile.bio && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 bg-cosmic-800/40 p-4 rounded-lg border border-cosmic-700/30"
          >
            <h3 className="text-cosmic-200 text-sm font-medium mb-2">{t("About", "关于")}</h3>
            <p className="text-cosmic-100 text-sm">{profile.bio}</p>
          </motion.div>
        )}
        
        {/* User's AstroSpots section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 mb-6"
        >
          <h3 className="text-cosmic-200 text-sm font-medium mb-3">
            {t("AstroSpots Created", "创建的观星点")}
          </h3>
          
          {loadingSpots ? (
            <div className="flex justify-center py-6">
              <Loader className="w-6 h-6 text-primary" />
            </div>
          ) : userAstroSpots.length > 0 ? (
            <div className="space-y-4">
              {userAstroSpots.map((spot, index) => (
                <div 
                  key={spot.id}
                  className="cursor-pointer transition duration-200 hover:scale-[1.02]"
                >
                  <PhotoLocationCard
                    location={{
                      id: spot.id,
                      name: spot.name,
                      latitude: spot.latitude,
                      longitude: spot.longitude,
                      bortleScale: spot.bortlescale,
                      siqs: spot.siqs,
                      timestamp: spot.created_at,
                      user_id: profileId
                    }}
                    index={index}
                    onViewDetails={() => handleViewDetails(spot)}
                    showRealTimeSiqs={true}
                  />
                </div>
              ))}
              
              {userAstroSpots.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2" 
                  onClick={() => navigate(`/community?userId=${profileId}`)}
                >
                  {t("View All AstroSpots", "查看所有观星点")}
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-4 bg-cosmic-800/30 rounded-lg border border-cosmic-700/30">
              <p className="text-cosmic-400 text-sm">{t("No AstroSpots created yet", "暂无创建的观星点")}</p>
            </div>
          )}
        </motion.div>
        
        <div className="flex justify-between mt-6">
          {!isFromMessages && user && user.id !== profileId && (
            <Button
              onClick={handleSendMessage}
              className="w-full mr-2"
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
