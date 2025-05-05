
import React from 'react';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { BookmarkPlus, User, LogOut, Settings, MapPin, MessageCircle, Link2, Info, LogIn, UserPlus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ProfileDropdownMenuProps {
  user: any;
  profile: { username: string | null } | null;
  onSignOut: () => void;
  email: string | null;
  onOpenAuthDialog: () => void;
}

const menuItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
    },
  }),
};

const ProfileDropdownMenu: React.FC<ProfileDropdownMenuProps> = ({
  user,
  profile,
  onSignOut,
  email,
  onOpenAuthDialog
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <DropdownMenuContent 
      align="end" 
      className="z-[200] min-w-[240px] rounded-xl cosmic-dropdown shadow-2xl py-2 px-0 overflow-hidden"
      asChild
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        {user && (
          <>
            <DropdownMenuLabel className="glass-dropdown-label px-4 pt-3 pb-2 flex flex-col border-none rounded-t-xl">
              <span className="font-bold text-lg text-primary/90">
                {profile && profile.username ? profile.username : t('Account', '账户')}
              </span>
              <span className="text-xs text-cosmic-400 truncate">{email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuGroup>
              {[
                { icon: MessageCircle, label: t('Messages', '消息'), path: '/messages' },
                { icon: User, label: t('Profile', '个人资料'), path: '/profile' },
                { icon: BookmarkPlus, label: t('My Collections', '我的收藏'), path: '/collections' },
                { icon: MapPin, label: t('My AstroSpots', '我的观星点'), path: '/manage-astro-spots' },
              ].map(({ icon: Icon, label, path }, i) => (
                <motion.div
                  key={path}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={menuItemVariants}
                >
                  <DropdownMenuItem
                    onClick={() => navigate(path)}
                    className="interactive-button px-4 py-2 flex gap-2 items-center hover:!bg-primary/10 hover:text-primary rounded-md transition-all duration-300"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{label}</span>
                  </DropdownMenuItem>
                </motion.div>
              ))}
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator className="my-1" />
          </>
        )}
        
        {!user && (
          <>
            <DropdownMenuLabel className="glass-dropdown-label px-4 pt-3 pb-2 flex flex-col border-none rounded-t-xl">
              <span className="font-bold text-lg text-primary/90">
                {t('Welcome', '欢迎')}
              </span>
              <span className="text-xs text-cosmic-400">{t('Sign in to access all features', '登录以使用所有功能')}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuGroup>
              {[
                { icon: LogIn, label: t('Sign In', '登录'), action: onOpenAuthDialog },
                { icon: UserPlus, label: t('Sign Up', '注册'), action: onOpenAuthDialog },
              ].map(({ icon: Icon, label, action }, i) => (
                <motion.div
                  key={label}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={menuItemVariants}
                >
                  <DropdownMenuItem
                    onClick={action}
                    className="interactive-button px-4 py-2 flex gap-2 items-center hover:!bg-primary/10 hover:text-primary rounded-md transition-all duration-300"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{label}</span>
                  </DropdownMenuItem>
                </motion.div>
              ))}
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator className="my-1" />
          </>
        )}
        
        <DropdownMenuLabel className="px-4 py-1 text-xs text-cosmic-400">
          {t('Resources & Settings', '资源与设置')}
        </DropdownMenuLabel>
        
        <DropdownMenuGroup>
          {[
            { icon: Link2, label: t('Useful Links', '实用链接'), path: '/useful-links' },
            { icon: Info, label: t('About', '关于'), path: '/about' },
            { icon: Settings, label: t('Settings', '设置'), path: '/settings' },
          ].map(({ icon: Icon, label, path }, i) => (
            <motion.div
              key={path}
              custom={i + 5}
              initial="hidden"
              animate="visible"
              variants={menuItemVariants}
            >
              <DropdownMenuItem
                onClick={() => navigate(path)}
                className="interactive-button px-4 py-2 flex gap-2 items-center hover:!bg-primary/10 hover:text-primary rounded-md transition-all duration-300"
              >
                <Icon className="h-4 w-4 text-primary" />
                <span>{label}</span>
              </DropdownMenuItem>
            </motion.div>
          ))}
        </DropdownMenuGroup>
        
        {user && (
          <>
            <DropdownMenuSeparator />
            
            <motion.div
              custom={9}
              initial="hidden"
              animate="visible"
              variants={menuItemVariants}
            >
              <DropdownMenuItem
                onClick={onSignOut}
                className="interactive-button mt-2 mx-2 px-4 py-2 flex gap-2 items-center !text-white !bg-red-500 hover:!bg-red-400 hover:!text-white font-semibold rounded-xl transition-all duration-300 shadow-lg"
              >
                <LogOut className="mr-2 h-5 w-5" />
                <span>{t('Sign Out', '登出')}</span>
              </DropdownMenuItem>
            </motion.div>
          </>
        )}
      </motion.div>
    </DropdownMenuContent>
  );
};

export default ProfileDropdownMenu;
