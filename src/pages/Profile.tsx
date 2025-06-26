import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import NavBar from '@/components/NavBar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import ProfileLoader from '@/components/profile/ProfileLoader';
import ProfileMain from '@/components/profile/ProfileMain';
import AboutFooter from '@/components/about/AboutFooter';
import { 
  uploadAvatar, 
  upsertUserProfile, 
  saveUserTags, 
  fetchUserProfile, 
  ensureUserProfile 
} from '@/utils/profileUtils';

interface ProfileFormValues {
  username: string;
  bio: string;
}

const Profile = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [profile, setProfile] = useState<any>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [randomTip, setRandomTip] = useState<[string, string] | null>(null);
  const [tags, setTags] = useState<string[]>([]);

  const { register, handleSubmit, setValue } = useForm<ProfileFormValues>({
    defaultValues: {
      username: '',
      bio: ''
    }
  });

  useEffect(() => {
    // Load astronomy tip
    import('@/utils/astronomyTips').then(module => {
      setRandomTip(module.getRandomAstronomyTip());
    });

    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setAuthError('Unable to verify authentication status');
          navigate('/photo-points');
          return;
        }
        
        if (!session) {
          console.log('No active session, redirecting to login');
          toast.error(t("Authentication required", "需要认证"), {
            description: t("Please sign in to view your profile", "请登录以查看您的个人资料")
          });
          navigate('/photo-points');
          return;
        }

        console.log("Session user ID:", session.user.id);
        
        // Re-authenticate to refresh token if needed
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn('Session refresh error:', refreshError);
        }
        
        // Attempt to create profile if it doesn't exist
        const profileCreated = await ensureUserProfile(session.user.id);
        if (!profileCreated) {
          console.error("Failed to ensure user profile exists");
          toast.error(t("Profile setup failed", "个人资料设置失败"), {
            description: t("There was an issue setting up your profile. Please try signing out and back in.", "设置您的个人资料时出现问题，请尝试退出并重新登录。")
          });
          setProfile({
            username: null,
            avatar_url: null,
            date_of_birth: null,
            tags: [],
          });
          setAuthChecked(true);
          setLoading(false);
          return;
        }

        // Fetch profile data with improved function
        const profileData = await fetchUserProfile(session.user.id);
        
        // Update form with fetched data
        setValue('username', profileData.username || '');
        setValue('bio', profileData.bio || '');
        setAvatarUrl(profileData.avatar_url);
        setTags(profileData.tags || []);
        
        // Update profile state
        setProfile({
          username: profileData.username,
          avatar_url: profileData.avatar_url,
          bio: profileData.bio,
          date_of_birth: null,
          tags: profileData.tags || [],
        });
        
        console.log("Profile loaded:", profileData);
      } catch (error: any) {
        console.error("Error loading profile:", error);
        toast.error(t("Profile loading error", "个人资料加载错误"), {
          description: error.message
        });
        setProfile({
          username: null,
          avatar_url: null,
          date_of_birth: null,
          tags: [],
        });
        setAuthError(error.message);
      } finally {
        setAuthChecked(true);
        setLoading(false);
      }
    };

    checkSession();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        if (event === 'SIGNED_OUT') {
          navigate('/photo-points');
        } else if (event === 'SIGNED_IN' && session) {
          // Allow the signed in event to complete before reloading the page
          window.location.reload();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, t, setValue]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);
    }
  };

  const onSubmit = async (formData: ProfileFormValues) => {
    if (!user) {
      toast.error(t("Authentication required", "需要认证"));
      return;
    }

    try {
      setSaving(true);
      console.log("Starting profile update with data:", formData, tags);

      // Ensure profile exists first
      const profileExists = await ensureUserProfile(user.id);
      if (!profileExists) {
        toast.error(t("Profile setup issue", "个人资料设置问题"), {
          description: t("Please try signing out and back in", "请尝试退出并重新登录")
        });
        setSaving(false);
        return;
      }

      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        setUploadingAvatar(true);
        newAvatarUrl = await uploadAvatar(user.id, avatarFile);
        setUploadingAvatar(false);
        
        if (!newAvatarUrl) {
          toast.error(t("Avatar upload failed", "头像上传失败"));
          // Continue anyway, we can update the other fields
        }
      }

      // First update the profile
      console.log("Upserting profile with:", { username: formData.username, avatar_url: newAvatarUrl, bio: formData.bio });
      const profileSuccess = await upsertUserProfile(user.id, {
        username: formData.username,
        avatar_url: newAvatarUrl,
        bio: formData.bio,
      });

      if (!profileSuccess) {
        console.error("Profile update failed");
        toast.error(t("Profile update failed", "个人资料更新失败"));
        setSaving(false);
        return;
      }

      // Then save tags
      console.log("Saving tags:", tags);
      const tagsSuccess = await saveUserTags(user.id, tags);
      
      if (!tagsSuccess) {
        console.error("Tags update failed");
        toast.error(t("Tags update failed", "标签更新失败"));
        // Continue anyway since profile was updated successfully
      }
      
      // Update local state with new data
      setProfile(prev => ({
        ...prev,
        username: formData.username,
        avatar_url: newAvatarUrl,
        bio: formData.bio,
        tags,
      }));
      
      toast.success(t("Profile updated successfully", "个人资料更新成功"));
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(t("Update failed", "更新失败"), { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const removeAvatar = () => {
    setAvatarUrl(null);
    setAvatarFile(null);
  };

  if (!authChecked || loading) return <ProfileLoader />;
  
  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900 flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-3">{t("Authentication Error", "认证错误")}</h2>
          <p className="text-cosmic-200 mb-5">{authError}</p>
          <Button 
            onClick={() => navigate('/photo-points')} 
            variant="destructive"
          >
            {t("Back to Home", "返回主页")}
          </Button>
        </div>
      </div>
    );
  }
  
  if (!user) {
    navigate('/photo-points');
    return <ProfileLoader />;
  }

  const displayUsername = profile?.username || t("Stargazer", "星空观察者");

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900 flex flex-col">
      <NavBar />
      <main className="flex-grow pt-20">
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
          bio={profile?.bio}
        />
      </main>
      <AboutFooter />
    </div>
  );
};

export default Profile;
