import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Crown } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

interface AdminBadgeProps {
  userId?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AdminBadge({ userId, className = '', size = 'sm' }: AdminBadgeProps) {
  const { isAdmin, isOwner, loading } = useUserRole();
  
  // Only show for authenticated admin/owner users viewing their own profile
  if (loading || (!isAdmin && !isOwner)) return null;

  const sizeClasses = {
    sm: 'h-4 w-4 p-0.5',
    md: 'h-5 w-5 p-0.5',
    lg: 'h-6 w-6 p-1'
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  // Owner gets crown badge with gold styling
  if (isOwner) {
    return (
      <div 
        className={`
          ${sizeClasses[size]}
          rounded-full bg-gradient-to-br from-yellow-400 to-amber-500
          flex items-center justify-center
          shadow-lg shadow-yellow-500/30
          ring-2 ring-yellow-300/50
          ${className}
        `}
      >
        <Crown className={`${iconSizes[size]} text-yellow-900`} />
      </div>
    );
  }

  // Admin gets shield badge with purple styling
  return (
    <div 
      className={`
        ${sizeClasses[size]}
        rounded-full bg-gradient-to-br from-purple-400 to-purple-600
        flex items-center justify-center
        shadow-lg shadow-purple-500/30
        ring-2 ring-purple-300/50
        ${className}
      `}
    >
      <Shield className={`${iconSizes[size]} text-white`} />
    </div>
  );
}

interface AdminBadgeForUserProps {
  userId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AdminBadgeForUser({ userId, className = '', size = 'sm' }: AdminBadgeForUserProps) {
  const [userRole, setUserRole] = React.useState<'owner' | 'admin' | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkUserRole = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const { supabase } = await import('@/integrations/supabase/client');
        
        // Check for owner first, then admin
        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .in('role', ['owner', 'admin']);

        if (!error && roles && roles.length > 0) {
          // Prioritize owner over admin
          const hasOwner = roles.some(r => r.role === 'owner');
          const hasAdmin = roles.some(r => r.role === 'admin');
          
          if (hasOwner) {
            setUserRole('owner');
          } else if (hasAdmin) {
            setUserRole('admin');
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [userId]);

  if (loading || !userRole) return null;

  const sizeClasses = {
    sm: 'h-4 w-4 p-0.5',
    md: 'h-5 w-5 p-0.5',
    lg: 'h-6 w-6 p-1'
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  // Owner gets crown badge with gold styling
  if (userRole === 'owner') {
    return (
      <div 
        className={`
          ${sizeClasses[size]}
          rounded-full bg-gradient-to-br from-yellow-400 to-amber-500
          flex items-center justify-center
          shadow-lg shadow-yellow-500/30
          ring-2 ring-yellow-300/50
          ${className}
        `}
      >
        <Crown className={`${iconSizes[size]} text-yellow-900`} />
      </div>
    );
  }

  // Admin gets shield badge with purple styling
  return (
    <div 
      className={`
        ${sizeClasses[size]}
        rounded-full bg-gradient-to-br from-purple-400 to-purple-600
        flex items-center justify-center
        shadow-lg shadow-purple-500/30
        ring-2 ring-purple-300/50
        ${className}
      `}
    >
      <Shield className={`${iconSizes[size]} text-white`} />
    </div>
  );
}
