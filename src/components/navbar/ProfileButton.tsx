
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AuthDialog from '../auth/AuthDialog';
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfileDropdownMenu from './ProfileDropdownMenu';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchUserProfile, ensureUserProfile } from '@/utils/profileUtils';
import { toast } from 'sonner';

const ProfileButton = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ username: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    if (user) {
      const loadProfile = async () => {
        setLoading(true);
        setError(null);
        
        try {
          console.log("Loading profile in ProfileButton for user:", user.id);
          
          // Ensure the user has a profile entry in the database
          const profileCreated = await ensureUserProfile(user.id);
          
          if (!profileCreated) {
            console.error("Failed to ensure user profile exists in ProfileButton");
            if (isMounted) {
              setError("Failed to load profile");
              setLoading(false);
            }
            return;
          }
          
          const profileData = await fetchUserProfile(user.id);
          
          if (isMounted && profileData) {
            console.log("Profile loaded in ProfileButton:", profileData);
            if (profileData.avatar_url) setAvatarUrl(profileData.avatar_url);
            setProfile({ username: profileData.username });
            setLoading(false);
          }
        } catch (error) {
          console.error("Error loading profile in ProfileButton:", error);
          if (isMounted) {
            setError("Error loading profile");
            setLoading(false);
          }
        }
      };
      
      loadProfile();
    } else {
      setAvatarUrl(null);
      setProfile(null);
      setLoading(false);
      setError(null);
    }
    
    return () => {
      isMounted = false;
    };
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
            variant="ghost"
            size="sm"
            onClick={() => setShowAuthDialog(true)}
            className="text-primary hover:text-primary hover:bg-primary/10 rounded-full flex items-center justify-center gap-2 px-4"
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
              className="relative rounded-full p-0 hover:bg-transparent focus:ring-2 focus:ring-primary" 
              aria-label="Profile"
            >
              <Avatar className="h-8 w-8 transition-transform duration-300 group-hover:scale-105">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-cosmic-800/60 text-cosmic-400">
                    {user.email?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                )}
              </Avatar>
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
