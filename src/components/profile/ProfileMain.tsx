
import React from 'react';
import { Card } from '@/components/ui/card';
import ProfileAvatar from './ProfileAvatar';
import AstronomyTip from './AstronomyTip';
import { AdminBadge } from './AdminBadge';
import ProfileForm from './ProfileForm';
import PasswordChangeForm from './PasswordChangeForm';
import PaymentMethodsSection from './PaymentMethodsSection';
import WalletSection from './WalletSection';

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
  <div className="min-h-screen bg-cosmic-950">
    {/* Cover Photo - Facebook Style */}
    <div className="relative h-[300px] bg-gradient-to-br from-primary/20 via-cosmic-800 to-cosmic-900 border-b border-cosmic-700/30">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200&h=300&fit=crop')] bg-cover bg-center opacity-40"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-cosmic-950/80 to-transparent"></div>
    </div>

    <div className="container mx-auto px-4 max-w-6xl">
      {/* Profile Header Section - Overlapping Cover */}
      <div className="relative -mt-20 mb-6">
        <Card className="bg-cosmic-900/95 backdrop-blur-xl border-cosmic-700/30 p-6">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            {/* Large Profile Picture */}
            <div className="flex-shrink-0">
              <ProfileAvatar 
                avatarUrl={avatarUrl}
                onAvatarChange={onAvatarChange}
                onRemoveAvatar={onRemoveAvatar}
                uploadingAvatar={uploadingAvatar}
              />
            </div>
            
            {/* Name and Bio */}
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-white">
                  {displayUsername}
                </h1>
                <AdminBadge size="lg" />
              </div>
              {bio && <p className="text-cosmic-300 text-lg">{bio}</p>}
              <AstronomyTip tip={astronomyTip} />
            </div>
          </div>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6 pb-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <WalletSection />
          <PaymentMethodsSection />
          <Card className="bg-cosmic-900/95 backdrop-blur-xl border-cosmic-700/30 p-6">
            <h2 className="font-bold text-xl text-white mb-4 pb-3 border-b border-cosmic-700/30">
              Security
            </h2>
            <PasswordChangeForm />
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card className="bg-cosmic-900/95 backdrop-blur-xl border-cosmic-700/30 p-8">
            <h2 className="text-2xl font-bold text-white mb-6 pb-4 border-b border-cosmic-700/30">
              Edit Profile
            </h2>
            <ProfileForm 
              register={register}
              loading={saving}
              onSubmit={handleSubmit(onSubmit)}
              tags={tags}
              setTags={setTags}
            />
          </Card>
        </div>
      </div>
    </div>
  </div>
);

export default ProfileMain;
