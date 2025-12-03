import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUtilityPermission = (utilityKey: string) => {
  const { user } = useAuth();
  const [canUse, setCanUse] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      if (!user) {
        setCanUse(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('can_use_utility', { 
            p_user_id: user.id, 
            p_utility_key: utilityKey 
          });

        if (error) {
          console.error('Error checking utility permission:', error);
          setCanUse(true); // Default to true on error
        } else {
          setCanUse(data ?? true);
        }
      } catch (err) {
        console.error('Exception checking utility permission:', err);
        setCanUse(true);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [user, utilityKey]);

  return { canUse, loading };
};
