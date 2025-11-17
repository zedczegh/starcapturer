import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import NavBar from '@/components/NavBar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ProfileLoader from '@/components/profile/ProfileLoader';
import ProfileMain from '@/components/profile/ProfileMainNew';
import { fetchUserProfile } from '@/utils/profileUtils';

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [randomTip, setRandomTip] = useState<[string, string] | null>(null);
  const scrollToPost = location.state?.scrollToPost;

  useEffect(() => {
    if (!userId) {
      navigate('/photo-points');
      return;
    }

    // Load astronomy tip
    import('@/utils/astronomyTips').then(module => {
      setRandomTip(module.getRandomAstronomyTip());
    });

    loadProfile();
  }, [userId]);

  useEffect(() => {
    // Scroll to specific post if provided
    if (scrollToPost && !loading) {
      setTimeout(() => {
        const postElement = document.getElementById(`post-${scrollToPost}`);
        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          postElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-cosmic-950');
          setTimeout(() => {
            postElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-cosmic-950');
          }, 2000);
        }
      }, 500);
    }
  }, [scrollToPost, loading]);

  const loadProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const profileData = await fetchUserProfile(userId);
      
      setProfile({
        username: profileData.username,
        avatar_url: profileData.avatar_url,
        background_image_url: profileData.background_image_url,
        bio: profileData.bio,
        motto: profileData.motto,
        date_of_birth: null,
        tags: profileData.tags || [],
      });
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast.error(t("Profile loading error", "个人资料加载错误"), {
        description: error.message
      });
      navigate('/photo-points');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ProfileLoader />;

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-cosmic-900 flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-3">{t("Profile Not Found", "找不到个人资料")}</h2>
          <p className="text-cosmic-200 mb-5">{t("The user profile you're looking for doesn't exist", "您要查找的用户个人资料不存在")}</p>
        </div>
      </div>
    );
  }

  const displayUsername = profile?.username || t("Stargazer", "星空观察者");
  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="min-h-screen bg-cosmic-950 flex flex-col">
      <NavBar />
      <ProfileMain
        displayUsername={displayUsername}
        avatarUrl={profile.avatar_url}
        backgroundUrl={profile.background_image_url}
        onAvatarChange={() => {}}
        onBackgroundChange={() => {}}
        onRemoveAvatar={() => {}}
        onRemoveBackground={() => {}}
        uploadingAvatar={false}
        avatarUploadProgress={0}
        uploadingBackground={false}
        backgroundUploadProgress={0}
        astronomyTip={randomTip}
        motto={profile.motto}
        onMottoSave={() => {}}
        register={() => ({})}
        saving={false}
        handleSubmit={() => () => {}}
        onSubmit={() => {}}
        tags={profile.tags}
        setTags={() => {}}
        bio={profile.bio}
        userId={userId}
        onPostsUpdate={() => {}}
        postsRefreshKey={0}
        isOwnProfile={isOwnProfile}
        viewMode={true}
      />
    </div>
  );
};

export default UserProfile;
