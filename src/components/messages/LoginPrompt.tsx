
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, LogIn } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const LoginPrompt: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // Handle authentication flow - make sure we return to messages after login
  const handleSignIn = () => {
    // Store the return path so we can redirect back after auth
    navigate('/auth', { state: { returnTo: '/messages' } });
  };
  
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 glassmorphism text-center border-cosmic-700/50 shadow-xl bg-gradient-to-b from-cosmic-900/80 to-cosmic-950/90">
          <div className="mb-6 p-4 bg-primary/10 rounded-full inline-flex mx-auto">
            <MessageCircle className="mx-auto h-12 w-12 text-primary" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">
            {t("Sign in to view messages", "请登录以查看消息")}
          </h2>
          
          <p className="text-cosmic-300 mb-8">
            {t(
              "You need to be signed in to access your messages and conversations.", 
              "您需要登录才能访问您的消息和对话。"
            )}
          </p>
          
          <div className="grid gap-4">
            <Button 
              onClick={handleSignIn}
              className="w-full py-6 bg-primary hover:bg-primary/90 text-lg shadow-lg shadow-primary/20"
            >
              <LogIn className="mr-2 h-5 w-5" />
              {t("Sign In", "登录")}
            </Button>
            
            <Button 
              onClick={() => navigate('/photo-points')} 
              variant="outline"
              className="w-full py-6 text-lg border-cosmic-700/50 bg-cosmic-800/30 hover:bg-cosmic-700/40"
            >
              {t("Back to Photo Points", "返回照片点位")}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default React.memo(LoginPrompt);
