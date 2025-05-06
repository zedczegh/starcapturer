
import React from 'react';
import { Card } from '@/components/ui/card';
import ProfileHeader from './ProfileHeader';
import ProfileForm from './ProfileForm';
import PasswordChangeForm from './PasswordChangeForm';

interface ProfileMainProps {
  displayUsername: string;
  avatarUrl: string | null;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar: () => void;
  uploadingAvatar: boolean;
  astronomyTip: [string, string] | null;
}

const ProfileMain: React.FC<ProfileMainProps> = ({
  displayUsername,
  avatarUrl,
  onAvatarChange,
  onRemoveAvatar,
  uploadingAvatar,
  astronomyTip
}: ProfileMainProps) => (
  <div className="container mx-auto px-4 py-8 pt-24 max-w-3xl">
    <Card className="glassmorphism p-8 rounded-xl shadow-glow">
      <div className="flex flex-col gap-8">
        <ProfileHeader
          username={displayUsername}
          avatarUrl={avatarUrl}
          onAvatarChange={onAvatarChange}
          onRemoveAvatar={onRemoveAvatar}
          uploadingAvatar={uploadingAvatar}
          astronomyTip={astronomyTip}
        />
        <ProfileForm />
        <div className="mt-8">
          <h2 className="font-bold text-xl text-white mb-2">
            Change Password
          </h2>
          <PasswordChangeForm />
        </div>
      </div>
    </Card>
  </div>
);

export default ProfileMain;
