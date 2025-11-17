import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, X } from 'lucide-react';
import { PostImageCarousel } from './PostImageCarousel';
import { PostInteractions } from './PostInteractions';
import { PostComments } from './PostComments';
import { motion } from 'framer-motion';

interface PostDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    id: string;
    user_id: string;
    description: string | null;
    file_name: string;
    images: string[];
  };
  isOwnProfile: boolean;
  currentUserId: string | null;
  onEdit: () => void;
  onDelete: () => void;
}

export const PostDetailDialog: React.FC<PostDetailDialogProps> = ({
  open,
  onOpenChange,
  post,
  isOwnProfile,
  currentUserId,
  onEdit,
  onDelete
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 bg-cosmic-900/95 backdrop-blur-xl border border-primary/20">
        <div className="relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute top-2 right-2 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="grid md:grid-cols-2 gap-0">
            {/* Left side - Image/Video Carousel */}
            <div className="bg-black">
              <PostImageCarousel 
                images={post.images}
                alt={post.description || post.file_name}
              />
            </div>

            {/* Right side - Details */}
            <div className="p-6 flex flex-col">
              {/* Action buttons for own posts */}
              {isOwnProfile && (
                <div className="flex gap-2 mb-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onEdit}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              )}

              {/* Description */}
              {post.description && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-cosmic-100 mb-4 whitespace-pre-wrap"
                >
                  {post.description}
                </motion.p>
              )}

              {/* Interactions */}
              <div className="mb-4">
                <PostInteractions postId={post.id} userId={post.user_id} currentUserId={currentUserId || undefined} />
              </div>

              {/* Comments */}
              <div className="flex-1 overflow-y-auto">
                <PostComments postId={post.id} currentUserId={currentUserId} />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
