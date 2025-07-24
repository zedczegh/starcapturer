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
      // Reset all filters first, then set the clicked one
      bookingAvailable: false,
      verificationPending: false,
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
      className="mb-8"
    >
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <Filter className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t("Filters", "筛选")}</h3>
              <p className="text-xs text-muted-foreground">
                {t("Refine your search", "优化搜索结果")}
              </p>
            </div>
          </div>
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs font-medium bg-primary/20 text-primary border-primary/30">
                {activeFiltersCount} {t("active", "活跃")}
              </Badge>
            </div>
          )}
        </div>
        
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs h-8 px-3 hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="h-3 w-3 mr-1.5" />
            {t("Clear All", "清除全部")}
          </Button>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-3 flex-wrap p-4 bg-card/50 rounded-lg border border-border/50 backdrop-blur-sm">
        {/* Booking Available Filter */}
        <Button
          variant={filters.bookingAvailable ? "default" : "outline"}
          size="sm"
          onClick={() => toggleFilter('bookingAvailable')}
          className={`h-9 px-4 text-sm font-medium transition-all duration-200 ${
            filters.bookingAvailable 
              ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-emerald-500 shadow-lg shadow-emerald-500/25" 
              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800"
          }`}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {t("Booking Available", "可预订")}
        </Button>

        {/* Verification Pending Filter - Only show to admins */}
        {isAdmin && (
          <Button
            variant={filters.verificationPending ? "default" : "outline"}
            size="sm"
            onClick={() => toggleFilter('verificationPending')}
            className={`h-9 px-4 text-sm font-medium transition-all duration-200 ${
              filters.verificationPending 
                ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-amber-500 shadow-lg shadow-amber-500/25" 
                : "border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800"
            }`}
          >
            <Clock className="h-4 w-4 mr-2" />
            {t("Verification Pending", "待审核")}
          </Button>
        )}
      </div>
      
      {/* Results Count */}
      {activeFiltersCount > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 text-xs text-muted-foreground flex items-center gap-1"
        >
          <span>
            {t("Showing filtered results", "显示筛选结果")}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CommunityFilters;