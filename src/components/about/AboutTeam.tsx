
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";

interface TeamMember {
  name: string;
  nameZh: string;
  role: string;
  roleZh: string;
  avatar: string;
  specialty: string;
  specialtyZh: string;
}

const teamMembers: TeamMember[] = [
  {
    name: "Dr. Sarah Chen",
    nameZh: "陈博士",
    role: "Lead Astronomer",
    roleZh: "首席天文学家",
    avatar: "SC",
    specialty: "Celestial Mechanics",
    specialtyZh: "天体力学"
  },
  {
    name: "Michael Zhang",
    nameZh: "张明",
    role: "Software Engineer",
    roleZh: "软件工程师",
    avatar: "MZ",
    specialty: "Machine Learning",
    specialtyZh: "机器学习"
  },
  {
    name: "Dr. Alex Patel",
    nameZh: "阿莱克斯",
    role: "Data Scientist",
    roleZh: "数据科学家",
    avatar: "AP",
    specialty: "Remote Sensing",
    specialtyZh: "遥感"
  }
];

const AboutTeam = () => {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  
  // Animation for child elements
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-cosmic-900 border-cosmic-700/50 overflow-hidden backdrop-blur-sm">
        <CardHeader className="pb-3 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="text-cosmic-400" />
            {t("Our Team", "我们的团队")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
          <p className="mb-6 text-cosmic-200">
            {t(
              "Meet the passionate team behind Bortle Now, combining expertise in astronomy, machine learning, and software development to create the ultimate stargazing companion.",
              "了解 Bortle Now 背后充满激情的团队，他们结合了天文学、机器学习和软件开发方面的专业知识，打造出最佳的观星伴侣。"
            )}
          </p>

          <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'grid-cols-3 gap-4'} mt-6`}>
            {teamMembers.map((member, index) => (
              <div 
                key={index} 
                className="bg-cosmic-800/30 rounded-lg p-5 border border-cosmic-700/30 transition-all hover:bg-cosmic-800/50 hover:border-cosmic-700/50"
              >
                <div className="flex items-center gap-4 mb-3">
                  <Avatar className="h-12 w-12 border-2 border-cosmic-700/50">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400">
                      {member.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-cosmic-100">
                      {language === 'en' ? member.name : member.nameZh}
                    </h3>
                    <p className="text-sm text-cosmic-300">
                      {language === 'en' ? member.role : member.roleZh}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-cosmic-300 bg-cosmic-800/50 px-3 py-1.5 rounded-full inline-block">
                  {language === 'en' ? member.specialty : member.specialtyZh}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AboutTeam;
