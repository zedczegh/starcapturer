import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface UserSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: UserProfile) => void;
}

export const UserSearchDialog: React.FC<UserSearchDialogProps> = ({
  isOpen,
  onClose,
  onSelectUser
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setUsers([]);
      return;
    }

    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .ilike('username', `%${searchQuery}%`)
          .not('username', 'is', null)
          .limit(20);

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, isOpen]);

  const handleSelectUser = (user: UserProfile) => {
    onSelectUser(user);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('Search Users', '搜索用户')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('Type username...', '输入用户名...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => handleSelectUser(user)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || ''} alt={user.username || ''} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {user.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">@{user.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery.trim().length >= 2 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm">{t('No users found', '未找到用户')}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm">{t('Type at least 2 characters', '至少输入2个字符')}</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
