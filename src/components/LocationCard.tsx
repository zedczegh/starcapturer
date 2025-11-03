
import React from "react";
import { formatDistanceToNow } from "date-fns";
import { MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import SiqsScoreBadge from "@/components/photoPoints/cards/SiqsScoreBadge";
import { motion } from "framer-motion";
import UserAvatarDisplay from "@/components/photoPoints/cards/UserAvatarDisplay";
import BookingAvailableBanner from "@/components/community/BookingAvailableBanner";
import VerificationBadge from "@/components/astro-spots/verification/VerificationBadge";
import CountryFlag from "@/components/location/CountryFlag";

interface LocationCardProps {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  siqs: number | { score: number; isViable: boolean } | null;
  timestamp?: string;
  isCertified?: boolean;
  siqsLoading?: boolean;
  userId?: string;
  availableBookings?: number;
  verificationStatus?: string;
}

const LocationCard = React.memo(({
  id,
  name,
  latitude,
  longitude,
  siqs,
  timestamp,
  isCertified = false,
  siqsLoading = false,
  userId,
  availableBookings = 0,
  verificationStatus
}: LocationCardProps) => {
  const { language, t } = useLanguage();

  const formatTime = (timestamp: string) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "";
      
      return language === "zh"
        ? `${formatDistanceToNow(date, { addSuffix: true })}`
        : `${formatDistanceToNow(date, { addSuffix: true })}`;
    } catch (e) {
      return "";
    }
  };

  return (
    <div className="bg-cosmic-900/70 backdrop-blur-md shadow-md rounded-xl p-4 border border-cosmic-800/50 transition-all hover:border-cosmic-700/50 hover:shadow-lg overflow-hidden relative">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-medium text-white flex-1">{name}</h3>
        <div className="flex flex-col items-end gap-2">
          <motion.div 
            initial={siqsLoading ? { opacity: 0.7 } : { opacity: 1 }}
            animate={siqsLoading ? { opacity: [0.7, 1, 0.7], transition: { repeat: Infinity, duration: 1.5 } } : { opacity: 1 }}
          >
            <SiqsScoreBadge 
              score={siqs} 
              loading={siqsLoading} 
              isCertified={isCertified}
            />
          </motion.div>
          {verificationStatus && verificationStatus !== 'unverified' && (
            <VerificationBadge status={verificationStatus as 'unverified' | 'pending' | 'verified' | 'rejected'} />
          )}
        </div>
      </div>
      
      {/* Show booking banner under SIQS score */}
      {availableBookings > 0 && (
        <div className="mt-2 flex justify-end">
          <BookingAvailableBanner availableSlots={availableBookings} className="" />
        </div>
      )}
      
      <div className="mt-2 text-sm text-cosmic-300 flex items-center">
        <MapPin className="h-3.5 w-3.5 mr-1.5 text-cosmic-400" />
        <span>
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </span>
      </div>
      
      <div className="mt-2 flex justify-between items-end">
        <div className="flex items-center gap-2">
          <CountryFlag latitude={latitude} longitude={longitude} />
          <div className="text-xs text-cosmic-500">
            {timestamp && formatTime(timestamp)}
          </div>
        </div>
        
        {userId && (
          <UserAvatarDisplay userId={userId} className="ml-auto" />
        )}
      </div>
    </div>
  );
});

LocationCard.displayName = 'LocationCard';

export default LocationCard;
