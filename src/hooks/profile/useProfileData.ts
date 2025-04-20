
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export interface Profile {
  username: string | null;
  date_of_birth: string | null;
}

export const useProfileData = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('username, date_of_birth')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setProfile(data);
      } catch (err) {
        console.error("Error fetching profile:", err);
        toast.error(t("Failed to load profile", "加载个人资料失败"));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, t]);

  return { profile, loading };
};
