
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

// Import the newly created components
import ProfileHeader from "@/components/profile/mini/ProfileHeader";
import ProfileBio from "@/components/profile/mini/ProfileBio";
import ProfileAstroSpots from "@/components/profile/mini/ProfileAstroSpots";
import ProfileActions from "@/components/profile/mini/ProfileActions";
import ProfileLoadingState from "@/components/profile/mini/ProfileLoadingState";
import ProfileNotFound from "@/components/profile/mini/ProfileNotFound";

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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-cosmic-950">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-8">
        <div className="glassmorphism rounded-xl shadow-glow overflow-hidden">
          {/* Mobile-optimized header with better spacing */}
          <div className="p-4 sm:p-6 md:p-8 border-b border-cosmic-700/30">
            <ProfileHeader profile={profile} userId={profileId} />
          </div>
          
          {/* Bio section with proper mobile padding */}
          {profile.bio && (
            <div className="p-4 sm:p-6 md:p-8 border-b border-cosmic-700/30">
              <ProfileBio bio={profile.bio} t={t} />
            </div>
          )}
          
          {/* Spots section */}
          <div className="p-4 sm:p-6 md:p-8">
            <ProfileAstroSpots 
              sortedAstroSpots={sortedAstroSpots}
              loadingSpots={loadingSpots}
              realTimeSiqs={realTimeSiqs}
              profileId={profileId}
              navigate={navigate}
              handleSiqsCalculated={handleSiqsCalculated}
              t={t}
            />
          </div>
          
          {/* Actions section with sticky bottom on mobile */}
          <div className="sticky bottom-0 p-4 sm:p-6 md:p-8 bg-cosmic-900/95 backdrop-blur-xl border-t border-cosmic-700/30">
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
