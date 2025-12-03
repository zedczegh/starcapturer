import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ManageableUser {
  user_id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  is_active: boolean;
  role: string;
  created_at: string;
}

export interface UtilityPermission {
  utility_key: string;
  is_enabled: boolean;
}

export const UTILITY_KEYS = [
  { key: 'stereoscope', label: 'Stereoscope Processor', labelZh: '立体镜处理器' },
  { key: 'star-field-generator', label: '3D Star Field Generator', labelZh: '3D星场生成器' },
  { key: 'parallel-video-generator', label: '3D Parallel Video Generator', labelZh: '3D平行视频生成器' },
  { key: 'motion-animation', label: 'Motion Animation', labelZh: '动态动画' },
  { key: 'space-tracker', label: 'Space Station Tracker', labelZh: '空间站追踪' },
  { key: 'sonification', label: 'Sonification', labelZh: '声化处理器' },
  { key: 'sampling-calculator', label: 'Sampling Calculator', labelZh: '采样计算器' },
  { key: 'astro-math', label: 'Astro Math', labelZh: '天文数学' },
];

export const useAccountManagement = () => {
  const [users, setUsers] = useState<ManageableUser[]>([]);
  const [userPermissions, setUserPermissions] = useState<Record<string, UtilityPermission[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .rpc('get_manageable_users');

      if (fetchError) throw fetchError;

      setUsers(data || []);

      // Fetch permissions for each user
      const permissionsMap: Record<string, UtilityPermission[]> = {};
      for (const user of data || []) {
        const { data: perms } = await supabase
          .rpc('get_user_utility_permissions', { p_user_id: user.user_id });
        permissionsMap[user.user_id] = perms || [];
      }
      setUserPermissions(permissionsMap);

    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleUserStatus = async (userId: string, activate: boolean) => {
    try {
      const { data: existing } = await supabase
        .from('user_account_status')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('user_account_status')
          .update({
            is_active: activate,
            ...(activate 
              ? { reactivated_at: new Date().toISOString() }
              : { deactivated_at: new Date().toISOString() }
            ),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_account_status')
          .insert({
            user_id: userId,
            is_active: activate,
            ...(activate 
              ? { reactivated_at: new Date().toISOString() }
              : { deactivated_at: new Date().toISOString() }
            )
          });

        if (error) throw error;
      }

      setUsers(prev => prev.map(u => 
        u.user_id === userId ? { ...u, is_active: activate } : u
      ));

      return true;
    } catch (err: any) {
      console.error('Error toggling user status:', err);
      throw err;
    }
  };

  const toggleUtilityPermission = async (userId: string, utilityKey: string, enabled: boolean) => {
    try {
      const { data: existing } = await supabase
        .from('user_utility_permissions')
        .select('id')
        .eq('user_id', userId)
        .eq('utility_key', utilityKey)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('user_utility_permissions')
          .update({
            is_enabled: enabled,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('utility_key', utilityKey);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_utility_permissions')
          .insert({
            user_id: userId,
            utility_key: utilityKey,
            is_enabled: enabled
          });

        if (error) throw error;
      }

      setUserPermissions(prev => {
        const userPerms = prev[userId] || [];
        const existingPerm = userPerms.find(p => p.utility_key === utilityKey);
        if (existingPerm) {
          return {
            ...prev,
            [userId]: userPerms.map(p => 
              p.utility_key === utilityKey ? { ...p, is_enabled: enabled } : p
            )
          };
        } else {
          return {
            ...prev,
            [userId]: [...userPerms, { utility_key: utilityKey, is_enabled: enabled }]
          };
        }
      });

      return true;
    } catch (err: any) {
      console.error('Error toggling utility permission:', err);
      throw err;
    }
  };

  const removeUser = async (userId: string) => {
    // Note: This only deactivates the user, doesn't delete from auth
    // Full deletion would require admin API access
    try {
      await toggleUserStatus(userId, false);
      return true;
    } catch (err) {
      throw err;
    }
  };

  const getUtilityEnabled = (userId: string, utilityKey: string): boolean => {
    const perms = userPermissions[userId] || [];
    const perm = perms.find(p => p.utility_key === utilityKey);
    return perm?.is_enabled ?? false; // Default to false if no record
  };

  const toggleAllUtilities = async (userId: string, enabled: boolean) => {
    try {
      for (const utility of UTILITY_KEYS) {
        await toggleUtilityPermission(userId, utility.key, enabled);
      }
      return true;
    } catch (err: any) {
      console.error('Error toggling all utilities:', err);
      throw err;
    }
  };

  const areAllUtilitiesEnabled = (userId: string): boolean => {
    return UTILITY_KEYS.every(utility => getUtilityEnabled(userId, utility.key));
  };

  return {
    users,
    userPermissions,
    loading,
    error,
    fetchUsers,
    toggleUserStatus,
    toggleUtilityPermission,
    removeUser,
    getUtilityEnabled,
    toggleAllUtilities,
    areAllUtilitiesEnabled
  };
};
