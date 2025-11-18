import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  currentDescription: string;
  currentImages: string[]; // Array of file paths
  onUpdateComplete: () => void;
}

export const EditPostDialog: React.FC<EditPostDialogProps> = ({
  open,
  onOpenChange,
  postId,
  currentDescription,
  currentImages,
  onUpdateComplete
}) => {
  const [description, setDescription] = useState(currentDescription);
  const [images, setImages] = useState<string[]>(currentImages);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviewUrls, setNewPreviewUrls] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxSize = 300 * 1024 * 1024; // 300MB
    const validFiles: File[] = [];
    const urls: string[] = [];

    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        toast.error(`File "${file.name}" exceeds 300MB limit`);
        return;
      }
      validFiles.push(file);
      urls.push(URL.createObjectURL(file));
    });

    setNewFiles(prev => [...prev, ...validFiles]);
    setNewPreviewUrls(prev => [...prev, ...urls]);
  };

  const removeExistingImage = async (imagePath: string, index: number) => {
    try {
      // Delete from storage
      const { error } = await supabase.storage
        .from('user-posts')
        .remove([imagePath]);

      if (error) throw error;

      setImages(prev => prev.filter((_, i) => i !== index));
      toast.success('Image removed');
    } catch (error: any) {
      console.error('Remove image error:', error);
      toast.error('Failed to remove image');
    }
  };

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newPreviewUrls[index]);
    setNewFiles(prev => prev.filter((_, i) => i !== index));
    setNewPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdate = async () => {
    if (images.length === 0 && newFiles.length === 0) {
      toast.error('Post must have at least one image');
      return;
    }

    if (!description.trim()) {
      toast.error('Please add a description');
      return;
    }

    setUpdating(true);

    try {
      // Upload new files
      const uploadedPaths: string[] = [];
      for (const file of newFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${postId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('user-posts')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        uploadedPaths.push(filePath);
      }

      // Combine existing and new images
      const allImages = [...images, ...uploadedPaths];

      // Update post
      const { error: updateError } = await supabase
        .from('user_posts')
        .update({
          description: description.trim(),
          images: allImages,
          // Keep file_path as first image for backward compatibility
          file_path: allImages[0]
        })
        .eq('id', postId);

      if (updateError) throw updateError;

      toast.success('Post updated successfully');
      newPreviewUrls.forEach(url => URL.revokeObjectURL(url));
      onUpdateComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error('Failed to update post');
    } finally {
      setUpdating(false);
    }
  };

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage.from('user-posts').getPublicUrl(path);
    return data?.publicUrl || '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing Images */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Images</label>
            <div className="grid grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {images.map((imagePath, index) => (
                  <motion.div
                    key={imagePath}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-border"
                  >
                    <img
                      src={getImageUrl(imagePath)}
                      alt={`Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeExistingImage(imagePath, index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* New Images */}
          {newPreviewUrls.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">New Images</label>
              <div className="grid grid-cols-2 gap-3">
                <AnimatePresence mode="popLayout">
                  {newPreviewUrls.map((url, index) => (
                    <motion.div
                      key={url}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative group aspect-square rounded-lg overflow-hidden border border-border"
                    >
                      <img
                        src={url}
                        alt={`New ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeNewImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Add More Images */}
          <div>
            <input
              type="file"
              id="add-images"
              multiple
              accept="image/*,image/tiff,image/tif,image/x-canon-cr2,image/x-nikon-nef,image/x-sony-arw,image/x-adobe-dng,image/x-panasonic-raw,image/x-olympus-orf,image/x-panasonic-rw2,image/x-pentax-pef,image/x-fuji-raf,.tiff,.tif,.cr2,.nef,.arw,.dng,.raw,.orf,.rw2,.pef,.raf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label htmlFor="add-images">
              <Button variant="outline" className="w-full" asChild>
                <span>Add More Images</span>
              </Button>
            </label>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a caption..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Post'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
