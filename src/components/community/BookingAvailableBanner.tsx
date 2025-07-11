import React from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface BookingAvailableBannerProps {
  availableSlots: number;
  className?: string;
}

const BookingAvailableBanner: React.FC<BookingAvailableBannerProps> = ({ 
  availableSlots, 
  className = "" 
}) => {
  const { t } = useLanguage();

  if (availableSlots === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`absolute top-2 left-2 z-10 ${className}`}
    >
      <Badge 
        variant="secondary" 
        className="bg-green-500/90 text-white border-green-400/50 shadow-lg backdrop-blur-sm hover:bg-green-500 transition-colors flex items-center gap-1.5 px-2.5 py-1"
      >
        <CheckCircle className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">
          {t("Booking Available", "可预订")}
        </span>
      </Badge>
    </motion.div>
  );
};

export default BookingAvailableBanner;