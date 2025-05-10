import React from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const EmptyConversationState: React.FC = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Mobile-optimized layout with action button
  if (isMobile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center text-cosmic-400 space-y-3 max-w-[85%]">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center"
          >
            <MessageCircle className="h-16 w-16 mb-2 opacity-30 text-primary" />
          </motion.div>
          <h3 className="text-lg font-medium text-white">
            {t("No active conversation", "暂无活跃对话")}
          </h3>
          <p className="text-sm text-cosmic-300">
            {t(
              "Select a conversation from the list or start a new one", 
              "从列表中选择一个对话或开始新对话"
            )}
          </p>
          <div className="pt-2">
            <Button 
              variant="outline" 
              className="border-primary/40 text-primary hover:bg-primary/20 hover:text-white"
              onClick={() => navigate('/community')}
            >
              {t("Browse Community", "浏览社区")}
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Desktop layout (unchanged)
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
