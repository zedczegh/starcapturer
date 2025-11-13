import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Loader2, Image as ImageIcon, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/optimized-components';

interface FeaturedImage {
  id: string;
  user_id: string;
  file_path: string;
  display_order: number;
  created_at: string;
}

interface FeaturedAlbumManagerProps {
  userId: string;
  isOwnProfile?: boolean;
  onAvatarSelect?: (imageUrl: string) => void;
}

export const FeaturedAlbumManager: React.FC<FeaturedAlbumManagerProps> = ({ 
  userId, 
  isOwnProfile = false,
  onAvatarSelect 
}) => {
  const [images, setImages] = useState<FeaturedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  useEffect(() => {
    loadImages();
  }, [userId]);

  const loadImages = async () => {
    try {
      const { data, error } = await supabase
        .from('user_featured_album')
        .select('*')
        .eq('user_id', userId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error: any) {
      console.error('Error loading featured images:', error);
      toast.error('Failed to load featured album');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Limit to 9 featured images
    if (images.length + files.length > 9) {
      toast.error('Maximum 9 featured images allowed');
      return;
    }

    // Check file size (20MB limit)
    const maxSize = 20 * 1024 * 1024; // 20MB in bytes
    for (const file of Array.from(files)) {
      if (file.size > maxSize) {
        toast.error(`File "${file.name}" exceeds 20MB limit`);
        return;
      }
    }

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/featured/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('user-posts')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from('user_featured_album')
          .insert({
            user_id: userId,
            file_path: fileName,
            display_order: images.length + index,
          });

        if (dbError) throw dbError;
      });

      await Promise.all(uploadPromises);

      toast.success('Images added to featured album');
      setUploadDialogOpen(false);
      await loadImages();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Upload failed', { description: error.message });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (imageId: string, filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('user-posts')
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('user_featured_album')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      setImages(images.filter(img => img.id !== imageId));
      toast.success('Image removed from featured album');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Delete failed');
    }
  };

  const getImageUrl = (filePath: string) => {
    const { data } = supabase.storage.from('user-posts').getPublicUrl(filePath);
    return data?.publicUrl || '';
  };

  const handleSetAsAvatar = (imageUrl: string) => {
    if (onAvatarSelect) {
      onAvatarSelect(imageUrl);
      toast.success('Click Save to update your avatar');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="bg-cosmic-900/95 backdrop-blur-xl border-cosmic-700/30 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          <h2 className="text-xl font-bold text-foreground">Featured Album</h2>
        </div>
        {isOwnProfile && (
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" disabled={images.length >= 9}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-cosmic-900 border-cosmic-700">
              <DialogHeader>
                <DialogTitle className="text-foreground">Add to Featured Album</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select your best photos to showcase ({images.length}/9)
                </p>
                <div>
                  <Label htmlFor="featured-file" className="text-foreground">Select Files (Max 20MB each)</Label>
                  <Input
                    id="featured-file"
                    type="file"
                    multiple
                    onChange={handleUpload}
                    disabled={uploading}
                    className="bg-cosmic-800 border-cosmic-700 text-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">All file types supported</p>
                </div>
                {uploading && (
                  <div className="flex items-center gap-2 text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading...</span>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {images.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-cosmic-700 rounded-lg">
          <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No featured images yet</p>
          {isOwnProfile && <p className="text-sm mt-2">Showcase your best moments!</p>}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <AnimatePresence mode="popLayout">
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="relative aspect-square overflow-hidden rounded-lg border-2 border-yellow-400/30 hover:border-yellow-400 transition-all bg-cosmic-950 group shadow-lg hover:shadow-yellow-400/20"
              >
                <OptimizedImage
                  src={getImageUrl(image.file_path)}
                  alt={`Featured ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className = 'w-full h-full flex flex-col items-center justify-center bg-cosmic-900';
                      fallback.innerHTML = '<svg class="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>';
                      parent.appendChild(fallback);
                    }
                  }}
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  {isOwnProfile && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleSetAsAvatar(getImageUrl(image.file_path))}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Set as Avatar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(image.id, image.file_path)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Featured star badge */}
                <div className="absolute top-2 right-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {isOwnProfile && images.length > 0 && (
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Click on any featured image to set it as your avatar
        </p>
      )}
    </Card>
  );
};
