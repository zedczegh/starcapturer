import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Trash2, Loader2, Image, Heart, MessageCircle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/optimized-components';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserPost {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description: string | null;
  category: string;
  created_at: string;
}

interface UserPostsManagerProps {
  userId: string;
  isOwnProfile?: boolean;
}

export const UserPostsManager: React.FC<UserPostsManagerProps> = ({ userId, isOwnProfile = false }) => {
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadPosts();
  }, [userId]);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('user_posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!description.trim()) {
      toast.error('Please add a description');
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('user-posts')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from('user_posts')
          .insert({
            user_id: userId,
            file_name: file.name,
            file_path: fileName,
            file_type: file.type,
            file_size: file.size,
            description: description,
            category: category,
          });

        if (dbError) throw dbError;
      });

      await Promise.all(uploadPromises);

      toast.success('Posts uploaded successfully');
      setDescription('');
      setUploadDialogOpen(false);
      await loadPosts();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Upload failed', { description: error.message });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (postId: string, filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('user-posts')
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('user_posts')
        .delete()
        .eq('id', postId);

      if (dbError) throw dbError;

      setPosts(posts.filter(p => p.id !== postId));
      toast.success('Post deleted');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Delete failed');
    }
  };

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage.from('user-posts').getPublicUrl(filePath);
    return data?.publicUrl || '';
  };

  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(p => p.category === selectedCategory);

  const categories = ['all', 'general', 'photography', 'artwork', 'moments'];

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
        <h2 className="text-2xl font-bold text-foreground">Posts</h2>
        {isOwnProfile && (
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Post
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-cosmic-900 border-cosmic-700">
              <DialogHeader>
                <DialogTitle className="text-foreground">Upload New Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category" className="text-foreground">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-cosmic-800 border-cosmic-700 text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-cosmic-800 border-cosmic-700">
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="photography">Photography</SelectItem>
                      <SelectItem value="artwork">Artwork</SelectItem>
                      <SelectItem value="moments">Moments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description" className="text-foreground">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Write a caption..."
                    className="bg-cosmic-800 border-cosmic-700 text-foreground min-h-[100px]"
                  />
                </div>
                <div>
                  <Label htmlFor="file" className="text-foreground">Select Images</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUpload}
                    disabled={uploading}
                    className="bg-cosmic-800 border-cosmic-700 text-foreground"
                  />
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

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-4">
        <TabsList className="bg-cosmic-800 border-cosmic-700">
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="capitalize">
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No posts yet</p>
          {isOwnProfile && <p className="text-sm mt-2">Share your first post!</p>}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          <AnimatePresence mode="popLayout">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ scale: 1.02 }}
                className="relative aspect-square overflow-hidden rounded-sm border border-cosmic-700 hover:border-primary/50 transition-all bg-cosmic-950 group cursor-pointer"
              >
                {post.file_type.startsWith('image/') ? (
                  <OptimizedImage
                    src={getFileUrl(post.file_path)}
                    alt={post.description || post.file_name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-cosmic-900">
                    <Image className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                  {post.description && (
                    <p className="text-white text-xs text-center line-clamp-2 px-2">
                      {post.description}
                    </p>
                  )}
                  {isOwnProfile && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(post.id, post.file_path);
                      }}
                      className="mt-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </Card>
  );
};
