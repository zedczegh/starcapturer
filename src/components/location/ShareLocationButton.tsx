
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface ShareLocationButtonProps {
  locationId: string;
  className?: string;
}

const ShareLocationButton: React.FC<ShareLocationButtonProps> = ({
  locationId,
  className = ''
}) => {
  const [isCopying, setIsCopying] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const handleShare = async () => {
    try {
      setIsCopying(true);
      
      // Create the full URL for the location
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/location/${locationId}`;
      
      // Try using the modern Navigator.clipboard API
      await navigator.clipboard.writeText(shareUrl);
      
      toast({
        title: t("Link copied!", "链接已复制！"),
        description: t("You can now paste it in a message", "您现在可以将其粘贴到消息中"),
        duration: 3000
      });
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast({
        title: t("Failed to copy link", "复制链接失败"),
        description: t("Please try again", "请重试"),
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsCopying(false);
    }
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className={`flex items-center gap-1.5 ${className}`} 
      onClick={handleShare}
      disabled={isCopying}
    >
      <Share2 className="h-4 w-4" />
      {t("Share", "分享")}
    </Button>
  );
};

export default ShareLocationButton;
