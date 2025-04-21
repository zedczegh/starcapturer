
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AuthDialog from '../auth/AuthDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { BookmarkPlus, UserRound, LogOut, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const ProfileButton = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ username: string | null } | null>(null);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url, username')
          .eq('id', user.id)
          .single();
        if (data) {
          if (data.avatar_url) setAvatarUrl(data.avatar_url);
          setProfile({ username: data.username || null });
        }
      };
      fetchProfile();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/photo-points');
  };

  if (!user) {
    return (
      <>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowAuthDialog(true)}
          className="text-primary hover:text-primary-focus rounded-full flex items-center justify-center"
          aria-label="Login"
        >
          <UserRound className="h-5 w-5" />
        </Button>
        <AuthDialog 
          open={showAuthDialog} 
          onOpenChange={setShowAuthDialog} 
        />
      </>
    );
  }

  return (
    <DropdownMenu modal>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative rounded-full p-0 border border-accent/40 hover:border-primary shadow-glow focus:ring-2 focus:ring-primary group" aria-label="Profile">
          <Avatar className="h-8 w-8">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <AvatarFallback>
                {user.email?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[200] min-w-[220px] rounded-xl shadow-2xl cosmic-dropdown">
        <DropdownMenuLabel className="glass-dropdown-label px-3 pt-3 pb-2 flex flex-col space-y-0.5 border-none">
          <span className="font-bold text-lg text-primary/90">{profile && profile.username ? profile.username : t("Account", "账户")}</span>
          <span className="text-xs text-cosmic-400 truncate">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')} className="hover:!bg-primary/10 hover:text-primary interactive-button px-3 py-2 rounded-lg">
          <User className="mr-2 h-4 w-4 text-primary" />
          {t("Profile", "个人资料")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/collections')} className="hover:!bg-primary/10 hover:text-primary interactive-button px-3 py-2 rounded-lg">
          <BookmarkPlus className="mr-2 h-4 w-4 text-primary" />
          {t("My Collections", "我的收藏")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/settings')} className="hover:!bg-primary/10 hover:text-primary interactive-button px-3 py-2 rounded-lg">
          <Settings className="mr-2 h-4 w-4 text-primary" />
          {t("Settings", "设置")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive hover:!bg-destructive/10 hover:text-destructive interactive-button px-3 py-2 rounded-lg">
          <LogOut className="mr-2 h-4 w-4" />
          {t("Sign Out", "登出")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileButton;

