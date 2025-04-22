
import React from 'react';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { BookmarkPlus, User, LogOut, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface ProfileDropdownMenuProps {
  user: any;
  profile: { username: string | null } | null;
  onSignOut: () => void;
  email: string | null;
}

const ProfileDropdownMenu: React.FC<ProfileDropdownMenuProps> = ({
  user,
  profile,
  onSignOut,
  email
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <DropdownMenuContent align="end" className="z-[200] min-w-[240px] rounded-xl cosmic-dropdown shadow-2xl py-2 px-0">
      <DropdownMenuLabel className="glass-dropdown-label px-4 pt-3 pb-2 flex flex-col border-none rounded-t-xl">
        <span className="font-bold text-lg text-primary/90">{profile && profile.username ? profile.username : t('Account', '账户')}</span>
        <span className="text-xs text-cosmic-400 truncate">{email}</span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => navigate('/profile')}
        className="interactive-button px-4 py-2 flex gap-2 items-center hover:!bg-primary/10 hover:text-primary rounded-md"
      >
        <User className="h-4 w-4 text-primary" />
        <span>{t('Profile', '个人资料')}</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => navigate('/collections')}
        className="interactive-button px-4 py-2 flex gap-2 items-center hover:!bg-primary/10 hover:text-primary rounded-md"
      >
        <BookmarkPlus className="h-4 w-4 text-primary" />
        <span>{t('My Collections', '我的收藏')}</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => navigate('/settings')}
        className="interactive-button px-4 py-2 flex gap-2 items-center hover:!bg-primary/10 hover:text-primary rounded-md"
      >
        <Settings className="h-4 w-4 text-primary" />
        <span>{t('Settings', '设置')}</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={onSignOut}
        className="interactive-button px-4 py-2 flex gap-2 items-center !text-white !bg-red-500 hover:!bg-red-400 hover:!text-white font-semibold rounded-xl transition-all shadow"
      >
        <LogOut className="mr-2 h-5 w-5" />
        <span>{t('Sign Out', '登出')}</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
};

export default ProfileDropdownMenu;
