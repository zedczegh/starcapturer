
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRelative } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import EmojiRenderer from '../EmojiRenderer';
import { MoreVertical, CheckCheck, Check, ThumbsUp, Heart, Bookmark } from 'lucide-react';
import UnsendDialog from './UnsendDialog';
import { Button } from '@/components/ui/button';
import LocationShareCard from '../LocationShareCard';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';

interface MessageItemProps {
  message: any;
  isSender: boolean;
  onUnsend: (id: string) => void;
  isProcessingAction?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isSender,
  onUnsend,
  isProcessingAction = false
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [showUnsendDialog, setShowUnsendDialog] = useState(false);
  const [postImageUrl, setPostImageUrl] = useState<string | null>(null);
  
  const locale = language === 'zh' ? zhCN : enUS;
  const messageDate = new Date(message.created_at);
  
  const formattedDate = formatRelative(messageDate, new Date(), {
    locale,
  });

  // Parse metadata if it exists
  const metadata = message.metadata as any;
  const isPostInteraction = metadata?.type === 'post_interaction';
  const isSharedPost = metadata?.type === 'shared_post';

  // Load post image for shared posts - handle both full URLs and storage paths
  React.useEffect(() => {
    if (isSharedPost && metadata?.post_image_url) {
      // If it's already a full URL, use it directly
      if (metadata.post_image_url.startsWith('http://') || metadata.post_image_url.startsWith('https://')) {
        setPostImageUrl(metadata.post_image_url);
      } else {
        // Otherwise, convert storage path to public URL
        const { data } = supabase.storage
          .from('user-posts')
          .getPublicUrl(metadata.post_image_url);
        setPostImageUrl(data.publicUrl);
      }
    }
  }, [isSharedPost, metadata]);

  const handlePostClick = () => {
    if (metadata?.post_id && metadata?.post_owner_id) {
      navigate(`/user/${metadata.post_owner_id}`, { state: { scrollToPost: metadata.post_id } });
    }
  };

  const getInteractionIcon = () => {
    if (!isPostInteraction) return null;
    switch (metadata.interaction_type) {
      case 'like':
        return <ThumbsUp className="h-4 w-4 text-blue-400" />;
      case 'heart':
        return <Heart className="h-4 w-4 text-red-400 fill-current" />;
      case 'collect':
        return <Bookmark className="h-4 w-4 text-yellow-400 fill-current" />;
      default:
        return null;
    }
  };

  const hasContent = message.message || message.image_url || message.location || isPostInteraction || isSharedPost;
  
  if (!hasContent) return null;
  
  return (
    <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className="max-w-[75%]">
        <div
          className={`relative group rounded-2xl p-3 ${
            isSender
              ? 'bg-primary/90 text-white rounded-tr-none'
              : 'bg-cosmic-800/40 text-cosmic-100 rounded-tl-none'
          }`}
        >
          {isSender && !isSharedPost && !isPostInteraction && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-3 -right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-cosmic-900/50 text-cosmic-300 hover:text-cosmic-100 hover:bg-cosmic-800/70"
              onClick={() => setShowUnsendDialog(true)}
              disabled={isProcessingAction}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Message options</span>
            </Button>
          )}
          
          {message.message && !isSharedPost && !isPostInteraction && (
            <div className="mb-2 whitespace-pre-wrap">
              <EmojiRenderer text={message.message} />
            </div>
          )}
          
          {message.image_url && (
            <div className="mt-2">
              <img
                src={message.image_url}
                alt="Message attachment"
                className="w-full h-auto rounded-lg"
                style={{ maxHeight: '200px', objectFit: 'cover' }}
                onLoad={() => {
                  // Dispatch a custom event when an image loads to trigger scroll adjustment
                  window.dispatchEvent(new Event('message-image-loaded'));
                }}
              />
            </div>
          )}
          
          {message.location && (
            <div className="mt-2">
              <LocationShareCard 
                name={message.location.name}
                latitude={message.location.latitude}
                longitude={message.location.longitude}
                timestamp={message.location.timestamp}
                siqs={message.location.siqs}
                spotId={message.location.spotId}
                isAstroSpot={message.location.isAstroSpot}
                fromLink={message.location.fromLink}
                userId={message.location.userId}
              />
            </div>
          )}

          {/* Post Interaction Notification */}
          {isPostInteraction && (
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity p-2 rounded-lg bg-cosmic-700/30"
              onClick={handlePostClick}
            >
              {getInteractionIcon()}
              <span className="text-sm font-medium">Tap to view post</span>
            </div>
          )}

          {/* Shared Post Preview - Facebook Messenger Style */}
          {isSharedPost && (
            <div 
              className="mt-2 cursor-pointer group"
              onClick={handlePostClick}
            >
              <Card className="overflow-hidden border border-cosmic-600/40 hover:border-primary/40 bg-cosmic-800/30 hover:bg-cosmic-800/50 transition-all duration-200 max-w-[320px]">
                {postImageUrl && (
                  <div className="relative w-full h-48 overflow-hidden">
                    <img
                      src={postImageUrl}
                      alt="Shared post"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-3 space-y-1.5">
                  {metadata.post_description && (
                    <p className="text-sm text-cosmic-100 font-medium line-clamp-2 leading-snug">
                      {metadata.post_description}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-primary/80 group-hover:text-primary transition-colors">
                    <span className="font-medium">View post</span>
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
        
        <div
          className={`flex items-center text-xs text-gray-500 mt-1 ${
            isSender ? 'justify-end' : 'justify-start'
          }`}
        >
          {/* Message read status indicators with improved styling */}
          {isSender && (
            <span className="mr-2 flex items-center">
              {message.read ? (
                <CheckCheck className="h-3 w-3 text-green-500 drop-shadow-sm" />
              ) : (
                <Check className="h-3 w-3 text-cosmic-400 opacity-75" />
              )}
            </span>
          )}
          {formattedDate}
        </div>
      </div>
      
      {showUnsendDialog && (
        <UnsendDialog
          open={showUnsendDialog}
          onOpenChange={(isOpen) => {
            if (!isProcessingAction && !isOpen) {
              setShowUnsendDialog(false);
            }
          }}
          onUnsend={() => {
            onUnsend(message.id);
            setShowUnsendDialog(false);
          }}
          onCancel={() => setShowUnsendDialog(false)}
          isProcessing={isProcessingAction}
        />
      )}
    </div>
  );
};

export default MessageItem;
