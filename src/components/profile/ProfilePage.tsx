
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import ProfileLoader from './ProfileLoader';
import ProfileMain from './ProfileMain';
import { useProfile } from '@/hooks/profile/useProfile';
import { useProfileUpdate } from '@/hooks/profile/useProfileUpdate';
import AboutFooter from '@/components/about/AboutFooter';
import NavBar from '@/components/NavBar';

interface ProfileFormValues {
  username: string;
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const {
    profile,
    setProfile,
    randomTip,
    fetchProfile,
    tags,
    setTags,
    saveProfileTags
  } = useProfile();

  const {
    saving,
    avatarUrl,
    setAvatarUrl,
    uploadingAvatar,
    handleAvatarChange,
    removeAvatar,
    updateProfile
  } = useProfileUpdate();

  const { register, handleSubmit, setValue } = useForm<ProfileFormValues>({
    defaultValues: {
      username: ''
    }
  });

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
        
        const result = await fetchProfile(session.user.id, setValue);
        if (result.data?.avatar_url) {
          setAvatarUrl(result.data.avatar_url);
        }
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
  }, [navigate, t, setProfile, fetchProfile, setValue, setAvatarUrl]);

  const onSubmit = async (formData: ProfileFormValues) => {
    if (!user) {
      toast.error(t("Authentication required", "需要认证"));
      return;
    }

    const result = await updateProfile(
      user.id, 
      formData, 
      profile?.avatar_url || null,
      tags,
      saveProfileTags
    );

    if (result.success) {
      setProfile(prev => ({
        ...prev!,
        username: formData.username,
        avatar_url: result.avatar_url
      }));
    }
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
          register={register}
          saving={saving}
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
          tags={tags}
          setTags={setTags}
        />
      </main>
      <AboutFooter />
    </div>
  );
};

export default ProfilePage;
