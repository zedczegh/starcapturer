import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ProfileForm from '@/components/profile/ProfileForm';
import PasswordChangeForm from '@/components/profile/PasswordChangeForm';
import NavBar from '@/components/NavBar';
import { fetchUserProfile, upsertUserProfile, saveUserTags } from '@/utils/profileUtils';

interface ProfileFormValues {
  username: string;
  bio: string;
}

const ProfileSettings = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  const { register, handleSubmit, setValue } = useForm<ProfileFormValues>({
    defaultValues: {
      username: '',
      bio: ''
    }
  });

  useEffect(() => {
    if (!user) {
      navigate('/profile');
      return;
    }

    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const profileData = await fetchUserProfile(user.id);
      setValue('username', profileData.username || '');
      setValue('bio', profileData.bio || '');
      setTags(profileData.tags || []);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;

    setSaving(true);
    try {
      await upsertUserProfile(user.id, {
        username: data.username,
        bio: data.bio
      });
      await saveUserTags(user.id, tags);
      toast.success(t('Profile updated successfully', '个人资料更新成功'));
    } catch (error: any) {
      toast.error(t('Failed to update profile', '更新个人资料失败'), {
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-cosmic-950 to-slate-900">
      <NavBar />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/profile')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('Back to Profile', '返回个人资料')}
        </Button>

        {/* Edit Profile Section */}
        <Card className="bg-cosmic-900/90 backdrop-blur-2xl border border-primary/10 shadow-lg p-6 md:p-8 mb-6">
          <h2 className="font-bold text-2xl bg-gradient-to-r from-white to-primary bg-clip-text text-transparent mb-6 pb-3 border-b border-primary/20">
            {t('Edit Profile', '编辑个人资料')}
          </h2>
          {loading ? (
            <div className="text-center py-8 text-cosmic-400">Loading...</div>
          ) : (
            <ProfileForm 
              register={register}
              loading={saving}
              onSubmit={handleSubmit(onSubmit)}
              tags={tags}
              setTags={setTags}
            />
          )}
        </Card>

        {/* Security Section */}
        <Card className="bg-cosmic-900/90 backdrop-blur-2xl border border-primary/10 shadow-lg p-6 md:p-8">
          <h2 className="font-bold text-2xl bg-gradient-to-r from-white to-primary bg-clip-text text-transparent mb-6 pb-3 border-b border-primary/20">
            {t('Security', '安全')}
          </h2>
          <PasswordChangeForm />
        </Card>
      </div>
    </div>
  );
};

export default ProfileSettings;
