import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wrench, Music, Calculator, Satellite, Eye, Video, Sigma, Film, Zap, Lock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const UtilitiesButton: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) return;
      
      const utilityKeys = [
        'stereoscope', 'star-field-generator', 'parallel-video-generator',
        'motion-animation', 'space-tracker', 'sonification', 
        'sampling-calculator', 'astro-math'
      ];
      
      const perms: Record<string, boolean> = {};
      for (const key of utilityKeys) {
        const { data } = await supabase.rpc('can_use_utility', { 
          p_user_id: user.id, 
          p_utility_key: key 
        });
        perms[key] = data ?? true;
      }
      setPermissions(perms);
    };
    
    fetchPermissions();
  }, [user]);

  const getUtilityKey = (path: string): string => {
    return path.replace('/', '');
  };

  const handleItemClick = (path: string) => {
    if (!user) {
      toast.error(t('Please log in to use this tool.', '请登录以使用此工具。'));
      return;
    }
    
    const key = getUtilityKey(path);
    if (permissions[key] === false) {
      toast.error(t('You do not have permission to use this tool.', '您没有使用此工具的权限。'));
      return;
    }
    
    navigate(path);
  };

  const utilityItems = [
    { icon: Eye, label: t('Stereoscope Processor', '立体镜处理器'), path: '/stereoscope' },
    { icon: Video, label: t('3D Star Field Generator', '3D星场生成器'), path: '/star-field-generator' },
    { icon: Film, label: t('3D Parallel Video Generator', '3D平行视频生成器'), path: '/parallel-video-generator' },
    { icon: Zap, label: t('Motion Animation', '动态动画'), path: '/motion-animation' },
    { icon: Satellite, label: t('Space Station Tracker', '空间站追踪'), path: '/space-tracker' },
    { icon: Music, label: t('Sonification', '声化处理器'), path: '/sonification' },
    { icon: Calculator, label: t('Sampling Calculator', '采样计算器'), path: '/sampling-calculator' },
    { icon: Sigma, label: t('Astro Math', '天文数学'), path: '/astro-math' },
  ];

  const menuItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
      },
    }),
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative h-9 w-9 p-0 text-cosmic-200 hover:text-white hover:bg-cosmic-800/50 transition-all duration-300"
        >
          <Wrench className="h-4 w-4" />
          <span className="sr-only">{t('Utilities Menu', '实用工具菜单')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="z-[200] min-w-[240px] rounded-xl bg-gradient-to-br from-cosmic-950/95 to-cosmic-900/95 backdrop-blur-xl border border-cosmic-700/30 shadow-2xl py-2"
        asChild
      >
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-cosmic-700/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                <Wrench className="h-4 w-4 text-amber-400" />
              </div>
              <span className="font-semibold text-white">{t('Utilities', '实用工具')}</span>
            </div>
            <p className="text-xs text-cosmic-400 mt-1">{t('Astronomy tools & calculators', '天文工具和计算器')}</p>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {utilityItems.map(({ icon: Icon, label, path }, i) => {
              const key = getUtilityKey(path);
              const isLocked = user && permissions[key] === false;
              
              return (
                <motion.div
                  key={path}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={menuItemVariants}
                >
                  <DropdownMenuItem
                    onClick={() => handleItemClick(path)}
                    className={`px-3 py-2.5 flex gap-3 items-center rounded-lg transition-all duration-300 cursor-pointer group ${
                      isLocked 
                        ? 'opacity-50 hover:bg-red-500/10' 
                        : 'hover:bg-gradient-to-r hover:from-amber-500/15 hover:to-orange-500/15'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isLocked 
                        ? 'bg-red-800/30' 
                        : 'bg-cosmic-800/50 group-hover:bg-amber-500/25'
                    }`}>
                      {isLocked ? (
                        <Lock className="h-3.5 w-3.5 text-red-400" />
                      ) : (
                        <Icon className="h-3.5 w-3.5 text-cosmic-300 group-hover:text-amber-400 transition-colors" />
                      )}
                    </div>
                    <span className={`font-medium text-sm ${
                      isLocked ? 'text-cosmic-400' : 'text-cosmic-100 group-hover:text-white'
                    }`}>
                      {label}
                    </span>
                    {isLocked && (
                      <Lock className="h-3 w-3 text-red-400 ml-auto" />
                    )}
                  </DropdownMenuItem>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UtilitiesButton;