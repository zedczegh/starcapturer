import React from 'react';
import { Star, MapPin, Calendar, ExternalLink, MessageCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";

interface SpotHeaderProps {
  spot: {
    name: string;
    latitude: number;
    longitude: number;
    created_at: string;
    siqs?: number;
    user_id: string;
  };
  creatorProfile?: {
    username: string | null;
    avatar_url: string | null;
  };
  loadingCreator: boolean;
  spotId: string;
  onViewDetails: () => void;
  comingFromCommunity: boolean;
}

const SpotHeader: React.FC<SpotHeaderProps> = ({
  spot,
  creatorProfile,
  loadingCreator,
  spotId,
  onViewDetails,
  comingFromCommunity
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleMessageCreator = () => {
    if (!user || !spot.user_id) return;
    
    console.log("Navigating to messages with selected user:", spot.user_id);
    
    navigate('/messages', { 
      state: { 
        selectedUser: spot.user_id,
        conversationId: spot.user_id 
      } 
    });
  };

  const renderCreatorAvatar = () => {
    if (loadingCreator) {
      return (
        <div className="h-10 w-10 rounded-full bg-cosmic-700 animate-pulse mr-3" />
      );
    }
    if (creatorProfile?.avatar_url) {
      return (
        <img
          src={creatorProfile.avatar_url}
          alt="Creator Avatar"
          className="h-10 w-10 rounded-full object-cover mr-3 border-2 border-primary shadow"
        />
      );
    }
    return (
      <span className="h-10 w-10 flex items-center justify-center bg-cosmic-700 rounded-full mr-3 border-2 border-cosmic-700">
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 19a4 4 0 0 0-8 0m8 0v2a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-2m8 0H8a8 8 0 0 1 8-8h0a8 8 0 0 1 8 8z"/>
        </svg>
      </span>
    );
  };

  return (
    <>
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center gap-2">
          {renderCreatorAvatar()}
          {loadingCreator ? (
            <div className="h-4 w-32 rounded bg-cosmic-700 animate-pulse" />
          ) : creatorProfile && creatorProfile.username ? (
            <Link
              to={`/profile/${spotId}`}
              className="text-base font-semibold underline hover:text-primary text-gray-200 truncate max-w-[10rem]"
              title={creatorProfile.username}
            >
              @{creatorProfile.username}
            </Link>
          ) : (
            <span className="text-base font-semibold text-gray-400">
              {t("Unknown", "未知用户")}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1">{t("Created by this user", "由该用户创建")}</div>
      </div>

      <div className="bg-gradient-to-r from-cosmic-800/80 to-cosmic-800/40 p-6 border-b border-cosmic-700/30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-50 flex items-center">
              <Star className="h-5 w-5 text-yellow-400 mr-2 animate-pulse" />
              {spot.name}
            </h1>
            <div className="flex items-center text-gray-400 text-sm">
              <MapPin className="h-4 w-4 mr-1" />
              {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
            </div>
            <div className="flex items-center text-gray-400 text-sm mt-1">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date(spot.created_at).toLocaleDateString()}
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-4 sm:mt-0">
            {comingFromCommunity && user && spot.user_id !== user.id && (
              <Button
                variant="outline"
                onClick={handleMessageCreator}
                className="flex items-center gap-2 bg-cosmic-700/40 hover:bg-cosmic-700/60 text-primary-foreground border-cosmic-600/40 backdrop-blur-sm transition-all duration-300"
              >
                <MessageCircle className="h-4 w-4 text-primary" />
                {t("Message Creator", "联系创建者")}
              </Button>
            )}
            <Button
              variant="default"
              onClick={onViewDetails}
              className="bg-primary/80 hover:bg-primary flex items-center gap-2 rounded-full"
            >
              <ExternalLink className="h-4 w-4" />
              {t("View Location Details", "查看位置详情")}
            </Button>
          </div>
        </div>
        {spot.siqs && (
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-cosmic-700/60 text-primary-foreground">
            <span className="font-bold mr-1">{t("SIQS", "SIQS")}:</span>
            <span
              className={`px-2 py-0.5 rounded-full font-mono text-sm ${
                spot.siqs >= 8 ? 'bg-green-500/80 text-white'
                : spot.siqs >= 6 ? 'bg-blue-500/80 text-white'
                : spot.siqs >= 4 ? 'bg-yellow-500/80 text-white'
                : 'bg-red-500/80 text-white'
              }`}
            >
              {spot.siqs}
            </span>
          </div>
        )}
      </div>
    </>
  );
};

export default SpotHeader;
