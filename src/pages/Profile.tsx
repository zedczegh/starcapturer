
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import NavBar from '@/components/NavBar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ProfileLoader from '@/components/profile/ProfileLoader';
import ProfileMain from '@/components/profile/ProfileMain';
import { useProfile } from '@/hooks/profile/useProfile';
import AboutFooter from '@/components/about/AboutFooter';

const Profile = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const {
    profile,
    setProfile,
    avatarFile,
    setAvatarFile,
    avatarUrl,
    setAvatarUrl,
    uploadingAvatar,
    setUploadingAvatar,
    randomTip,
    fetchProfile,
    ensureProfileExists,
  } = useProfile();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error(t("Authentication required", "需要认证"), {
            description: t("Please sign in to view your profile", "请登录以查看您的个人资料")
          });
          navigate('/photo-points');
          return;
        }
        
        // Ensure profile exists before fetching
        await ensureProfileExists(session.user.id);
        await fetchProfile(session.user.id, () => {});
      } catch (error) {
        console.error("Error checking session:", error);
        toast.error(t("Failed to load profile", "加载个人资料失败"));
        setProfile({
          username: null,
          avatar_url: null,
          date_of_birth: null,
          tags: [],
        });
      } finally {
        setAuthChecked(true);
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate, t, setProfile, fetchProfile, ensureProfileExists]);

  // Add this effect to refetch profile when avatarUrl changes
  useEffect(() => {
    if (user && !loading && profile) {
      console.log("Checking for profile updates");
      const checkProfileUpdates = async () => {
        try {
          // Ensure profile exists
          await ensureProfileExists(user.id);
          
          const { data, error } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', user.id)
            .single();
            
          if (error) throw error;
          
          if (data) {
            // Update local state if there's a mismatch
            if (data.username !== profile.username || data.avatar_url !== profile.avatar_url) {
              console.log("Updating profile from database:", data);
              setProfile(prev => prev ? { ...prev, ...data } : null);
              
              // Add cache busting for avatars
              if (data.avatar_url) {
                const cacheBustUrl = `${data.avatar_url}?v=${new Date().getTime()}`;
                setAvatarUrl(cacheBustUrl);
              } else {
                setAvatarUrl(null);
              }
            }
          }
        } catch (error) {
          console.error("Error checking profile updates:", error);
        }
      };
      
      checkProfileUpdates();
    }
  }, [user, loading, profile, setProfile, setAvatarUrl, ensureProfileExists]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      // Create a local preview of the image
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);
      setUploadingAvatar(false); // We'll upload when the form is submitted
    }
  };

  const removeAvatar = () => {
    setAvatarUrl(null);
    setAvatarFile(null);
  };

  if (!authChecked || loading) return <ProfileLoader />;
  if (!user) return <ProfileLoader />;

  const displayUsername = profile?.username || t("Stargazer", "星空观察者");
  console.log("Rendering profile with username:", displayUsername);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900 flex flex-col">
      <NavBar />
      <main className="flex-grow">
        <ProfileMain
          displayUsername={displayUsername}
          avatarUrl={avatarUrl}
          onAvatarChange={handleAvatarChange}
          onRemoveAvatar={removeAvatar}
          uploadingAvatar={uploadingAvatar}
          astronomyTip={randomTip}
        />
      </main>
      <AboutFooter />
    </div>
  );
};

export default Profile;
