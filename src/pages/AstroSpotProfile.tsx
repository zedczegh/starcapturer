import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from "@/contexts/LanguageContext";
import { translateCategory, translateType } from "@/utils/linkTranslations";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { ExternalLink, Loader2, MapPin, MessageCircle, Tag, Calendar, Star, ChevronLeft, Wrench, Album, User2 } from "lucide-react";
import { motion } from "framer-motion";
import BackButton from "@/components/navigation/BackButton";
import CreateAstroSpotDialog from '@/components/astro-spots/CreateAstroSpotDialog';
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const AstroSpotProfile = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showPhotosDialog, setShowPhotosDialog] = useState(false);
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [comingFromCommunity, setComingFromCommunity] = useState(false);
  const [showInstantLoader, setShowInstantLoader] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: spot, isLoading, error, refetch } = useQuery({
    queryKey: ['astroSpot', id],
    queryFn: async () => {
      if (!id) throw new Error("No spot ID provided");
      const { data: spotData, error: spotError } = await supabase
        .from('user_astro_spots')
        .select('*')
        .eq('id', id)
        .single();
      if (spotError) throw spotError;
      if (user && spotData.user_id === user.id) setIsCreator(true);
      else setIsCreator(false);

      const { data: typeData } = await supabase
        .from('astro_spot_types').select('*').eq('spot_id', id);
      const { data: advantageData } = await supabase
        .from('astro_spot_advantages').select('*').eq('spot_id', id);
      const { data: commentData } = await supabase
        .from('astro_spot_comments')
        .select('*, profiles:user_id(username, avatar_url)')
        .eq('spot_id', id);

      return {
        ...spotData,
        astro_spot_types: typeData || [],
        astro_spot_advantages: advantageData || [],
        astro_spot_comments: commentData || [],
      };
    },
    retry: 1,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false
  });

  const { data: creatorProfile, isLoading: loadingCreator } = useQuery({
    queryKey: ['creatorProfile', spot?.user_id],
    queryFn: async () => {
      if (!spot?.user_id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', spot.user_id)
        .maybeSingle();
      if (error) {
        console.error("Error fetching creator profile:", error);
        return null;
      }
      return data;
    },
    enabled: !!spot?.user_id
  });

  useEffect(() => {
    if (location.state?.from === "community") {
      setComingFromCommunity(true);
      setShowInstantLoader(true);
    }
  }, [location.state]);

  useEffect(() => {
    if (!isLoading && !!spot) {
      setShowInstantLoader(false);
    }
  }, [isLoading, spot]);

  const { data: spotImages = [], isLoading: loadingImages } = useQuery({
    queryKey: ['spotImages', id],
    queryFn: async () => {
      if (!id) return [];
      const { data: files, error } = await supabase
        .storage
        .from('astro_spot_images')
        .list(id);
      if (error) return [];
      return files.map(file => {
        const { data } = supabase
          .storage
          .from('astro_spot_images')
          .getPublicUrl(`${id}/${file.name}`);
        return data.publicUrl;
      });
    },
    enabled: !!id
  });

  const handleViewDetails = () => {
    if (spot) {
      navigate(`/location/${spot.latitude},${spot.longitude}`, {
        state: {
          latitude: spot.latitude,
          longitude: spot.longitude,
          name: spot.name,
          bortleScale: spot.bortlescale,
          siqs: spot.siqs
        }
      });
    }
  };

  const handleEditClose = () => {
    setShowEditDialog(false);
    refetch(); // Refresh spot data after editing
  };

  const handleCommentSubmit = async () => {
    if (!user?.id || !id || !commentInput.trim()) return;
    setCommentSending(true);
    const { error, data } = await supabase
      .from("astro_spot_comments")
      .insert({
        user_id: user.id,
        spot_id: id,
        content: commentInput.trim(),
      })
      .select("*, profiles:user_id(username, avatar_url)")
      .single();
    if (error) {
      toast.error(t("Failed to post comment.", "评论发送失败。"));
      setCommentSending(false);
      return;
    }
    setCommentInput("");
    // Optimistically update comments cache
    if (spot?.astro_spot_comments) {
      spot.astro_spot_comments.unshift(data);
    }
    toast.success(t("Comment posted!", "评论已发表！"));
    setCommentSending(false);
    refetch(); // Refresh data to ensure update consistency
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    if (spotImages.length + e.target.files.length > 10) {
      toast.error(t("Maximum 10 images allowed", "最多允许10张图片"));
      return;
    }
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleUploadImages = async () => {
    if (!id || !selectedFiles.length) return;
    setImageUploading(true);
    const bucket = "astro_spot_images";
    for (const file of selectedFiles) {
      // Upload each file using Supabase Storage
      const { error } = await supabase.storage
        .from(bucket)
        .upload(`${id}/${file.name}`, file, { upsert: false });
      if (error) {
        toast.error(t("Failed to upload one or more images.", "部分图片上传失败"));
        setImageUploading(false);
        return;
      }
    }
    setSelectedFiles([]);
    toast.success(t("Images uploaded!", "图片已上传！"));
    refetch(); // Refresh images
    setImageUploading(false);
  };

  if (isLoading || !spot || showInstantLoader) {
    if (error) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
          <NavBar />
          <div className="container py-12">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-200 mb-2">
                {t("Error loading AstroSpot", "加载观星点时出错")}
              </h2>
              <p className="text-gray-400 mb-4">{error.message}</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (location.state?.from === 'community') {
                    navigate('/community');
                  } else {
                    navigate('/manage-astro-spots');
                  }
                }}
                className="mt-4"
              >
                {location.state?.from === 'community' 
                  ? t("Back to Community", "返回社区") 
                  : t("Back to My AstroSpots", "返回我的观星点")}
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
        <NavBar />
        <div className="container max-w-4xl py-8 px-4 md:px-6">
          <Skeleton className="w-48 h-8 mb-6 rounded-lg" />
          <div className="glassmorphism rounded-xl border border-cosmic-700/50 shadow-glow overflow-hidden relative">
            <div className="bg-gradient-to-r from-cosmic-800/80 to-cosmic-800/40 p-6 border-b border-cosmic-700/30">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                  <Skeleton className="h-10 w-64 rounded mb-2" />
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-4 w-28 rounded mt-2" />
                </div>
                <Skeleton className="h-9 w-40 rounded-full" />
              </div>
              <Skeleton className="h-6 w-36 mt-4 rounded-full" />
            </div>
            <div className="p-6 space-y-6">
              <Skeleton className="h-16 w-full rounded-lg mb-4" />
              <Skeleton className="h-10 w-3/4 rounded-lg mb-3" />
              <Skeleton className="h-10 w-2/3 rounded-lg mb-3" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getUsername = (comment) => {
    if (!comment || !comment.profiles) return t("Anonymous", "匿名用户");
    if (typeof comment.profiles === 'object') {
      return comment.profiles.username || t("Anonymous", "匿名用户");
    }
    return t("Anonymous", "匿名用户");
  };

  const renderCreatorAvatar = () => {
    if (loadingCreator) {
      return (
        <div className="h-10 w-10 rounded-full bg-cosmic-700 animate-pulse mr-3" />
      );
    }
    if (creatorProfile?.avatar_url) {
      return (
        <img
          src={creatorProfile.avatar_url}
          alt="Creator Avatar"
          className="h-10 w-10 rounded-full object-cover mr-3 border-2 border-primary shadow"
        />
      );
    }
    return (
      <span className="h-10 w-10 flex items-center justify-center bg-cosmic-700 rounded-full mr-3 border-2 border-cosmic-700">
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 19a4 4 0 0 0-8 0m8 0v2a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-2m8 0H8a8 8 0 0 1 8-8h0a8 8 0 0 1 8 8z"/>
        </svg>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
      <NavBar />
      <div className="container max-w-4xl py-8 px-4 md:px-6 relative">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2">
            {renderCreatorAvatar()}
            {loadingCreator ? (
              <div className="h-4 w-32 rounded bg-cosmic-700 animate-pulse" />
            ) : creatorProfile && creatorProfile.username ? (
              <Link
                to={`/profile/${spot.user_id}`}
                className="text-base font-semibold underline hover:text-primary text-gray-200 truncate max-w-[10rem]"
                title={creatorProfile.username}
              >
                @{creatorProfile.username}
              </Link>
            ) : (
              <span className="text-base font-semibold text-gray-400">
                {t("Unknown", "未知用户")}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">{t("Created by this user", "由该用户创建")}</div>
        </div>

        <BackButton
          destination={comingFromCommunity ? "/community" : "/manage-astro-spots"}
          className="text-gray-300 mb-6 hover:bg-cosmic-800/50"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glassmorphism rounded-xl border border-cosmic-700/50 shadow-glow overflow-hidden relative"
        >
          {isCreator && !comingFromCommunity && (
            <Button
              variant="default"
              size="icon"
              className="absolute -top-2 -left-2 z-10 bg-primary/20 hover:bg-primary/30 text-white rounded-full w-12 h-12 shadow-lg border border-cosmic-700/30"
              onClick={() => setShowEditDialog(true)}
            >
              <Wrench className="h-6 w-6" />
            </Button>
          )}

          <div className="bg-gradient-to-r from-cosmic-800/80 to-cosmic-800/40 p-6 border-b border-cosmic-700/30">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold text-gray-50 flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 mr-2 animate-pulse" />
                  {spot.name}
                </h1>
                <div className="flex items-center text-gray-400 text-sm">
                  <MapPin className="h-4 w-4 mr-1" />
                  {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
                </div>
                <div className="flex items-center text-gray-400 text-sm mt-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(spot.created_at).toLocaleDateString()}
                </div>
              </div>
              <Button
                variant="default"
                onClick={handleViewDetails}
                className="bg-primary/80 hover:bg-primary flex items-center gap-2 rounded-full mt-4 sm:mt-0"
              >
                <ExternalLink className="h-4 w-4" />
                {t("View Location Details", "查看位置详情")}
              </Button>
            </div>
            {spot.siqs && (
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-cosmic-700/60 text-primary-foreground">
                <span className="font-bold mr-1">{t("SIQS", "SIQS")}:</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-mono text-sm ${
                    spot.siqs >= 8 ? 'bg-green-500/80 text-white'
                    : spot.siqs >= 6 ? 'bg-blue-500/80 text-white'
                    : spot.siqs >= 4 ? 'bg-yellow-500/80 text-white'
                    : 'bg-red-500/80 text-white'
                  }`}
                >
                  {spot.siqs}
                </span>
              </div>
            )}
          </div>
          
          <div className="p-6 space-y-6">
            {spot.description && (
              <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30">
                <h2 className="text-xl font-semibold text-gray-200 mb-3 flex items-center">
                  <span className="w-2 h-6 bg-primary rounded-sm mr-2.5"></span>
                  {t("Description", "描述")}
                </h2>
                <p className="text-gray-300 whitespace-pre-wrap">{spot.description}</p>
              </div>
            )}
            
            {spot.astro_spot_types && spot.astro_spot_types.length > 0 && (
              <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30">
                <h2 className="text-xl font-semibold text-gray-200 mb-3 flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-primary/80" />
                  {t("Location Type", "位置类型")}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {spot.astro_spot_types.map((type) => (
                    <span 
                      key={type.id}
                      className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-700/50 to-indigo-700/50 border border-purple-600/30 text-sm text-gray-200 backdrop-blur-sm"
                    >
                      {t(
                        translateType(type.type_name) !== type.type_name ? type.type_name : type.type_name,
                        translateType(type.type_name)
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {spot.astro_spot_advantages && spot.astro_spot_advantages.length > 0 && (
              <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30">
                <h2 className="text-xl font-semibold text-gray-200 mb-3 flex items-center">
                  <span className="w-2 h-6 bg-green-500 rounded-sm mr-2.5"></span>
                  {t("Advantages", "优势")}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {spot.astro_spot_advantages.map((advantage) => (
                    <span 
                      key={advantage.id}
                      className="px-3 py-1 rounded-full bg-gradient-to-r from-green-700/50 to-teal-700/50 border border-green-600/30 text-sm text-gray-200 backdrop-blur-sm"
                    >
                      {t(
                        translateCategory(advantage.advantage_name) !== advantage.advantage_name ? advantage.advantage_name : advantage.advantage_name,
                        translateCategory(advantage.advantage_name)
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30">
              <h2 className="text-xl font-semibold text-gray-200 mb-3 flex items-center">
                <Album className="h-5 w-5 mr-2 text-primary/80" />
                {t("Location Images", "位置图片")}
              </h2>
              
              {spotImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {spotImages.map((imageUrl, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-square overflow-hidden rounded-lg border border-cosmic-600/30 shadow-md"
                      onClick={() => setShowPhotosDialog(true)}
                    >
                      <img 
                        src={imageUrl} 
                        alt={`${spot.name} - ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <Album className="h-12 w-12 text-gray-500 mb-3" />
                  <p className="text-gray-400">
                    {t("No images available", "暂无图片")}
                  </p>
                </div>
              )}
            </div>
            
            {spot.astro_spot_comments && spot.astro_spot_comments.length > 0 ? (
              <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-semibold text-gray-200 flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2 text-primary/80" />
                    {t("Comments", "评论")} ({spot.astro_spot_comments.length})
                  </h2>
                  
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowCommentsSheet(true)}
                    className="text-sm text-primary hover:bg-cosmic-700/30"
                  >
                    {t("View All", "查看全部")}
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {spot.astro_spot_comments.slice(0, 2).map((comment) => (
                    <div 
                      key={comment.id}
                      className="p-3 bg-cosmic-800/20 rounded-lg border border-cosmic-600/20"
                    >
                      <div className="flex items-center mb-2">
                        <div className="font-medium text-gray-200">
                          {getUsername(comment)}
                        </div>
                        <span className="text-gray-500 text-sm ml-2">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-300">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30 flex flex-col items-center justify-center text-center">
                <MessageCircle className="h-10 w-10 text-gray-500 mb-2" />
                <p className="text-gray-400">
                  {t("No comments yet", "暂无评论")}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      
      <Dialog open={showPhotosDialog} onOpenChange={setShowPhotosDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Photo Album", "照片集")}: {spot.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {spotImages.map((imageUrl, index) => (
              <div key={index} className="relative overflow-hidden rounded-lg border border-cosmic-600/30">
                <img 
                  src={imageUrl} 
                  alt={`${spot.name} - ${index + 1}`}
                  className="w-full h-auto object-contain"
                />
              </div>
            ))}
          </div>
          {spotImages.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <Album className="h-16 w-16 text-gray-500 mb-4" />
              <p className="text-gray-400 text-lg">
                {t("No images available", "暂无图片")}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Sheet open={showCommentsSheet} onOpenChange={setShowCommentsSheet}>
        <SheetContent side="bottom" className="h-[85vh] bg-cosmic-900 border-cosmic-700 text-gray-100 rounded-t-xl">
          <SheetHeader>
            <SheetTitle className="text-gray-100">
              {t("All Comments", "所有评论")} ({spot.astro_spot_comments?.length || 0})
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto pr-1">
            {spot.astro_spot_comments?.length > 0 ? 
              spot.astro_spot_comments.map((comment) => (
                <div 
                  key={comment.id}
                  className="p-3 bg-cosmic-800/30 rounded-lg border border-cosmic-600/20"
                >
                  <div className="flex items-center mb-2">
                    <div className="font-medium text-gray-200">
                      {getUsername(comment)}
                    </div>
                    <span className="text-gray-500 text-sm ml-2">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300">{comment.content}</p>
                </div>
              )) : (
                <div className="text-center py-10">
                  <p className="text-gray-400">
                    {t("No comments yet", "暂无评论")}
                  </p>
                </div>
              )
            }
          </div>
        </SheetContent>
      </Sheet>

      {showEditDialog && spot && isCreator && (
        <CreateAstroSpotDialog
          latitude={spot.latitude}
          longitude={spot.longitude}
          defaultName={spot.name}
          isEditing={true}
          spotId={spot.id}
          defaultDescription={spot.description}
          trigger={<div />}
          onClose={handleEditClose}
        />
      )}

      <footer className="mt-auto py-8 bg-cosmic-900/60 border-t border-cosmic-800/30">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Star className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold text-gray-200">
                {t("AstroSIQS", "天文SIQS")}
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
              <Link to="/photo-points" className="text-sm text-gray-400 hover:text-primary transition-colors">
                {t("Photo Points", "拍摄点")}
              </Link>
              <Link to="/share" className="text-sm text-gray-400 hover:text-primary transition-colors">
                {t("Bortle Now", "实时光污染")}
              </Link>
              <Link to="/useful-links" className="text-sm text-gray-400 hover:text-primary transition-colors">
                {t("Resources", "资源")}
              </Link>
              <Link to="/about" className="text-sm text-gray-400 hover:text-primary transition-colors">
                {t("About SIQS", "关于SIQS")}
              </Link>
            </div>
            <div className="text-sm text-gray-500 mt-4 md:mt-0">
              &copy; {new Date().getFullYear()} AstroSIQS
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AstroSpotProfile;
