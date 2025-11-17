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
      // Get post details
      const { data: post, error: postError } = await supabase
        .from('user_posts')
        .select('description, file_path')
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
            post_description: post.description,
            post_file_path: post.file_path
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
      <DialogContent className="bg-cosmic-900/95 backdrop-blur-xl border-primary/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">
            {t('Share Post', '分享帖子')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cosmic-400" />
            <Input
              placeholder={t('Search users...', '搜索用户...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-cosmic-950/50 border-primary/20"
            />
          </div>

          {/* Users List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-cosmic-800/40 rounded-lg hover:bg-cosmic-800/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {user.avatar_url ? (
                        <AvatarImage src={user.avatar_url} alt={user.username} />
                      ) : (
                        <AvatarFallback className="bg-cosmic-700">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="text-cosmic-100 font-medium">{user.username}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleShare(user.id)}
                    disabled={sending}
                    className="gap-2"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {t('Send', '发送')}
                      </>
                    )}
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-cosmic-400 py-8">
                {t('No users found', '未找到用户')}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
