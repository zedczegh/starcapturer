
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Separator } from '@/components/ui/separator';
import ProfileContainer from '@/components/profile/ProfileContainer';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import ProfileForm from '@/components/profile/ProfileForm';
import ChangePasswordForm from '@/components/profile/ChangePasswordForm';
import ProfileHeader from '@/components/profile/ProfileHeader';
import { useProfileData } from '@/hooks/profile/useProfileData';
import { useAvatarUpload } from '@/hooks/profile/useAvatarUpload';

const Profile = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const { profile, loading } = useProfileData();
  const { 
    avatarUrl, 
    uploadingAvatar, 
    handleAvatarChange, 
    removeAvatar 
  } = useAvatarUpload();

  useEffect(() => {
    if (!user) {
      navigate('/photo-points');
      toast.error(t("Please sign in to view your profile", "请登录以查看您的个人资料"));
    }
  }, [user, navigate, t]);

  if (!user) {
    return null;
  }

  return (
    <>
      <NavBar />
      <ProfileContainer>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <ProfileHeader />
          <ProfileAvatar 
            avatarUrl={avatarUrl}
            onAvatarChange={handleAvatarChange}
            onRemoveAvatar={removeAvatar}
            uploadingAvatar={uploadingAvatar}
          />
        </div>

        <Separator className="bg-cosmic-800" />
        
        <ProfileForm 
          loading={loading}
          profile={profile}
        />

        <Separator className="bg-cosmic-800" />
        
        <ChangePasswordForm />
      </ProfileContainer>
    </>
  );
};

export default Profile;
