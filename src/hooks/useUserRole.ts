import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUserRole = () => {
  const { user, session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkRoleStatus = useCallback(async () => {
    if (!user) {
      console.log('[useUserRole] No user, setting roles to false');
      setIsAdmin(false);
      setIsOwner(false);
      setLoading(false);
      return;
    }

    try {
      console.log('[useUserRole] Checking role status for user:', user.email);
      
      // Check admin status
      const { data: adminData, error: adminError } = await supabase
        .rpc('has_role', { required_role: 'admin' });

      if (adminError) {
        console.error('[useUserRole] Error checking admin status:', adminError);
        setIsAdmin(false);
      } else {
        setIsAdmin(adminData || false);
      }

      // Check owner status
      const { data: ownerData, error: ownerError } = await supabase
        .rpc('has_role', { required_role: 'owner' });

      if (ownerError) {
        console.error('[useUserRole] Error checking owner status:', ownerError);
        setIsOwner(false);
      } else {
        setIsOwner(ownerData || false);
      }

      console.log('[useUserRole] Role check results for', user.email, ': admin=', adminData, ', owner=', ownerData);
    } catch (error) {
      console.error('[useUserRole] Exception checking role status:', error);
      setIsAdmin(false);
      setIsOwner(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkRoleStatus();
  }, [checkRoleStatus]);

  // isAdmin returns true if user is admin OR owner
  return { 
    isAdmin: isAdmin || isOwner, 
    isOwner, 
    loading, 
    refetchRole: checkRoleStatus 
  };
};
