
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import { useLanguage } from '@/contexts/LanguageContext';
import { MoonStar } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="animate-in fade-in-0 slide-in-from-bottom-5 sm:zoom-in-90 sm:slide-in-from-bottom-0 fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-6 border border-cosmic-700/40 bg-gradient-to-br from-cosmic-900/98 via-cosmic-900/95 to-cosmic-950/98 p-8 shadow-2xl backdrop-blur-xl duration-300 sm:rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-3xl pointer-events-none" />
        <DialogHeader className="text-center space-y-6 relative z-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mx-auto flex items-center justify-center space-x-3"
          >
            <div className="relative">
              <MoonStar className="h-14 w-14 text-primary drop-shadow-lg" />
              <div className="absolute inset-0 h-14 w-14 text-primary animate-pulse opacity-40" />
            </div>
            <span className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground via-primary/90 to-foreground bg-clip-text text-transparent">
              Astro<span className="text-primary">SIQS</span>
            </span>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-3"
          >
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-cosmic-200 bg-clip-text text-transparent">
              {t("Join the Stargazing Community", "加入观星社区")}
            </DialogTitle>
            <p className="text-sm text-cosmic-300 max-w-md mx-auto leading-relaxed">
              {t(
                "Sign up to save your favorite observation spots, share your experiences, and connect with fellow stargazers.",
                "注册以保存您喜爱的观星地点，分享您的经验，并与其他观星者交流。"
              )}
            </p>
          </motion.div>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full relative z-10">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-cosmic-800/40 border border-cosmic-700/30 p-1 h-12">
            <TabsTrigger 
              value="login" 
              className="text-base py-3 data-[state=active]:bg-cosmic-700/60 data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all duration-300 rounded-md"
            >
              {t("Sign In", "登录")}
            </TabsTrigger>
            <TabsTrigger 
              value="signup" 
              className="text-base py-3 data-[state=active]:bg-cosmic-700/60 data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all duration-300 rounded-md"
            >
              {t("Create Account", "创建帐户")}
            </TabsTrigger>
          </TabsList>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative"
          >
            <TabsContent value="login" className="mt-0 focus:outline-none">
              <LoginForm onSuccess={() => onOpenChange(false)} />
            </TabsContent>
            <TabsContent value="signup" className="mt-0 focus:outline-none">
              <SignUpForm onSuccess={() => onOpenChange(false)} />
            </TabsContent>
          </motion.div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
