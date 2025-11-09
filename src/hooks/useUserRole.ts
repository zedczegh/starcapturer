import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUserRole = () => {
  const { user, session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = useCallback(async () => {
    if (!user) {
      console.log('[useUserRole] No user, setting isAdmin to false');
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      console.log('[useUserRole] Checking admin status for user:', user.email);
      
      const { data, error } = await supabase
        .rpc('has_role', { required_role: 'admin' });

      if (error) {
        console.error('[useUserRole] Error checking admin status:', error);
        setIsAdmin(false);
      } else {
        console.log('[useUserRole] Admin check result for', user.email, ':', data);
        setIsAdmin(data || false);
      }
    } catch (error) {
      console.error('[useUserRole] Exception checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  return { isAdmin, loading, refetchRole: checkAdminStatus };
};
