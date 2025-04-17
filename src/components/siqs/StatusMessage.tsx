
import React from "react";
import { Loader } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface StatusMessageProps {
  message: string | null;
  loading?: boolean;
  calculationAttempted?: boolean;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ 
  message, 
  loading = false,
  calculationAttempted = false
}) => {
  const { t } = useLanguage();
  
  if (!message && !loading) {
    if (calculationAttempted) {
      return (
        <motion.div 
          className="mb-4 text-center py-2 text-primary-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {t("Ready for new calculation", "准备进行新的计算")}
        </motion.div>
      );
    }
    return null;
  }
  
  return (
    <motion.div 
      className="mb-4 text-center py-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-2 text-primary">
          <Loader className="animate-spin h-4 w-4" />
          <span>
            {message || t("Calculating...", "计算中...")}
          </span>
        </div>
      ) : (
        <span className="text-primary">{message}</span>
      )}
    </motion.div>
  );
};

export default StatusMessage;
