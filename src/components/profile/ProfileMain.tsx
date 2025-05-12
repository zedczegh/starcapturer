
import React from 'react';
import { Card } from '@/components/ui/card';
import ProfileHeader from './ProfileHeader';
import ProfileForm from './ProfileForm';
import PasswordChangeForm from './PasswordChangeForm';

const ProfileMain = ({
  displayUsername,
  avatarUrl,
  onAvatarChange,
  onRemoveAvatar,
  uploadingAvatar,
  astronomyTip,
  register,
  saving,
  handleSubmit,
  onSubmit,
  tags,
  setTags,
  bio
}: any) => (
  <div className="container mx-auto px-4 py-8 pt-24 max-w-3xl">
    <Card className="glassmorphism p-8 rounded-xl shadow-glow overflow-hidden relative">
      <div className="absolute top-0 right-0 w-full h-64 bg-gradient-to-br from-primary/5 to-cosmic-800/0 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-tr from-cosmic-900/40 to-cosmic-800/0 pointer-events-none"></div>
      
      <div className="flex flex-col gap-8 relative z-10">
        <ProfileHeader
          username={displayUsername}
          avatarUrl={avatarUrl}
          onAvatarChange={onAvatarChange}
          onRemoveAvatar={onRemoveAvatar}
          uploadingAvatar={uploadingAvatar}
          astronomyTip={astronomyTip}
          bio={bio}
        />
        <ProfileForm 
          register={register}
          loading={saving}
          onSubmit={handleSubmit(onSubmit)}
          tags={tags}
          setTags={setTags}
        />
        <div className="mt-8">
          <h2 className="font-bold text-xl text-white mb-4 pb-2 border-b border-cosmic-700/30">
            Change Password
          </h2>
          <PasswordChangeForm />
        </div>
      </div>
    </Card>
  </div>
);

export default ProfileMain;
