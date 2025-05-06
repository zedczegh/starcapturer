
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
        await fetchProfile(session.user.id, () => {});
      } catch (error) {
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
  }, [navigate, t, setProfile, fetchProfile]);

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
