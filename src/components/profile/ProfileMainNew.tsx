import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProfileAvatar from './ProfileAvatar';
import ProfileBackground from './ProfileBackground';
import AstronomyTip from './AstronomyTip';
import { AdminBadge } from './AdminBadge';
import { UserPostsManager } from './UserPostsManager';
import { InstagramPostUpload } from './InstagramPostUpload';
import { Settings, Wallet, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const ProfileMainNew = ({
  displayUsername,
  avatarUrl,
  backgroundUrl,
  onAvatarChange,
  onBackgroundChange,
  onRemoveAvatar,
  onRemoveBackground,
  uploadingAvatar,
  uploadingBackground,
  astronomyTip,
  bio,
  userId,
  onPostsUpdate,
  postsRefreshKey,
  register,
  saving,
  handleSubmit,
  onSubmit,
  tags,
  setTags
}: any) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-cosmic-950 to-slate-900">
      {/* Enhanced Cover Photo with User's Background or Default */}
      <div className="relative h-[200px] sm:h-[250px] md:h-[350px] overflow-hidden">
        {backgroundUrl ? (
          <>
            <img 
              src={backgroundUrl} 
              alt="Profile Background" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cosmic-950 via-cosmic-950/50 to-transparent"></div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-purple-900/30 to-cosmic-900"></div>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200&h=400&fit=crop')] bg-cover bg-center opacity-30 transform scale-110 hover:scale-105 transition-transform duration-1000"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-cosmic-950 via-cosmic-950/50 to-transparent"></div>
          </>
        )}
        
        {/* Animated stars overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white rounded-full animate-pulse delay-100"></div>
          <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-white rounded-full animate-pulse delay-200"></div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-7xl">
        {/* Background Image Upload Section */}
        <div className="relative -mt-32 sm:-mt-36 mb-4 sm:mb-6 px-4">
          <ProfileBackground
            backgroundUrl={backgroundUrl}
            onBackgroundChange={onBackgroundChange}
            onRemoveBackground={onRemoveBackground}
            uploadingBackground={uploadingBackground}
          />
        </div>

        {/* Enhanced Profile Header Section with Glow */}
        <div className="relative mb-6 sm:mb-8">
          <Card className="bg-cosmic-900/95 backdrop-blur-xl border border-primary/10 p-4 sm:p-6">
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Profile Picture with Enhanced Glow */}
              <div className="flex-shrink-0 relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative">
                  <ProfileAvatar 
                    avatarUrl={avatarUrl}
                    onAvatarChange={onAvatarChange}
                    onRemoveAvatar={onRemoveAvatar}
                    uploadingAvatar={uploadingAvatar}
                  />
                </div>
              </div>
              
              {/* Name and Info Section */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white via-primary to-purple-400 bg-clip-text text-transparent truncate">
                    {displayUsername}
                  </h1>
                  <AdminBadge size="sm" />
                </div>
                {bio && (
                  <p className="text-cosmic-300 text-sm leading-relaxed line-clamp-2 mb-2">
                    {bio}
                  </p>
                )}
                <AstronomyTip tip={astronomyTip} />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setUploadDialogOpen(true)}
                  className="h-10 w-10 rounded-full bg-primary/20 hover:bg-primary/30 border border-primary/30"
                  title={t('Create Post', '创建帖子')}
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/profile/settings')}
                  className="h-10 w-10 rounded-full hover:bg-cosmic-800/50"
                  title={t('Settings', '设置')}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/profile/wallet')}
                  className="h-10 w-10 rounded-full hover:bg-cosmic-800/50"
                  title={t('Wallet', '钱包')}
                >
                  <Wallet className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Content Area - Instagram-like Layout */}
        <div className="max-w-4xl mx-auto pb-12">
          {/* Posts Grid */}
          <UserPostsManager 
            userId={userId} 
            isOwnProfile={true}
            currentUserId={userId}
            key={postsRefreshKey}
          />
        </div>
      </div>

      {/* Upload Post Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="bg-cosmic-900/95 backdrop-blur-xl border-primary/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">
              {t('Create New Post', '创建新帖子')}
            </DialogTitle>
          </DialogHeader>
          <InstagramPostUpload 
            userId={userId}
            onUploadComplete={() => {
              onPostsUpdate();
              setUploadDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileMainNew;
