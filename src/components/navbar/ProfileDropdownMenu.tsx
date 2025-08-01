import React from 'react';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { BookmarkPlus, User, LogOut, Settings, MapPin, MessageCircle, Link2, Info, Calendar, Music, Calculator, Wallet, Satellite } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationBadge from './NotificationBadge';

interface ProfileDropdownMenuProps {
  user: any;
  profile: { username: string | null } | null;
  onSignOut: () => void;
  email: string | null;
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
  email
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { unreadMessagesCount, newReservationsCount, markMessagesAsViewed, markAstroSpotsAsViewed } = useNotifications();

  const handleMessagesClick = () => {
    markMessagesAsViewed();
    navigate('/messages');
  };

  const handleAstroSpotsClick = () => {
    markAstroSpotsAsViewed();
    navigate('/manage-astro-spots');
  };

  const menuItems = [
    { 
      icon: MessageCircle, 
      label: t('Messages', '消息'), 
      onClick: handleMessagesClick,
      badge: unreadMessagesCount
    },
    { icon: Wallet, label: t('My Wallet', '我的钱包'), path: '/my-wallet' },
    { icon: User, label: t('Profile', '个人资料'), path: '/profile' },
    { icon: BookmarkPlus, label: t('My Collections', '我的收藏'), path: '/collections' },
    { 
      icon: MapPin, 
      label: t('My AstroSpots', '我的观星点'), 
      onClick: handleAstroSpotsClick,
      badge: newReservationsCount
    },
    { icon: Calendar, label: t('My Reservations', '我的预订'), path: '/my-reservations' },
    { icon: Satellite, label: t('Space Station Tracker', '空间站追踪'), path: '/space-tracker' },
    { icon: Music, label: t('Sonification', '声化处理器'), path: '/sonification' },
    { icon: Calculator, label: t('Sampling Calculator', '采样计算器'), path: '/sampling-calculator' },
    { icon: Link2, label: t('Useful Links', '资源'), path: '/useful-links' },
    { icon: Info, label: t('About SIQS', '关于SIQS'), path: '/about' },
    { icon: Settings, label: t('Settings', '设置'), path: '/settings' },
  ];

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
        <DropdownMenuLabel className="glass-dropdown-label px-4 pt-3 pb-2 flex flex-col border-none rounded-t-xl">
          <span className="font-bold text-lg text-primary/90">
            {profile && profile.username ? profile.username : t('Account', '账户')}
          </span>
          <span className="text-xs text-cosmic-400 truncate">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {menuItems.map(({ icon: Icon, label, path, onClick, badge }, i) => (
          <motion.div
            key={path || label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={menuItemVariants}
          >
            <DropdownMenuItem
              onClick={() => {
                if (onClick) {
                  onClick();
                } else if (path) {
                  navigate(path);
                }
              }}
              className="interactive-button px-4 py-2 flex gap-2 items-center hover:!bg-primary/10 hover:text-primary rounded-md transition-all duration-300"
            >
              <Icon className="h-4 w-4 text-primary" />
              <span className="flex-1">{label}</span>
              {badge !== undefined && <NotificationBadge count={badge} />}
            </DropdownMenuItem>
          </motion.div>
        ))}
        
        <DropdownMenuSeparator />
        <motion.div
          custom={8}
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
      </motion.div>
    </DropdownMenuContent>
  );
};

export default ProfileDropdownMenu;
