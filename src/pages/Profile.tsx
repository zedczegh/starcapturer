
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import NavBar from '@/components/NavBar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import ProfileForm from '@/components/profile/ProfileForm';
import { Loader2, Star } from 'lucide-react';

// Astronomy facts/tips: EN/中文, pairs
const ASTRONOMY_STORIES = [
  [
    "Did you know? Voyager 1 has traveled over 15 billion miles away from Earth.",
    "你知道吗？旅行者1号已经离地球超过150亿英里。"
  ],
  [
    "There are more stars in the universe than grains of sand on all Earth’s beaches.",
    "宇宙中的星星数量比地球上所有沙滩的沙粒还多。"
  ],
  [
    "A day on Venus is longer than a year on Venus!",
    "金星上的一天比一年还要长！"
  ],
  [
    "Jupiter’s Great Red Spot is actually a giant storm bigger than Earth.",
    "木星的大红斑其实是一场比地球还大的风暴。"
  ],
  [
    "The Milky Way galaxy is on a collision course with the Andromeda galaxy.",
    "银河系正与仙女座星系走向碰撞。"
  ],
  [
    "Neutron stars are so dense that a sugar-cube sized amount weighs as much as Mount Everest.",
    "中子星如此致密，一块方糖大小的中子星其质量等于珠穆朗玛峰。"
  ],
  [
    "The Sun contains 99.8% of the mass of our solar system.",
    "太阳的质量占据了太阳系99.8%。"
  ],
  [
    "Saturn’s rings are made mostly of ice particles and dust.",
    "土星环主要由冰粒和尘埃组成。"
  ],
  [
    "There are over 200 moons in our solar system.",
    "太阳系中有超过200颗卫星。"
  ],
  [
    "If two pieces of metal touch in space, they bond permanently due to cold welding.",
    "空间中的两块金属只要接触就会永久粘连，这叫做冷焊现象。"
  ],
  [
    "The Hubble Space Telescope has captured images of galaxies billions of light-years away.",
    "哈勃太空望远镜拍摄到数十亿光年外的星系。"
  ],
  [
    "A spoonful of a neutron star weighs about 1 billion tons.",
    "一勺中子星的质量有10亿吨左右。"
  ],
  [
    "Mars has the tallest volcano in the solar system—Olympus Mons.",
    "火星拥有太阳系最高的火山——奥林帕斯山。"
  ],
  [
    "The hottest planet in the solar system is Venus.",
    "太阳系中最热的行星是金星。"
  ],
  [
    "Sunsets on Mars are blue, not red.",
    "火星上的日落是蓝色的，而不是红色。"
  ],
  [
    "The International Space Station travels at about 17,500 mph.",
    "国际空间站以大约每小时17500英里的速度环绕地球。"
  ],
  [
    "One million Earths could fit inside the Sun.",
    "太阳中可以容纳100万个地球。"
  ],
  [
    "The footprints left on the Moon could remain for millions of years.",
    "留在月球上的脚印可以持续上百万年。"
  ],
  [
    "Comets are sometimes called dirty snowballs.",
    "彗星有时被称为‘脏雪球’。"
  ],
  [
    "The center of our galaxy smells like raspberries and rum (based on chemicals detected).",
    "银河系中心闻起来像覆盆子和朗姆酒（基于探测到的化学物质）。"
  ],
  [
    "There’s a planet where it rains glass sideways—HD 189733b.",
    "有一颗行星会下横向玻璃雨——HD 189733b。"
  ],
  [
    "A year on Mercury is just 88 Earth days.",
    "水星上的一年仅为地球上的88天。"
  ],
  [
    "Pluto is smaller than Earth’s Moon.",
    "冥王星比地球的月球还小。"
  ],
  [
    "The observable universe is about 93 billion light-years across.",
    "可观测宇宙的直径约为930亿光年。"
  ],
  [
    "Triton, Neptune’s moon, orbits backward compared to most moons.",
    "海王星的卫星海卫一轨道方向与大多数卫星相反。"
  ],
  [
    "A spoonful of the Sun would weigh 2 kilos on Earth.",
    "一勺太阳物质在地球上大约重2公斤。"
  ]
  // ...add more if desired
];

interface Profile {
  username: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
}

interface ProfileFormValues {
  username: string;
  date_of_birth: string;
}

const Profile = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [randomTip, setRandomTip] = useState<[string, string] | null>(null);

  const { register, handleSubmit, setValue } = useForm<ProfileFormValues>({
    defaultValues: {
      username: '',
      date_of_birth: ''
    }
  });

  useEffect(() => {
    // Pick a random tip/story at mount
    setRandomTip(ASTRONOMY_STORIES[Math.floor(Math.random() * ASTRONOMY_STORIES.length)]);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t("Authentication required", "需要认证"), {
          description: t("Please sign in to view your profile", "请登录以查看您的个人资料")
        });
        navigate('/photo-points');
        return;
      }
      
      fetchProfile(session.user.id);
    };

    checkSession();
  }, [navigate, t]);

  const fetchProfile = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, date_of_birth')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const profileData: Profile = {
          username: data.username || '',
          avatar_url: data.avatar_url,
          date_of_birth: data.date_of_birth || null
        };
        
        setProfile(profileData);
        setValue('username', data.username || '');
        setValue('date_of_birth', data.date_of_birth || '');
        setAvatarUrl(data.avatar_url);
      } else {
        // Create profile if it doesn't exist
        await supabase.from('profiles').insert({
          id: userId,
          username: null,
          avatar_url: null,
          date_of_birth: null
        });
        
        setProfile({
          username: null,
          avatar_url: null,
          date_of_birth: null
        });
      }
    } catch (error: any) {
      toast.error(t("Failed to load profile", "加载个人资料失败"), {
        description: error.message
      });
      console.error("Profile fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);
    }
  };

  const onSubmit = async (formData: ProfileFormValues) => {
    if (!user) {
      toast.error(t("Authentication required", "需要认证"));
      return;
    }

    try {
      setSaving(true);

      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        setUploadingAvatar(true);
        
        // First, check if the avatars bucket exists
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          toast.error(t("Storage error", "存储错误"), {
            description: bucketsError.message
          });
          setUploadingAvatar(false);
          setSaving(false);
          return;
        }
        
        // If avatars bucket doesn't exist, handle gracefully
        const avatarsBucketExists = buckets.some(bucket => bucket.name === 'avatars');
        
        if (!avatarsBucketExists) {
          toast.error(t("Avatar upload not available", "头像上传功能不可用"), {
            description: t("Storage not configured. Profile saved without avatar.", "存储未配置。个人资料已保存，但未包含头像。")
          });
        } else {
          // Proceed with upload
          const fileExt = avatarFile.name.split('.').pop();
          const fileName = `${user.id}-${Math.random()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatarFile);

          if (uploadError) {
            if (uploadError.message.includes('Bucket not found')) {
              toast.error(t("Avatar upload failed: Storage bucket not configured", "头像上传失败：存储桶未配置"));
            } else {
              toast.error(uploadError.message);
            }
            setUploadingAvatar(false);
            setSaving(false);
            return;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

          newAvatarUrl = publicUrl;
        }
        setUploadingAvatar(false);
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: formData.username,
          date_of_birth: formData.date_of_birth || null,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (updateError) throw updateError;

      toast.success(t("Profile updated successfully", "个人资料更新成功"));
    } catch (error: any) {
      toast.error(t("Update failed", "更新失败"), {
        description: error.message
      });
      console.error("Profile update error:", error);
    } finally {
      setSaving(false);
    }
  };

  const removeAvatar = () => {
    setAvatarUrl(null);
    setAvatarFile(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900">
        <NavBar />
        <div className="container mx-auto px-4 py-8 pt-24 flex justify-center items-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-cosmic-300">{t("Loading profile...", "正在加载个人资料...")}</p>
          </div>
        </div>
      </div>
    );
  }

  const displayUsername = profile?.username || t("Stargazer", "星空观察者");
  // Show EN or CN story depending on current language.
  const astronomyTip =
    randomTip && language === 'zh'
      ? randomTip[1]
      : (randomTip ? randomTip[0] : '');

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900">
      <NavBar />

      <div className="container mx-auto px-4 py-8 pt-24 max-w-3xl">
        <Card className="glassmorphism p-8 rounded-xl shadow-glow">
          <div className="flex flex-col gap-8">
            {/* Header with username, avatar, and tip */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-4 border-b border-cosmic-800">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white flex items-center mb-2">
                  <Star className="w-7 h-7 text-primary mr-2 animate-pulse" />
                  {displayUsername}
                </h1>
                <div className="mt-2 text-cosmic-300 text-base md:text-lg flex items-center">
                  <span>
                    {t("Welcome! Update your personal information below.", "欢迎！在下方更新您的个人信息。")}
                  </span>
                </div>
                {astronomyTip && (
                  <div className="mt-3 text-cosmic-100 bg-primary/10 border-l-4 border-primary/60 rounded px-4 py-2 font-medium shadow animate-fade-in">
                    <span className="text-primary font-semibold mr-2">★</span>
                    {astronomyTip}
                  </div>
                )}
              </div>
              {/* Avatar on right */}
              <div className="flex-shrink-0">
                <ProfileAvatar 
                  avatarUrl={avatarUrl}
                  onAvatarChange={handleAvatarChange}
                  onRemoveAvatar={removeAvatar}
                  uploadingAvatar={uploadingAvatar}
                />
              </div>
            </div>

            <ProfileForm 
              register={register}
              loading={saving}
              onSubmit={handleSubmit(onSubmit)}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;

