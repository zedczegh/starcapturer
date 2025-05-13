
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import { useLanguage } from '@/contexts/LanguageContext';
import { MoonStar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Extract returnTo from location state or default to photo-points
  const returnPath = location.state?.returnTo || '/photo-points';
  
  // If user is already logged in, redirect them
  useEffect(() => {
    if (user) {
      navigate(returnPath, { replace: true });
    }
  }, [user, navigate, returnPath]);
  
  // Handle dialog close by navigating back
  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      navigate('/photo-points', { replace: true });
    }
    onOpenChange(isOpen);
  };
  
  // Success handler that respects the return path
  const handleSuccess = () => {
    navigate(returnPath, { replace: true });
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="animate-in fade-in-0 slide-in-from-bottom-5 sm:zoom-in-90 sm:slide-in-from-bottom-0 fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-gradient-to-b from-cosmic-900/95 to-cosmic-950/95 p-8 shadow-2xl duration-200 sm:rounded-2xl">
        <DialogHeader className="text-center space-y-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mx-auto flex items-center justify-center space-x-3"
          >
            <MoonStar className="h-12 w-12 text-primary animate-pulse" />
            <span className="text-3xl font-bold tracking-tight">
              Astro<span className="text-primary">SIQS</span>
            </span>
          </motion.div>
          <div className="space-y-2">
            <DialogTitle className="text-2xl font-bold">
              {t("Join the Stargazing Community", "加入观星社区")}
            </DialogTitle>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t(
                "Sign up to save your favorite observation spots, share your experiences, and connect with fellow stargazers.",
                "注册以保存您喜爱的观星地点，分享您的经验，并与其他观星者交流。"
              )}
            </p>
          </div>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="login" className="text-base py-3">
              {t("Sign In", "登录")}
            </TabsTrigger>
            <TabsTrigger value="signup" className="text-base py-3">
              {t("Create Account", "创建帐户")}
            </TabsTrigger>
          </TabsList>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TabsContent value="login" className="mt-0">
              <LoginForm onSuccess={handleSuccess} />
            </TabsContent>
            <TabsContent value="signup" className="mt-0">
              <SignUpForm onSuccess={handleSuccess} />
            </TabsContent>
          </motion.div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
