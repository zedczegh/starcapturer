import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProfileAvatar from './ProfileAvatar';
import AstronomyTip from './AstronomyTip';
import { AdminBadge } from './AdminBadge';
import { UserPostsManager } from './UserPostsManager';
import { InstagramPostUpload } from './InstagramPostUpload';
import { FeaturedAlbumDialog } from './FeaturedAlbumDialog';
import { Settings, Wallet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const ProfileMainNew = ({
  displayUsername,
  avatarUrl,
  onAvatarChange,
  onRemoveAvatar,
  uploadingAvatar,
  astronomyTip,
  bio,
  userId,
  onAvatarSelectFromAlbum,
  onPostsUpdate,
  postsRefreshKey
}: any) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [featuredAlbumOpen, setFeaturedAlbumOpen] = useState(false);

  return (
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
              {/* Profile Picture with Enhanced Glow - Clickable for Featured Album */}
              <div className="flex-shrink-0 mx-auto sm:mx-0 relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
                <button 
                  onClick={() => setFeaturedAlbumOpen(true)}
                  className="relative group"
                >
                  <ProfileAvatar 
                    avatarUrl={avatarUrl}
                    onAvatarChange={onAvatarChange}
                    onRemoveAvatar={onRemoveAvatar}
                    uploadingAvatar={uploadingAvatar}
                  />
                  <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      View Album
                    </span>
                  </div>
                </button>
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

              {/* Action Buttons */}
              <div className="flex gap-2 self-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/profile/settings')}
                  className="border-primary/30 hover:bg-primary/10"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {t('Settings', '设置')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/profile/wallet')}
                  className="border-primary/30 hover:bg-primary/10"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  {t('Wallet', '钱包')}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Content Area - Instagram-like Layout */}
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
          {/* Create New Post */}
          <Card className="bg-cosmic-900/90 backdrop-blur-2xl border border-primary/10 shadow-lg p-6">
            <h2 className="font-bold text-xl bg-gradient-to-r from-white to-primary bg-clip-text text-transparent mb-4">
              {t('Create New Post', '创建新帖子')}
            </h2>
            <InstagramPostUpload 
              userId={userId}
              onUploadComplete={onPostsUpdate}
            />
          </Card>

          {/* Posts Grid */}
          <UserPostsManager 
            userId={userId} 
            isOwnProfile={true}
            key={postsRefreshKey}
          />
        </div>
      </div>

      {/* Featured Album Dialog */}
      <FeaturedAlbumDialog
        open={featuredAlbumOpen}
        onOpenChange={setFeaturedAlbumOpen}
        userId={userId}
        isOwnProfile={true}
        onAvatarSelect={onAvatarSelectFromAlbum}
      />
    </div>
  );
};

export default ProfileMainNew;
