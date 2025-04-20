
import React from 'react';
import { Card } from '@/components/ui/card';

interface ProfileContainerProps {
  children: React.ReactNode;
}

const ProfileContainer = ({ children }: ProfileContainerProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900">
      <div className="container mx-auto px-4 py-8 pt-24 max-w-3xl">
        <Card className="glassmorphism p-8 rounded-xl shadow-glow">
          <div className="space-y-8">
            {children}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfileContainer;
