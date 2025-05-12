
import React from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const EmptyConversationState: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center text-cosmic-400 space-y-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <MessageCircle className="mx-auto h-20 w-20 mb-6 opacity-20" />
        </motion.div>
        <h3 className="text-xl font-medium text-white mb-2">
          {t("Select a conversation", "选择一个对话")}
        </h3>
        <p className="max-w-md mx-auto text-cosmic-300">
          {t(
            "Choose a conversation from the list or start a new one by going to a user's profile", 
            "从列表中选择一个对话，或通过访问用户资料开始新的对话"
          )}
        </p>
      </div>
    </div>
  );
};

export default EmptyConversationState;
