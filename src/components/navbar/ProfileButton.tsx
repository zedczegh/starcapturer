
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AuthDialog from '../auth/AuthDialog';
import { UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfileDropdownMenu from './ProfileDropdownMenu';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchUserProfile, ensureUserProfile } from '@/utils/profileUtils';

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
    try {
      await signOut();
      navigate('/photo-points');
    } catch (error) {
      console.error("Error during sign out:", error);
      // Don't show error toast, just navigate away
      navigate('/photo-points');
    }
  };

  return (
    <AnimatePresence>
      {!user ? (
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
      ) : (
        <ProfileDropdownMenu />
      )}
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
      />
    </AnimatePresence>
  );
};

export default ProfileButton;
