import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ProfileAvatar from './ProfileAvatar';
import ProfileMotto from './ProfileMotto';
import { AdminBadge } from './AdminBadge';
import { UserPostsManager } from './UserPostsManager';
import { InstagramPostUpload } from './InstagramPostUpload';
import ProfileTag from './ProfileTag';
import { Settings, Wallet, Camera, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

const ProfileMainNew = ({
  displayUsername,
  avatarUrl,
  backgroundUrl,
  onAvatarChange,
  onBackgroundChange,
  onRemoveAvatar,
  onRemoveBackground,
  uploadingAvatar,
  avatarUploadProgress = 0,
  uploadingBackground,
  backgroundUploadProgress = 0,
  astronomyTip,
  motto,
  onMottoSave,
  bio,
  userId,
  onPostsUpdate,
  postsRefreshKey,
  register,
  saving,
  tags,
  handleSubmit,
  onSubmit,
  setTags
}: any) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [tagsExpanded, setTagsExpanded] = useState(false);

  // Animation variants for staggered tag animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-cosmic-950 to-slate-900">
      {/* Enhanced Cover Photo with User's Background and Upload Controls */}
      <div className="relative h-[200px] sm:h-[250px] md:h-[350px] overflow-hidden group">
        {backgroundUrl ? (
          <>
            <img 
              src={backgroundUrl} 
              alt="Profile Background" 
              className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
            />
            {/* Enhanced gradient with more bleed at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-cosmic-950 via-cosmic-950/80 via-50% to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-70% to-cosmic-950/90"></div>
            
            {/* Upload Controls - Show on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-4">
              <Button
                onClick={onRemoveBackground}
                variant="destructive"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                type="button"
              >
                <X className="w-4 h-4 mr-2" />
                {t("Remove", "删除")}
              </Button>
              <label htmlFor="background-upload-cover" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  asChild
                >
                  <span className="cursor-pointer">
                    <Camera className="w-4 h-4 mr-2" />
                    {t("Change", "更改")}
                  </span>
                </Button>
              </label>
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-purple-900/30 to-cosmic-900"></div>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200&h=400&fit=crop')] bg-cover bg-center opacity-30 transform scale-110 hover:scale-105 transition-transform duration-1000"></div>
            {/* Enhanced gradient with more bleed at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-cosmic-950 via-cosmic-950/80 via-50% to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-70% to-cosmic-950/90"></div>
            
            {/* Upload Button for Empty State */}
            <div className="absolute inset-0 flex items-center justify-center">
              <label htmlFor="background-upload-cover">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  asChild
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="cursor-pointer">
                    <Camera className="w-4 h-4 mr-2" />
                    {uploadingBackground ? t("Uploading...", "上传中...") : t("Add Background", "添加背景")}
                  </span>
                </Button>
              </label>
            </div>
          </>
        )}
        
        {/* Hidden file input */}
        <input
          id="background-upload-cover"
          type="file"
          accept="image/*,image/heic,image/heif,image/webp,image/avif,image/tiff,image/bmp"
          onChange={onBackgroundChange}
          className="hidden"
          disabled={uploadingBackground}
        />
        
        {/* Upload Progress Bar */}
        {uploadingBackground && backgroundUploadProgress > 0 && (
          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="max-w-md mx-auto bg-cosmic-900/90 backdrop-blur-sm rounded-lg p-3 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-cosmic-200">{t("Uploading background...", "上传背景中...")}</span>
                <span className="text-sm font-medium text-primary">{backgroundUploadProgress}%</span>
              </div>
              <Progress value={backgroundUploadProgress} className="h-2" />
            </div>
          </div>
        )}
        
        {/* Animated stars overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white rounded-full animate-pulse delay-100"></div>
          <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-white rounded-full animate-pulse delay-200"></div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-7xl">
        {/* Enhanced Profile Header Section with Glow */}
        <div className="relative -mt-20 sm:-mt-24 mb-6 sm:mb-8">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-cosmic-900/10 backdrop-blur-xl border border-primary/10 p-6 sm:p-8 relative">
              {/* Settings & Wallet Icons - Top Right Stacked */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/profile/settings')}
                  className="h-9 w-9 rounded-full hover:bg-cosmic-800/50"
                  title={t('Settings', '设置')}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/profile/wallet')}
                  className="h-9 w-9 rounded-full hover:bg-cosmic-800/50"
                  title={t('Wallet', '钱包')}
                >
                  <Wallet className="h-4 w-4" />
                </Button>
              </div>

              {/* Top Left Layout */}
              <div className="flex items-start gap-6">
                {/* Avatar with glow */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
                  <div className="relative">
                    <ProfileAvatar 
                      avatarUrl={avatarUrl}
                      onAvatarChange={onAvatarChange}
                      onRemoveAvatar={onRemoveAvatar}
                      uploadingAvatar={uploadingAvatar}
                      avatarUploadProgress={avatarUploadProgress}
                    />
                  </div>
                </div>
                
                {/* Username, Motto, and Tags */}
                <div className="flex-1 pt-2">
                  {/* Username and Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-primary to-purple-400 bg-clip-text text-transparent">
                      {displayUsername}
                    </h1>
                    <AdminBadge size="sm" />
                  </div>
                  
                  {/* Motto below username */}
                  <div className="mb-4">
                    <ProfileMotto 
                      motto={motto}
                      onSave={onMottoSave}
                      isOwner={true}
                    />
                  </div>

                  {/* Bio if exists */}
                  {bio && (
                    <p className="text-cosmic-300 text-sm leading-relaxed mb-4 max-w-2xl">
                      {bio}
                    </p>
                  )}
                  
                  {/* Collapsible Tags Section */}
                  {tags && tags.length > 0 && (
                    <Collapsible 
                      open={tagsExpanded} 
                      onOpenChange={setTagsExpanded}
                      className="mt-2"
                    >
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="flex items-center gap-2 text-cosmic-300 hover:text-white transition-colors p-0 h-auto"
                        >
                          <span className="text-sm font-medium">
                            {t("Interests", "兴趣")} ({tags.length})
                          </span>
                          {tagsExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3">
                        <motion.div 
                          className="flex flex-wrap gap-2"
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {tags.map((tag: string) => (
                            <motion.div key={tag} variants={itemVariants}>
                              <ProfileTag tag={tag} size="sm" />
                            </motion.div>
                          ))}
                        </motion.div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Content Area - Instagram-like Layout */}
        <div className="max-w-4xl mx-auto pb-12">
          {/* Posts Grid */}
          <UserPostsManager 
            userId={userId} 
            isOwnProfile={true}
            currentUserId={userId}
            key={postsRefreshKey}
            onCreatePost={() => setUploadDialogOpen(true)}
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
