import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useAstroSpotCollection } from '@/hooks/useAstroSpotCollection';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface BookmarkButtonProps {
  astroSpot: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    bortlescale?: number;
    siqs?: number;
    verification_status?: string;
  };
  className?: string;
  size?: 'default' | 'sm' | 'lg';
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({ 
  astroSpot, 
  className = '',
  size = 'default'
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { saveAstroSpot, removeAstroSpot, checkIfSaved, isSaving } = useAstroSpotCollection();
  const [isSaved, setIsSaved] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!user || !astroSpot?.id) {
        setIsChecking(false);
        return;
      }
      
      setIsChecking(true);
      const saved = await checkIfSaved(astroSpot.id);
      setIsSaved(saved);
      setIsChecking(false);
    };

    checkSavedStatus();
  }, [user, astroSpot?.id, checkIfSaved]);

  const handleBookmarkToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      return;
    }

    if (isSaved) {
      const success = await removeAstroSpot(astroSpot.id);
      if (success) {
        setIsSaved(false);
      }
    } else {
      const result = await saveAstroSpot(astroSpot);
      if (result) {
        setIsSaved(true);
      }
    }
  };

  if (!user) {
    return null; // Don't show bookmark button for non-authenticated users
  }

  const isLoading = isSaving || isChecking;
  
  return (
    <Button
      onClick={handleBookmarkToggle}
      variant="outline"
      size={size}
      disabled={isLoading}
      className={`
        flex items-center gap-2 transition-all duration-200
        ${isSaved 
          ? 'bg-primary/10 border-primary text-primary hover:bg-primary/20' 
          : 'bg-cosmic-800/30 border-cosmic-700/50 text-cosmic-200 hover:bg-cosmic-800/50'
        }
        ${className}
      `}
      title={isSaved 
        ? t('Remove from collection', '从收藏中删除')
        : t('Add to collection', '添加到收藏')
      }
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      ) : isSaved ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">
        {isLoading 
          ? t('Loading...', '加载中...')
          : isSaved 
            ? t('Saved', '已收藏')
            : t('Save', '收藏')
        }
      </span>
    </Button>
  );
};

export default BookmarkButton;