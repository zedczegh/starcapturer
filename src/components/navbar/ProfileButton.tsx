
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
import { motion } from 'framer-motion';

const ProfileButton = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ username: string | null } | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchProfile = async () => {
      if (!user || isProfileLoading) return;
      
      try {
        setIsProfileLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url, username')
          .eq('id', user.id)
          .maybeSingle();
          
        if (error) throw error;
        
        // Only update state if component is still mounted
        if (isMounted) {
          if (data) {
            if (data.avatar_url) setAvatarUrl(data.avatar_url);
            setProfile({ username: data.username || null });
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      }
    };
    
    // Delay profile fetching to avoid auth deadlocks
    if (user) {
      setTimeout(() => {
        fetchProfile();
      }, 0);
    } else {
      // Reset profile when user logs out
      setAvatarUrl(null);
      setProfile(null);
    }
    
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/photo-points');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleOpenAuthDialog = () => {
    setShowAuthDialog(true);
  };

  // Memoize dropdown trigger to prevent unnecessary re-renders
  const dropdownTrigger = React.useMemo(() => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {user ? (
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative rounded-full p-0 border border-primary/30 hover:border-primary shadow-glow focus:ring-2 focus:ring-primary group transition-all duration-300" 
          aria-label="Profile"
        >
          <Avatar className="h-9 w-9 transition-transform duration-300 group-hover:scale-105">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary">
                {user.email?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            )}
          </Avatar>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background"></span>
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="text-primary hover:text-primary hover:bg-primary/10 rounded-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/5 border-primary/20"
          aria-label="Login"
        >
          <UserRound className="h-5 w-5" />
          <span className="hidden sm:inline text-sm font-medium">
            {t("Sign In", "登录")}
          </span>
        </Button>
      )}
    </motion.div>
  ), [user, avatarUrl, t]);

  return (
    <>
      <DropdownMenu modal>
        <DropdownMenuTrigger asChild>
          {dropdownTrigger}
        </DropdownMenuTrigger>
        <ProfileDropdownMenu
          user={user}
          profile={profile}
          onSignOut={handleSignOut}
          email={user?.email || null}
          onOpenAuthDialog={handleOpenAuthDialog}
        />
      </DropdownMenu>
      
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
      />
    </>
  );
};

export default ProfileButton;
