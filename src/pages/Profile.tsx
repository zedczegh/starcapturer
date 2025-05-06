
import React from 'react';
import ProfilePage from '@/components/profile/ProfilePage';
import { Toaster } from '@/components/ui/sonner';

const Profile = () => {
  return (
    <>
      <ProfilePage />
      {/* Add Toaster for profile notifications */}
      <Toaster />
    </>
  );
};

export default Profile;
