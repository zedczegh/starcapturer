
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import NavBar from '@/components/NavBar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, User, MessageCircle, Star } from 'lucide-react';
import { useUserTags } from '@/hooks/useUserTags';
import UserTags from '@/components/profile/UserTags';
import { motion } from 'framer-motion';
import LocationCard from '@/components/LocationCard';
import { getInitials } from '@/utils/stringUtils';

const ProfileMini = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { tags, loading: loadingTags, fetchUserTags } = useUserTags();
  const [realTimeSiqs, setRealTimeSiqs] = useState<Record<string, number | null>>({});

  // Query for profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      if (!id) throw new Error('No profile ID provided');
      
      console.log("Fetching profile data for:", id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        
        // If profile not found, attempt to create it
        if (error.code === 'PGRST116') {
          console.log("Profile not found, attempting to create a default profile");
          
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([{ id: id }])
            .select()
            .single();
            
          if (insertError) {
            console.error("Failed to create default profile:", insertError);
            throw insertError;
          }
          
          return newProfile;
        }
        
        throw error;
      }
      
      return data;
    },
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  // Query for user's astronomy spots
  const { data: astroSpots, isLoading: loadingSpots } = useQuery({
    queryKey: ['user-spots', id],
    queryFn: async () => {
      if (!id) return [];
      
      console.log("Fetching astro spots for:", id);
      
      const { data, error } = await supabase
        .from('user_astro_spots')
        .select('*')
        .eq('user_id', id);

      if (error) {
        console.error("Error fetching astro spots:", error);
        throw error;
      }
      
      return data || [];
    },
    retry: 1,
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  // Load user tags when profile data is available
  useEffect(() => {
    const loadProfileData = async () => {
      if (id) {
        try {
          console.log("Loading tags for profile:", id);
          await fetchUserTags(id);
        } catch (err) {
          console.error("Error loading tags:", err);
        }
      }
    };
    
    loadProfileData();
  }, [id, fetchUserTags]);
  
  // For updating SIQS values in real-time
  const handleSiqsCalculated = (spotId: string, siqs: number | null) => {
    setRealTimeSiqs(prev => ({
      ...prev,
      [spotId]: siqs
    }));
  };

  const isOwnProfile = user?.id === id;

  const userAvatar = useMemo(() => {
    if (!profile) return null;
    
    if (profile.avatar_url) {
      return (
        <AvatarImage src={profile.avatar_url} alt={profile.username || 'User'} />
      );
    }
    
    return (
      <AvatarFallback className="bg-primary/20">
        <User className="h-12 w-12 text-primary/80" />
      </AvatarFallback>
    );
  }, [profile]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cosmic-950">
        <NavBar />
        <div className="container max-w-3xl py-8 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="rounded-full bg-cosmic-800/50 h-24 w-24"></div>
              <div className="h-6 bg-cosmic-800/50 rounded w-48"></div>
              <div className="h-4 bg-cosmic-800/50 rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-cosmic-950">
        <NavBar />
        <div className="container max-w-3xl py-8 px-4">
          <div className="flex justify-center items-center h-64 text-cosmic-400">
            <div className="text-center">
              <User className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h2 className="text-lg font-medium mb-2">{t('User not found', '用户未找到')}</h2>
              <p className="text-sm mb-4">{t('The profile you are looking for does not exist', '您查找的个人资料不存在')}</p>
              <Link to="/">
                <Button variant="outline">{t('Go to homepage', '返回首页')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
      <NavBar />
      <div className="container max-w-3xl py-8 px-4">
        {/* Back button */}
        <Link to="/messages" className="inline-flex items-center gap-2 text-cosmic-400 hover:text-cosmic-100 mb-6">
          <ArrowLeft className="h-4 w-4" />
          <span>{t('Back to Messages', '返回消息')}</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-cosmic-900/60 border-cosmic-700/40 backdrop-blur shadow-lg overflow-hidden">
            {/* User profile header */}
            <div className="relative h-32 bg-gradient-to-r from-cosmic-800/80 to-cosmic-900/80">
              <div className="absolute -bottom-16 left-6">
                <Avatar className="h-32 w-32 border-4 border-cosmic-900/60 shadow-xl">
                  {userAvatar}
                </Avatar>
              </div>
            </div>

            <CardContent className="pt-20 pb-6">
              <h1 className="text-2xl font-semibold text-cosmic-100 mb-1">
                {profile.username || t('Anonymous User', '匿名用户')}
              </h1>

              {/* Join date */}
              <div className="flex items-center gap-2 text-cosmic-400 text-sm mb-4">
                <span>{t('Joined', '加入于')} {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>

              {/* User tags - debug info and proper handling */}
              <div className="mt-4 mb-2">
                <UserTags 
                  tags={tags} 
                  loading={loadingTags}
                  className="mt-4"
                  editable={false}
                  userId={id}
                />
              </div>

              {/* AstroSpots section with loading state */}
              {loadingSpots ? (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span className="font-medium text-cosmic-200">
                      {t('Astronomy Spots', '天文地点')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map((placeholder) => (
                      <div key={placeholder} className="animate-pulse">
                        <div className="bg-cosmic-800/50 h-32 rounded-md"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : astroSpots && astroSpots.length > 0 ? (
                <div className="mt-6">
                  <div className="flex items-center gap-2 text-cosmic-200 mb-4">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">
                      {t('Astronomy Spots', '天文地点')} ({astroSpots.length})
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {astroSpots.slice(0, 4).map((spot) => (
                      <div key={spot.id} className="relative">
                        <Link to={`/astro-spot/${spot.id}`} className="block w-full">
                          <LocationCard
                            id={spot.id}
                            name={spot.name}
                            latitude={spot.latitude}
                            longitude={spot.longitude}
                            siqs={realTimeSiqs[spot.id] !== undefined ? realTimeSiqs[spot.id] : spot.siqs}
                            timestamp={spot.created_at}
                            username={profile.username || t("Stargazer", "星空观察者")}
                          />
                        </Link>
                      </div>
                    ))}
                  </div>
                  
                  {astroSpots.length > 4 && (
                    <div className="mt-4 text-center text-sm text-cosmic-400">
                      {t('And {{count}} more spots', '还有 {{count}} 个地点').replace('{{count}}', (astroSpots.length - 4).toString())}
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>

            <CardFooter className="border-t border-cosmic-800/60 px-6 py-4 gap-3">
              {!isOwnProfile && (
                <Button className="flex-1">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {t('Message', '发消息')}
                </Button>
              )}

              {isOwnProfile && (
                <Link to="/profile" className="flex-1">
                  <Button variant="outline" className="w-full border-cosmic-700/50">
                    {t('Edit Profile', '编辑资料')}
                  </Button>
                </Link>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileMini;
