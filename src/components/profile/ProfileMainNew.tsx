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
import { Settings, Wallet, Camera, X, ChevronDown, ChevronUp, Menu, History } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
  setTags,
  isOwnProfile = true,
  viewMode = false
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

      {/* Enhanced Cover Photo */}
      <div className="relative h-[250px] sm:h-[300px] md:h-[400px] overflow-hidden group">
        <div className="absolute inset-0 overflow-hidden">
        {backgroundUrl ? (
          <>
            <img 
              src={backgroundUrl} 
              alt="Profile Background" 
              className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
            />
            {/* Gradient from bottom to preserve image visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-cosmic-950 via-cosmic-950/50 via-30% to-transparent"></div>
            
            {/* Upload Controls - Only show on own profile */}
            {isOwnProfile && !viewMode && (
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
            )}
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
      </div>

      <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-7xl">
        {/* Avatar positioned below background */}
        <div className="relative -mt-24 sm:-mt-28 mb-0 flex justify-center z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative">
              <ProfileAvatar 
                avatarUrl={avatarUrl}
                onAvatarChange={onAvatarChange}
                onRemoveAvatar={onRemoveAvatar}
                uploadingAvatar={uploadingAvatar}
                avatarUploadProgress={avatarUploadProgress}
                viewMode={viewMode}
              />
            </div>
          </div>
        </div>

        {/* Enhanced Profile Header Section - Overlapping with avatar */}
        <div className="relative -mt-12 sm:-mt-16 mb-6 sm:mb-8">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-cosmic-900/10 backdrop-blur-xl border border-primary/10 p-6 sm:p-8 relative">
              {/* Username, Motto, and Tags - Centered */}
              <div className="text-center pt-16 sm:pt-20">
                {/* Username and Badge */}
                <div className="flex items-center justify-center gap-2 mb-2 relative">
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white via-primary to-purple-400 bg-clip-text text-transparent">
                    {displayUsername}
                  </h1>
                  <AdminBadge />
                  
                  {/* Hamburger Menu - Top Right of Username - Only show on own profile */}
                  {!viewMode && (
                    <div className="absolute -right-2 -top-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full bg-gradient-to-br from-cosmic-800/90 to-cosmic-900/90 backdrop-blur-xl border border-primary/30 hover:border-primary/50 hover:from-cosmic-700/90 hover:to-cosmic-800/90 transition-all duration-300 shadow-lg hover:shadow-primary/20"
                          >
                            <Menu className="h-5 w-5 text-primary" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="end" 
                          className="w-56 bg-gradient-to-br from-cosmic-800/95 to-cosmic-900/95 backdrop-blur-xl border border-primary/30 shadow-2xl shadow-primary/20"
                        >
                          <DropdownMenuItem
                            onClick={() => navigate('/activity-history')}
                            className="cursor-pointer py-3 hover:bg-primary/20 focus:bg-primary/20 transition-colors"
                          >
                            <History className="mr-3 h-5 w-5 text-primary" />
                            <span className="text-base">{t('Activity History', '活动历史')}</span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator className="bg-primary/20" />
                          
                          <DropdownMenuItem
                            onClick={() => navigate('/profile/settings')}
                            className="cursor-pointer py-3 hover:bg-primary/20 focus:bg-primary/20 transition-colors"
                          >
                            <Settings className="mr-3 h-5 w-5 text-primary" />
                            <span className="text-base">{t('Settings', '设置')}</span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator className="bg-primary/20" />
                          
                          <DropdownMenuItem
                            onClick={() => navigate('/profile/wallet')}
                            className="cursor-pointer py-3 hover:bg-primary/20 focus:bg-primary/20 transition-colors"
                          >
                            <Wallet className="mr-3 h-5 w-5 text-primary" />
                            <span className="text-base">{t('Wallet', '钱包')}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
                  
                  {/* Motto */}
                  <div className="mb-4 flex justify-center">
                    <ProfileMotto 
                      motto={motto}
                      onSave={onMottoSave}
                      isOwner={!viewMode}
                    />
                  </div>
                  
                  {/* Bio */}
                  {bio && (
                    <p className="text-cosmic-300 text-sm sm:text-base leading-relaxed mb-4 max-w-2xl mx-auto">
                      {bio}
                    </p>
                  )}
                  
                  {/* Tags Section with Collapsible Animation */}
                  {tags && tags.length > 0 && (
                    <Collapsible open={tagsExpanded} onOpenChange={setTagsExpanded}>
                      <div className="mb-3 flex justify-center">
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-cosmic-400 hover:text-primary transition-colors text-xs"
                          >
                            {t("Interests", "兴趣爱好")} ({tags.length})
                            {tagsExpanded ? (
                              <ChevronUp className="ml-2 h-3 w-3" />
                            ) : (
                              <ChevronDown className="ml-2 h-3 w-3" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      
                      <CollapsibleContent>
                        <motion.div 
                          className="flex flex-wrap gap-2 justify-center"
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {tags.map((tag, index) => (
                            <motion.div
                              key={tag}
                              variants={itemVariants}
                            >
                              <ProfileTag tag={tag} />
                            </motion.div>
                          ))}
                        </motion.div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
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
