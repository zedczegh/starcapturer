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
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  // Owner gets crown badge with gold styling
  if (isOwner) {
    return (
      <Badge 
        variant="secondary" 
        className={`
          bg-yellow-500/20 text-yellow-400 border-yellow-500/30
          flex items-center justify-center font-medium
          ${sizeClasses[size]} 
          ${className}
        `}
      >
        <Crown className="h-3 w-3" />
      </Badge>
    );
  }

  // Admin gets shield badge
  return (
    <Badge 
      variant="secondary" 
      className={`
        bg-amber-100 text-amber-800 border-amber-300 
        dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700
        flex items-center justify-center font-medium
        ${sizeClasses[size]} 
        ${className}
      `}
    >
      <Shield className="h-3 w-3" />
    </Badge>
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
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  // Owner gets crown badge with gold styling
  if (userRole === 'owner') {
    return (
      <Badge 
        variant="secondary" 
        className={`
          bg-yellow-500/20 text-yellow-400 border-yellow-500/30
          flex items-center justify-center font-medium
          ${sizeClasses[size]} 
          ${className}
        `}
      >
        <Crown className="h-3 w-3" />
      </Badge>
    );
  }

  // Admin gets shield badge
  return (
    <Badge 
      variant="secondary" 
      className={`
        bg-amber-100 text-amber-800 border-amber-300 
        dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700
        flex items-center justify-center font-medium
        ${sizeClasses[size]} 
        ${className}
      `}
    >
      <Shield className="h-3 w-3" />
    </Badge>
  );
}
