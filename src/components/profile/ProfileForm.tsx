
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/profile/useProfile';
import { useUserTags } from '@/hooks/useUserTags';
import { useProfileForm } from '@/hooks/profile/useProfileForm';

// Component imports
import UsernameField, { ProfileFormValues } from './form/UsernameField';
import ProfileTagsSection from './form/ProfileTagsSection';
import SubmitButton from './form/SubmitButton';

// Use the same type from UsernameField to ensure consistency
const formSchema = z.object({
  username: z.string().min(3, {
    message: 'Username must be at least 3 characters.',
  }),
});

const ProfileForm = () => {
  const { user } = useAuth();
  const {
    profile,
    fetchProfile,
  } = useProfile();

  const { 
    tags, 
    loading: loadingTags, 
    fetchUserTags,
    addUserTag,
    removeUserTag
  } = useUserTags();

  // Set up form with react-hook-form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
    },
  });

  const { handleSubmit, saving, avatarUploading } = useProfileForm(user);

  // Load profile data when component mounts
  useEffect(() => {
    if (user) {
      fetchProfile(user.id, form.setValue);
      fetchUserTags(user.id);
    }
  }, [user, fetchProfile, form.setValue, fetchUserTags]);

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Username field */}
      <UsernameField 
        register={form.register} 
        errors={form.formState.errors} 
      />

      {/* User tags section */}
      <ProfileTagsSection
        tags={tags}
        loadingTags={loadingTags}
        onAddTag={(tagName) => user ? addUserTag(user.id, tagName) : Promise.resolve(null)}
        onRemoveTag={removeUserTag}
      />

      {/* Submit button */}
      <SubmitButton 
        saving={saving} 
        avatarUploading={avatarUploading} 
      />
    </form>
  );
};

export default ProfileForm;
