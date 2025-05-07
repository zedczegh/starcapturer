
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
            // Update local state if there's a mismatch and not using a blob URL
            if (data.username !== profile.username || 
               (data.avatar_url !== profile.avatar_url && 
               (!data.avatar_url || !data.avatar_url.startsWith('blob:')))) {
              console.log("Updating profile from database:", data);
              setProfile(prev => prev ? { ...prev, ...data } : null);
              
              // Update avatar URL if it exists in the database and is not a blob URL
              if (data.avatar_url && !data.avatar_url.startsWith('blob:')) {
                setAvatarUrl(data.avatar_url);
                console.log("Setting avatar URL from database:", data.avatar_url);
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
      // Validate file size and type
      const fileSize = file.size / 1024 / 1024; // size in MB
      
      if (fileSize > 2) {
        toast.error(t("File is too large", "文件太大"), {
          description: t("Avatar must be less than 2MB", "头像必须小于2MB")
        });
        return;
      }
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast.error(t("Invalid file type", "无效的文件类型"), {
          description: t("Please select an image file", "请选择图像文件")
        });
        return;
      }
      
      console.log("Avatar file selected:", file.name, file.type, `${fileSize.toFixed(2)}MB`);
      setAvatarFile(file);
      
      // Create a local preview of the image and revoke any existing blob URLs
      if (avatarUrl && avatarUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avatarUrl);
      }
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);
      toast.info(t("Avatar selected", "已选择头像"), {
        description: t("Click 'Save Profile' to upload", "点击'保存资料'上传")
      });
    }
  };

  const removeAvatar = () => {
    // Clean up blob URL if it exists
    if (avatarUrl && avatarUrl.startsWith('blob:')) {
      URL.revokeObjectURL(avatarUrl);
    }
    setAvatarUrl(null);
    setAvatarFile(null);
    toast.info(t("Avatar removed", "已移除头像"), {
      description: t("Click 'Save Profile' to confirm", "点击'保存资料'确认")
    });
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
