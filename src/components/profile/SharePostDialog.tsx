import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Search, Loader2, Send } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface User {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface SharePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postOwnerId: string;
  currentUserId: string;
}

export const SharePostDialog: React.FC<SharePostDialogProps> = ({
  open,
  onOpenChange,
  postId,
  postOwnerId,
  currentUserId
}) => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .neq('id', currentUserId)
        .order('username');

      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error(t('Failed to load users', '加载用户失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (recipientId: string) => {
    setSending(true);
    try {
      // Get post details with images array
      const { data: post, error: postError } = await supabase
        .from('user_posts')
        .select('description, file_path, images, user_id')
        .eq('id', postId)
        .single();

      if (postError) throw postError;

      // Get sender username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', currentUserId)
        .single();

      const senderUsername = profile?.username || 'Someone';

      // Get the first image from images array or file_path
      let imageUrl = '';
      if (post.images && Array.isArray(post.images) && post.images.length > 0) {
        const firstImage = post.images[0];
        imageUrl = typeof firstImage === 'string' ? firstImage : '';
      } else if (post.file_path) {
        const { data } = supabase.storage
          .from('user-posts')
          .getPublicUrl(post.file_path);
        imageUrl = data.publicUrl;
      }

      // Send message with post
      const { error: messageError } = await supabase
        .from('user_messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: recipientId,
          message: `${senderUsername} shared a post with you`,
          metadata: {
            type: 'shared_post',
            post_id: postId,
            post_owner_id: post.user_id,
            post_description: post.description,
            post_image_url: imageUrl
          }
        });

      if (messageError) throw messageError;

      // Track share interaction (ignore errors for duplicates)
      try {
        await supabase
          .from('post_interactions')
          .insert({
            user_id: currentUserId,
            post_id: postId,
            interaction_type: 'share'
          });
      } catch (error) {
        // Ignore duplicate share errors
      }

      toast.success(t('Post shared', '帖子已分享'));
      onOpenChange(false);
    } catch (error: any) {
      console.error('Share error:', error);
      toast.error(t('Failed to share post', '分享失败'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-cosmic-900 via-cosmic-900/98 to-cosmic-950 backdrop-blur-2xl border border-primary/30 shadow-2xl max-w-md">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white via-primary-foreground to-primary bg-clip-text text-transparent">
            {t('Share Post', '分享帖子')}
          </DialogTitle>
          <p className="text-sm text-cosmic-300 mt-1">
            {t('Send this post to your connections', '将此帖子发送给您的联系人')}
          </p>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cosmic-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={t('Search users...', '搜索用户...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-cosmic-800/30 border-cosmic-700/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
            />
          </div>

          {/* Users List */}
          <div className="max-h-[420px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-cosmic-400">{t('Loading users...', '加载用户中...')}</p>
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="group flex items-center justify-between p-3 bg-cosmic-800/20 rounded-xl hover:bg-cosmic-800/40 border border-transparent hover:border-primary/20 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-11 w-11 ring-2 ring-cosmic-700/50 group-hover:ring-primary/40 transition-all">
                      {user.avatar_url ? (
                        <AvatarImage src={user.avatar_url} alt={user.username} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-cosmic-700 to-cosmic-800 text-primary">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="text-cosmic-50 font-medium truncate group-hover:text-white transition-colors">
                      {user.username}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleShare(user.id)}
                    disabled={sending}
                    className="gap-2 rounded-full px-4 bg-primary/90 hover:bg-primary hover:scale-105 transition-all shadow-lg shadow-primary/20"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span className="text-sm font-medium">{t('Send', '发送')}</span>
                      </>
                    )}
                  </Button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <div className="h-12 w-12 rounded-full bg-cosmic-800/40 flex items-center justify-center">
                  <User className="h-6 w-6 text-cosmic-400" />
                </div>
                <p className="text-center text-cosmic-400">
                  {t('No users found', '未找到用户')}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
