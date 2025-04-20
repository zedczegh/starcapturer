
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AuthDialog from '../auth/AuthDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BookmarkPlus, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileButton = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/photo-points');
  };

  if (!user) {
    return (
      <>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowAuthDialog(true)}
          className="text-primary hover:text-primary-focus rounded-full flex items-center justify-center"
          aria-label="Login"
        >
          <UserRound className="h-5 w-5" />
        </Button>
        <AuthDialog 
          open={showAuthDialog} 
          onOpenChange={setShowAuthDialog} 
        />
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative rounded-full p-0">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {user.email?.[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate('/collections')}>
          <BookmarkPlus className="mr-2 h-4 w-4" />
          {t("My Collections", "我的收藏")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut}>
          {t("Sign Out", "登出")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileButton;
