import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

interface AdminBadgeProps {
  userId?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AdminBadge({ userId, className = '', size = 'sm' }: AdminBadgeProps) {
  const { isAdmin, loading } = useUserRole();
  
  // Only show for authenticated admin users viewing their own profile
  // For other users' profiles, we'll need to check their role separately
  if (loading || !isAdmin) return null;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

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
  const [isUserAdmin, setIsUserAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkUserRole = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();

        if (!error && data) {
          setIsUserAdmin(true);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [userId]);

  if (loading || !isUserAdmin) return null;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

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