
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AuthDialog from '../auth/AuthDialog';
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ProfileDropdownMenu from './ProfileDropdownMenu';
import { motion, AnimatePresence } from 'framer-motion';

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
          .maybeSingle();
          
        if (data) {
          // Add cache-busting parameter to force browser to reload the image
          if (data.avatar_url) {
            const cacheBustUrl = `${data.avatar_url}?t=${new Date().getTime()}`;
            setAvatarUrl(cacheBustUrl);
          }
          setProfile({ username: data.username || null });
        }
      };
      
      fetchProfile();
      
      // Set up subscription to profile changes
      const channel = supabase
        .channel('profile_changes')
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'profiles',
            filter: `id=eq.${user.id}`
          }, 
          () => {
            fetchProfile();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/photo-points');
  };

  if (!user) {
    return (
      <>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAuthDialog(true)}
            className="text-primary hover:text-primary hover:bg-primary/10 rounded-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/5 border-primary/20"
            aria-label="Login"
          >
            <UserRound className="h-5 w-5" />
            <span className="hidden sm:inline text-sm font-medium">
              {t("Sign In", "登录")}
            </span>
          </Button>
        </motion.div>
        <AuthDialog
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
        />
      </>
    );
  }

  // Display initials only if there's no avatar URL
  const getUserInitial = () => {
    if (profile?.username) {
      return profile.username[0]?.toUpperCase() || "?";
    }
    return user.email?.[0]?.toUpperCase() || "?";
  };

  return (
    <AnimatePresence>
      <DropdownMenu modal>
        <DropdownMenuTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative rounded-full p-0 border border-primary/30 hover:border-primary shadow-glow focus:ring-2 focus:ring-primary group transition-all duration-300" 
              aria-label="Profile"
            >
              <Avatar className="h-9 w-9 transition-transform duration-300 group-hover:scale-105">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Profile" 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // If image fails to load, fallback to initials
                      setAvatarUrl(null);
                    }}
                  />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getUserInitial()}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background"></span>
            </Button>
          </motion.div>
        </DropdownMenuTrigger>
        <ProfileDropdownMenu
          user={user}
          profile={profile}
          onSignOut={handleSignOut}
          email={user.email}
        />
      </DropdownMenu>
    </AnimatePresence>
  );
};

export default ProfileButton;
