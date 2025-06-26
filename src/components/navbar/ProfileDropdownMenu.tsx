
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Settings, 
  LogOut, 
  Calendar, 
  MessageCircle, 
  Star,
  Wallet // Add wallet icon
} from 'lucide-react';

const ProfileDropdownMenu = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 hover:bg-cosmic-700/50 rounded-lg p-2 transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-cosmic-700 text-cosmic-200">
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-cosmic-200 hidden sm:block">
            {user.user_metadata?.username || user.email?.split('@')[0]}
          </span>
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-56 bg-cosmic-800 border-cosmic-700" 
        align="end"
      >
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>{t('Profile', '个人资料')}</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/wallet" className="flex items-center cursor-pointer">
            <Wallet className="mr-2 h-4 w-4" />
            <span>{t('Wallet', '钱包')}</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/my-reservations" className="flex items-center cursor-pointer">
            <Calendar className="mr-2 h-4 w-4" />
            <span>{t('My Reservations', '我的预订')}</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/manage-astro-spots" className="flex items-center cursor-pointer">
            <Star className="mr-2 h-4 w-4" />
            <span>{t('Manage Spots', '管理观星点')}</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/messages" className="flex items-center cursor-pointer">
            <MessageCircle className="mr-2 h-4 w-4" />
            <span>{t('Messages', '消息')}</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-cosmic-700" />
        
        <DropdownMenuItem asChild>
          <Link to="/preferences" className="flex items-center cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>{t('Preferences', '偏好设置')}</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-cosmic-700" />
        
        <DropdownMenuItem onClick={handleSignOut} className="flex items-center cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('Sign Out', '退出登录')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdownMenu;
