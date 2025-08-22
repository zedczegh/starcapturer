import React from 'react';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { BookmarkPlus, User, LogOut, Settings, MapPin, MessageCircle, Info, Calendar, Music, Calculator, Satellite, Eye, Wrench, ChevronRight } from 'lucide-react';
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
    { icon: User, label: t('Profile', '个人资料'), path: '/profile' },
    { icon: BookmarkPlus, label: t('My Collections', '我的收藏'), path: '/collections' },
    { 
      icon: MapPin, 
      label: t('My AstroSpots', '我的观星点'), 
      onClick: handleAstroSpotsClick,
      badge: newReservationsCount
    },
    { icon: Calendar, label: t('My Reservations', '我的预订'), path: '/my-reservations' },
    { icon: Info, label: t('About SIQS', '关于SIQS'), path: '/about' },
    { icon: Settings, label: t('Settings', '设置'), path: '/settings' },
  ];

  const utilityItems = [
    { icon: Satellite, label: t('Space Station Tracker', '空间站追踪'), path: '/space-tracker' },
    { icon: Music, label: t('Sonification', '声化处理器'), path: '/sonification' },
    { icon: Calculator, label: t('Sampling Calculator', '采样计算器'), path: '/sampling-calculator' },
    { icon: Eye, label: t('Stereoscope Processor', '立体镜处理器'), path: '/stereoscope' },
  ];

  return (
    <DropdownMenuContent 
      align="end" 
      className="z-[200] min-w-[280px] rounded-2xl bg-gradient-to-br from-cosmic-950/95 to-cosmic-900/95 backdrop-blur-xl border border-cosmic-700/30 shadow-2xl py-3 px-0 overflow-hidden"
      asChild
    >
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* Enhanced Header */}
        <DropdownMenuLabel className="px-6 pt-4 pb-3 flex flex-col border-none">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-[#8A6FD6]/20 flex items-center justify-center border border-primary/30">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <span className="font-semibold text-lg text-white block leading-tight">
                {profile && profile.username ? profile.username : t('Account', '账户')}
              </span>
              <span className="text-xs text-cosmic-400 truncate block">{email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <div className="h-px bg-gradient-to-r from-transparent via-cosmic-700/50 to-transparent mx-4 my-2" />
        
        {/* Main Menu Items */}
        <div className="px-2">
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
                className="mx-2 px-4 py-3 flex gap-3 items-center hover:bg-gradient-to-r hover:from-primary/10 hover:to-[#8A6FD6]/10 hover:border-primary/20 rounded-xl transition-all duration-300 cursor-pointer group border border-transparent"
              >
                <div className="w-8 h-8 rounded-lg bg-cosmic-800/50 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-4 w-4 text-cosmic-300 group-hover:text-primary transition-colors" />
                </div>
                <span className="flex-1 text-cosmic-100 group-hover:text-white font-medium">{label}</span>
                {badge !== undefined && <NotificationBadge count={badge} />}
              </DropdownMenuItem>
            </motion.div>
          ))}
          
          {/* Utilities Submenu */}
          <motion.div
            custom={menuItems.length}
            initial="hidden"
            animate="visible"
            variants={menuItemVariants}
          >
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="mx-2 px-4 py-3 flex gap-3 items-center hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-orange-500/10 hover:border-amber-500/20 rounded-xl transition-all duration-300 cursor-pointer group border border-transparent data-[state=open]:bg-gradient-to-r data-[state=open]:from-amber-500/10 data-[state=open]:to-orange-500/10">
                <div className="w-8 h-8 rounded-lg bg-cosmic-800/50 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <Wrench className="h-4 w-4 text-cosmic-300 group-hover:text-amber-400 transition-colors" />
                </div>
                <span className="flex-1 text-cosmic-100 group-hover:text-white font-medium">{t('Utilities', '实用工具')}</span>
                <ChevronRight className="h-4 w-4 text-cosmic-400 group-hover:text-white transition-colors" />
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="z-[250] min-w-[240px] rounded-xl bg-gradient-to-br from-cosmic-950/95 to-cosmic-900/95 backdrop-blur-xl border border-cosmic-700/30 shadow-xl">
                {utilityItems.map(({ icon: Icon, label, path }, j) => (
                  <DropdownMenuItem
                    key={path}
                    onClick={() => navigate(path)}
                    className="mx-2 px-4 py-3 flex gap-3 items-center hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-orange-500/10 rounded-lg transition-all duration-300 cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-cosmic-800/50 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                      <Icon className="h-3.5 w-3.5 text-cosmic-300 group-hover:text-amber-400 transition-colors" />
                    </div>
                    <span className="text-cosmic-100 group-hover:text-white font-medium text-sm">{label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </motion.div>
        </div>
        
        <div className="h-px bg-gradient-to-r from-transparent via-cosmic-700/50 to-transparent mx-4 my-3" />
        
        {/* Sign Out Button */}
        <motion.div
          custom={menuItems.length + 2}
          initial="hidden"
          animate="visible"
          variants={menuItemVariants}
          className="px-2"
        >
          <DropdownMenuItem
            onClick={onSignOut}
            className="mx-2 mb-2 px-4 py-3 flex gap-3 items-center bg-gradient-to-r from-red-500/90 to-red-600/90 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-red-500/25 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <LogOut className="h-4 w-4" />
            </div>
            <span>{t('Sign Out', '登出')}</span>
          </DropdownMenuItem>
        </motion.div>
      </motion.div>
    </DropdownMenuContent>
  );
};

export default ProfileDropdownMenu;
