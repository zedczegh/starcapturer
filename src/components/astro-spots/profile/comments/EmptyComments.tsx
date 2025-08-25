
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
      className="text-center py-12"
    >
      <div className="bg-muted/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <MessageCircle className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <p className="text-muted-foreground text-sm">
        {t("No comments yet", "暂无评论")}
      </p>
      <p className="text-muted-foreground/60 text-xs mt-1">
        {t("Be the first to share your thoughts!", "成为第一个分享想法的人！")}
      </p>
    </motion.div>
  );
};

export default EmptyComments;
