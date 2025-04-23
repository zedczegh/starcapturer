
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from "@/contexts/LanguageContext";

const EmptyComments = () => {
  const { t } = useLanguage();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center py-8"
    >
      <MessageCircle className="h-10 w-10 text-gray-500 mx-auto mb-2" />
      <p className="text-gray-400">{t("No comments yet", "暂无评论")}</p>
    </motion.div>
  );
};

export default EmptyComments;
