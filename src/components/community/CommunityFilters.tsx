import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Filter, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserRole } from "@/hooks/useUserRole";
import { motion } from "framer-motion";

export interface CommunityFiltersState {
  bookingAvailable: boolean;
  verificationPending: boolean;
}

interface CommunityFiltersProps {
  filters: CommunityFiltersState;
  onFiltersChange: (filters: CommunityFiltersState) => void;
  activeFiltersCount: number;
}

const CommunityFilters: React.FC<CommunityFiltersProps> = ({
  filters,
  onFiltersChange,
  activeFiltersCount
}) => {
  const { t } = useLanguage();
  const { isAdmin } = useUserRole();

  const toggleFilter = (filterKey: keyof CommunityFiltersState) => {
    onFiltersChange({
      ...filters,
      [filterKey]: !filters[filterKey]
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      bookingAvailable: false,
      verificationPending: false
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6 space-y-4"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>{t("Filters", "筛选")}</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs h-6 px-2"
          >
            <X className="h-3 w-3 mr-1" />
            {t("Clear", "清除")}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Booking Available Filter */}
        <Button
          variant={filters.bookingAvailable ? "default" : "outline"}
          size="sm"
          onClick={() => toggleFilter('bookingAvailable')}
          className="h-8 px-3 text-xs"
        >
          <CheckCircle className="h-3 w-3 mr-1.5" />
          {t("Booking Available", "可预订")}
        </Button>

        {/* Verification Pending Filter - Only show to admins */}
        {isAdmin && (
          <Button
            variant={filters.verificationPending ? "default" : "outline"}
            size="sm"
            onClick={() => toggleFilter('verificationPending')}
            className="h-8 px-3 text-xs"
          >
            <Clock className="h-3 w-3 mr-1.5" />
            {t("Verification Pending", "待审核")}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default CommunityFilters;