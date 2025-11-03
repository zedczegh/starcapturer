
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
    {/* Cover Photo - Mobile Responsive */}
    <div className="relative h-[200px] sm:h-[250px] md:h-[300px] bg-gradient-to-br from-primary/20 via-cosmic-800 to-cosmic-900 border-b border-cosmic-700/30">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200&h=300&fit=crop')] bg-cover bg-center opacity-40"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-cosmic-950/80 to-transparent"></div>
    </div>

    <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-6xl">
      {/* Profile Header Section - Mobile Optimized */}
      <div className="relative -mt-16 sm:-mt-20 mb-4 sm:mb-6">
        <Card className="bg-cosmic-900/95 backdrop-blur-xl border-cosmic-700/30 p-4 sm:p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
            {/* Profile Picture - Responsive sizing */}
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              <ProfileAvatar 
                avatarUrl={avatarUrl}
                onAvatarChange={onAvatarChange}
                onRemoveAvatar={onRemoveAvatar}
                uploadingAvatar={uploadingAvatar}
              />
            </div>
            
            {/* Name and Bio - Centered on mobile */}
            <div className="flex-1 pb-2 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                  {displayUsername}
                </h1>
                <AdminBadge size="lg" />
              </div>
              {bio && <p className="text-cosmic-300 text-base sm:text-lg">{bio}</p>}
              <AstronomyTip tip={astronomyTip} />
            </div>
          </div>
        </Card>
      </div>

      {/* Content Grid - Stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 pb-6 sm:pb-8">
        {/* Main Content - Shows first on mobile */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <Card className="bg-cosmic-900/95 backdrop-blur-xl border-cosmic-700/30 p-4 sm:p-6 md:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-cosmic-700/30">
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
        
        {/* Sidebar - Shows second on mobile */}
        <div className="lg:col-span-1 order-2 lg:order-1 space-y-4 sm:space-y-6">
          <WalletSection />
          <PaymentMethodsSection />
          <Card className="bg-cosmic-900/95 backdrop-blur-xl border-cosmic-700/30 p-4 sm:p-6">
            <h2 className="font-bold text-lg sm:text-xl text-white mb-3 sm:mb-4 pb-3 border-b border-cosmic-700/30">
              Security
            </h2>
            <PasswordChangeForm />
          </Card>
        </div>
      </div>
    </div>
  </div>
);

export default ProfileMain;
