
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
} from '@/components/ui/dropdown-menu';
import { BookmarkPlus, UserRound, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const ProfileButton = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        
        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
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
          className="text-primary hover:text-primary/80 rounded-full flex items-center justify-center transition-colors duration-300"
          aria-label="Login"
        >
          <UserRound className="h-5 w-5 hover:scale-110 transition-transform" />
        </Button>
        <AuthDialog 
          open={showAuthDialog} 
          onOpenChange={setShowAuthDialog} 
        />
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative rounded-full p-0 hover:scale-105 transition-transform duration-300"
        >
          <Avatar className="h-8 w-8 ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-300">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary">
                {user.email?.[0].toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        className="w-48 bg-cosmic-800/80 backdrop-blur-xl border border-cosmic-700/50"
      >
        <DropdownMenuItem 
          onClick={() => navigate('/collections')}
          className="hover:bg-cosmic-700/50 focus:bg-cosmic-700/50 text-cosmic-100 group"
        >
          <BookmarkPlus className="mr-2 h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          {t("My Collections", "我的收藏")}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => navigate('/profile')}
          className="hover:bg-cosmic-700/50 focus:bg-cosmic-700/50 text-cosmic-100 group"
        >
          <UserRound className="mr-2 h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          {t("Profile", "个人资料")}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="hover:bg-cosmic-700/50 focus:bg-cosmic-700/50 text-cosmic-100 group"
        >
          <LogOut className="mr-2 h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          {t("Sign Out", "登出")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileButton;
