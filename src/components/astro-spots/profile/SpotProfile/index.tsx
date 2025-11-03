
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import NavBar from "@/components/NavBar";
import ProfileContent from './ProfileContent';
import BackButton from "@/components/navigation/BackButton";
import { clearSpotCache } from '@/utils/cache/spotCacheCleaner';
import { motion } from 'framer-motion';
import LocationDetailsLoading from '@/components/location/LocationDetailsLoading';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from "@/contexts/LanguageContext";
import BookmarkButton from '@/components/astroSpots/BookmarkButton';

const AstroSpotProfile = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [comingFromCommunity, setComingFromCommunity] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileKey, setProfileKey] = useState<string>(`${id}-${Date.now()}`);
  const previousIdRef = useRef<string | null>(null);
  const mountTimeRef = useRef<number>(Date.now());
  const isInitialMount = useRef(true);
  const navigationTimestampRef = useRef<number | null>(null);
  
  // Improved component initialization
  useEffect(() => {
    // Track where we came from for proper back button behavior
    if (location.state?.from === "community") {
      setComingFromCommunity(true);
    }
    
    // Generate a stable identifier for this profile view
    const timestamp = location.state?.timestamp || Date.now();
    const newProfileKey = `${id}-${timestamp}`;
    setProfileKey(newProfileKey);
    
    // Store the navigation timestamp for reference
    navigationTimestampRef.current = timestamp;
    
    console.log(`Profile opened for spot ID: ${id}, timestamp: ${timestamp}`);
    
    // Only clear cache on first mount or when ID changes
    if (isInitialMount.current || id !== previousIdRef.current) {
      if (id) {
        // Skip clearing cache if noRefresh is set
        if (!location.state?.noRefresh) {
          clearSpotCache(id);
        } else {
          console.log("Skipping cache clear due to noRefresh flag");
        }
      }
      
      setIsLoading(true);
      
      // Add a short timeout before showing content to prevent flashing
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 200);
      
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
    
    previousIdRef.current = id || null;
    isInitialMount.current = false;
    
    // Clear any stale caches when component unmounts
    return () => {
      console.log("Profile component unmounting for ID:", id);
    };
  }, [id, location.state]);

  // If no ID is provided, show an error
  if (!id) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
        <NavBar />
        <div className="container max-w-4xl py-8 px-4 md:px-6 relative">
          <div className="text-center py-12">
            <h1 className="text-2xl text-red-400 mb-4">Error: No AstroSpot ID provided</h1>
            <BackButton 
              destination="/community" 
              className="mx-auto"
            />
          </div>
        </div>
      </div>
    );
  }
  
  // Share button handler
  const handleShareProfile = () => {
    // Get the current URL
    const shareUrl = window.location.href;
    
    // Try to use the clipboard API
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          toast.success(
            language === 'en' 
              ? 'Profile link copied to clipboard!' 
              : '个人资料链接已复制到剪贴板！'
          );
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          toast.error(
            language === 'en' 
              ? 'Failed to copy link' 
              : '复制链接失败'
          );
        });
    } else {
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        
        // Make the textarea out of viewport
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          toast.success(
            language === 'en' 
              ? 'Profile link copied to clipboard!' 
              : '个人资料链接已复制到剪贴板！'
          );
        } else {
          throw new Error('Copy command failed');
        }
      } catch (err) {
        console.error('Fallback: Failed to copy: ', err);
        toast.error(
          language === 'en' 
            ? 'Failed to copy link' 
            : '复制链接失败'
        );
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
      <NavBar />
      <div className="container max-w-4xl py-8 px-4 md:px-6 relative">
        <div className="flex justify-between items-center mb-6">
          <BackButton
            destination={comingFromCommunity ? "/community" : "/manage-astro-spots"}
            className="text-gray-300 hover:bg-cosmic-800/50"
          />
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleShareProfile}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 bg-cosmic-800/30 border-cosmic-700/50 hover:bg-cosmic-800/50 text-gray-300"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t("Share", "分享")}
              </span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <LocationDetailsLoading />
          </motion.div>
        ) : (
          <motion.div 
            key={profileKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <ProfileContent 
              spotId={id} 
              user={!!user} 
              comingFromCommunity={comingFromCommunity}
              key={profileKey}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AstroSpotProfile;
