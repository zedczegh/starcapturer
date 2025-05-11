
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const LoginPrompt: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
      <Card className="p-8 max-w-md w-full glassmorphism text-center">
        <MessageCircle className="mx-auto h-16 w-16 mb-4 text-primary/40" />
        <h2 className="text-xl font-semibold text-white mb-4">
          {t("Sign in to view messages", "请登录以查看消息")}
        </h2>
        <p className="text-cosmic-300 mb-6">
          {t(
            "You need to be signed in to access your messages and conversations.", 
            "您需要登录才能访问您的消息和对话。"
          )}
        </p>
        <Button 
          onClick={() => navigate('/photo-points')} 
          className="w-full"
        >
          {t("Back to Photo Points", "返回照片点位")}
        </Button>
      </Card>
    </div>
  );
};

export default LoginPrompt;
