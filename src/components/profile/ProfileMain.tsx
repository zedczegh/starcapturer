
import React from 'react';
import { Card } from '@/components/ui/card';
import ProfileAvatar from './ProfileAvatar';
import AstronomyTip from './AstronomyTip';
import { AdminBadge } from './AdminBadge';
import ProfileForm from './ProfileForm';
import PasswordChangeForm from './PasswordChangeForm';
import PaymentMethodsSection from './PaymentMethodsSection';
import WalletSection from './WalletSection';
import { UserPostsManager } from './UserPostsManager';
import { FeaturedAlbumManager } from './FeaturedAlbumManager';

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
  bio,
  userId,
  onAvatarSelectFromAlbum
}: any) => (
  <div className="min-h-screen bg-gradient-to-b from-slate-950 via-cosmic-950 to-slate-900">
    {/* Enhanced Cover Photo with Parallax Effect */}
    <div className="relative h-[200px] sm:h-[250px] md:h-[350px] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-purple-900/30 to-cosmic-900"></div>
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200&h=400&fit=crop')] bg-cover bg-center opacity-30 transform scale-110 hover:scale-105 transition-transform duration-1000"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-cosmic-950 via-cosmic-950/50 to-transparent"></div>
      
      {/* Animated stars overlay */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white rounded-full animate-pulse delay-100"></div>
        <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-white rounded-full animate-pulse delay-200"></div>
      </div>
    </div>

    <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-7xl">
      {/* Enhanced Profile Header Section with Glow */}
      <div className="relative -mt-20 sm:-mt-24 mb-6 sm:mb-8">
        <Card className="bg-cosmic-900/90 backdrop-blur-2xl border border-primary/20 shadow-2xl shadow-primary/10 p-5 sm:p-6 md:p-8 hover:shadow-primary/20 transition-shadow duration-500">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-8">
            {/* Profile Picture with Enhanced Glow */}
            <div className="flex-shrink-0 mx-auto sm:mx-0 relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
              <ProfileAvatar 
                avatarUrl={avatarUrl}
                onAvatarChange={onAvatarChange}
                onRemoveAvatar={onRemoveAvatar}
                uploadingAvatar={uploadingAvatar}
              />
            </div>
            
            {/* Enhanced Name and Info Section */}
            <div className="flex-1 pb-2 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 mb-3">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-primary to-purple-400 bg-clip-text text-transparent">
                  {displayUsername}
                </h1>
                <AdminBadge size="lg" />
              </div>
              {bio && (
                <p className="text-cosmic-200 text-base sm:text-lg leading-relaxed max-w-2xl mb-2">
                  {bio}
                </p>
              )}
              <AstronomyTip tip={astronomyTip} />
            </div>
          </div>
        </Card>
      </div>

      {/* Enhanced Content Grid with Better Spacing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-7 pb-8 sm:pb-12">
        {/* Main Content - Enhanced Cards */}
        <div className="lg:col-span-2 order-1 lg:order-2 space-y-5 sm:space-y-7">
          <Card className="bg-cosmic-900/90 backdrop-blur-2xl border border-primary/10 shadow-lg hover:shadow-primary/10 transition-shadow duration-300 p-5 sm:p-7 md:p-9">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-primary bg-clip-text text-transparent mb-5 sm:mb-7 pb-4 border-b border-primary/20">
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

          {/* Featured Album with Enhanced Styling */}
          <div className="transform hover:scale-[1.01] transition-transform duration-300">
            <FeaturedAlbumManager 
              userId={userId} 
              isOwnProfile={true}
              onAvatarSelect={onAvatarSelectFromAlbum}
            />
          </div>

          {/* Posts with Enhanced Styling */}
          <div className="transform hover:scale-[1.01] transition-transform duration-300">
            <UserPostsManager userId={userId} isOwnProfile={true} />
          </div>
        </div>
        
        {/* Enhanced Sidebar */}
        <div className="lg:col-span-1 order-2 lg:order-1 space-y-5 sm:space-y-7">
          <div className="transform hover:scale-[1.02] transition-transform duration-300">
            <WalletSection />
          </div>
          <div className="transform hover:scale-[1.02] transition-transform duration-300">
            <PaymentMethodsSection />
          </div>
          <Card className="bg-cosmic-900/90 backdrop-blur-2xl border border-primary/10 shadow-lg hover:shadow-primary/10 transition-all duration-300 p-5 sm:p-6">
            <h2 className="font-bold text-xl sm:text-2xl bg-gradient-to-r from-white to-primary bg-clip-text text-transparent mb-4 sm:mb-5 pb-3 border-b border-primary/20">
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
