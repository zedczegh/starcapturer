
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMessageNavigation } from "@/hooks/useMessageNavigation";
import { fetchUserProfile } from "@/utils/profileUtils";
import type { ProfileData } from "@/utils/profile/profileCore";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { sortLocationsBySiqs } from "@/utils/siqsHelpers";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import the newly created components
import ProfileHeader from "@/components/profile/mini/ProfileHeader";
import ProfileBio from "@/components/profile/mini/ProfileBio";
import ProfileAstroSpots from "@/components/profile/mini/ProfileAstroSpots";
import ProfileActions from "@/components/profile/mini/ProfileActions";
import ProfileLoadingState from "@/components/profile/mini/ProfileLoadingState";
import ProfileNotFound from "@/components/profile/mini/ProfileNotFound";
import { UserPostsManager } from "@/components/profile/UserPostsManager";

const ProfileMini: React.FC = () => {
  const { id: profileId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();
  const [userAstroSpots, setUserAstroSpots] = useState<any[]>([]);
  const [loadingSpots, setLoadingSpots] = useState(false);
  const [realTimeSiqs, setRealTimeSiqs] = useState<Record<string, number | null>>({});
  const [loadingSiqs, setLoadingSiqs] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'posts' | 'spots'>('posts');
  
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
          .select('*')
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

  // Sort astro spots by SIQS score
  const sortedAstroSpots = React.useMemo(() => {
    if (!userAstroSpots) return [];
    
    // Add real-time SIQS values to spots for sorting
    const spotsWithRealtimeSiqs = userAstroSpots.map(spot => ({
      ...spot,
      realTimeSiqs: realTimeSiqs[spot.id] !== undefined ? realTimeSiqs[spot.id] : spot.siqs,
      timestamp: spot.timestamp || spot.created_at // Ensure timestamp is properly defined, fallback to created_at
    }));
    
    // Sort using the utility function
    return sortLocationsBySiqs(spotsWithRealtimeSiqs);
  }, [userAstroSpots, realTimeSiqs]);

  const handleSiqsCalculated = (spotId: string, siqs: number | null, loading: boolean) => {
    setRealTimeSiqs(prev => ({
      ...prev,
      [spotId]: siqs
    }));
    setLoadingSiqs(prev => ({
      ...prev,
      [spotId]: loading
    }));
  };

  if (loading) {
    return <ProfileLoadingState />;
  }
  
  if (!profile) {
    return <ProfileNotFound navigate={navigate} t={t} />;
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-cosmic-950 to-slate-900">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-8">
        <div className="glassmorphism rounded-2xl shadow-2xl shadow-primary/5 overflow-hidden border border-primary/10 hover:shadow-primary/10 transition-shadow duration-500">
          {/* Enhanced header with gradient */}
          <div className="p-5 sm:p-7 md:p-9 border-b border-primary/20 bg-gradient-to-br from-cosmic-900/50 to-cosmic-950/50">
            <ProfileHeader profile={profile} userId={profileId} />
          </div>
          
          {/* Enhanced Bio section */}
          {profile.bio && (
            <div className="p-5 sm:p-7 md:p-9 border-b border-primary/10 bg-cosmic-900/30">
              <ProfileBio bio={profile.bio} t={t} />
            </div>
          )}

          {/* Toggle Tabs */}
          <div className="p-5 sm:p-7 md:p-9">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'posts' | 'spots')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-cosmic-800/40 border-primary/20 mb-6">
                <TabsTrigger value="posts" className="data-[state=active]:bg-primary/20">
                  {t('Posts', '帖子')}
                </TabsTrigger>
                <TabsTrigger value="spots" className="data-[state=active]:bg-primary/20">
                  {t('Community Spots', '社区观星点')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-0">
                <UserPostsManager 
                  userId={profileId!} 
                  isOwnProfile={user?.id === profileId}
                  currentUserId={user?.id}
                />
              </TabsContent>

              <TabsContent value="spots" className="mt-0">
                <ProfileAstroSpots 
                  sortedAstroSpots={sortedAstroSpots}
                  loadingSpots={loadingSpots}
                  realTimeSiqs={realTimeSiqs}
                  profileId={profileId!}
                  navigate={navigate}
                  handleSiqsCalculated={handleSiqsCalculated}
                  t={t}
                />
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Enhanced Actions section */}
          <div className="p-5 sm:p-7 md:p-9 bg-cosmic-900/50 border-t border-primary/20">
            <ProfileActions
              isFromMessages={isFromMessages}
              user={user}
              profileId={profileId}
              handleSendMessage={handleSendMessage}
              navigate={navigate}
              t={t}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileMini;
