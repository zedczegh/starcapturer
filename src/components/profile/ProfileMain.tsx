
import React from 'react';
import { Card } from '@/components/ui/card';
import ProfileHeader from './ProfileHeader';
import ProfileForm from './ProfileForm';
import PasswordChangeForm from './PasswordChangeForm';
import PaymentMethodsSection from './PaymentMethodsSection';

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
  <div className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Main Profile Card */}
      <div className="lg:col-span-2">
        <Card className="glassmorphism p-8 rounded-2xl shadow-glow overflow-hidden relative border-cosmic-700/20">
          <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-br from-primary/8 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-tr from-cosmic-900/20 to-transparent pointer-events-none"></div>
          
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
          </div>
        </Card>
      </div>
      
      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <PaymentMethodsSection />
        <Card className="glassmorphism p-6 rounded-2xl border-cosmic-700/20">
          <h2 className="font-bold text-xl text-white mb-4 pb-2 border-b border-cosmic-700/30">
            Security
          </h2>
          <PasswordChangeForm />
        </Card>
      </div>
    </div>
  </div>
);

export default ProfileMain;
