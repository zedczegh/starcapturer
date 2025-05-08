
import React from 'react';
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const EmptyMessages: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center text-cosmic-400 space-y-2">
        <MessageCircle className="mx-auto h-16 w-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">{t("No messages yet", "暂无消息")}</p>
        <p className="text-sm">
          {t("Send a message to start the conversation", "发送消息开始对话")}
        </p>
      </div>
    </div>
  );
};

export default EmptyMessages;
