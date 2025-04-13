
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Award, GraduationCap } from "lucide-react";
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
  credentials?: string;
  credentialsZh?: string;
}

const teamMembers: TeamMember[] = [
  {
    name: "Dr. James Chen",
    nameZh: "陈博士",
    role: "Lead Astronomer",
    roleZh: "首席天文学家",
    avatar: "JC",
    specialty: "Light Pollution Analysis",
    specialtyZh: "光污染分析",
    credentials: "Ph.D. Astronomy, Stanford University",
    credentialsZh: "斯坦福大学天文学博士"
  },
  {
    name: "Dr. Emily Rodriguez",
    nameZh: "艾米丽·罗德里格斯",
    role: "Dark Sky Specialist",
    roleZh: "暗夜专家",
    avatar: "ER",
    specialty: "Dark Sky Conservation",
    specialtyZh: "暗夜保护",
    credentials: "Ph.D. Environmental Science, MIT",
    credentialsZh: "麻省理工学院环境科学博士"
  },
  {
    name: "Wei Zhang",
    nameZh: "张伟",
    role: "Software Architect",
    roleZh: "软件架构师",
    avatar: "WZ",
    specialty: "Geospatial Analysis",
    specialtyZh: "地理空间分析",
    credentials: "M.S. Computer Science, Berkeley",
    credentialsZh: "伯克利大学计算机科学硕士"
  },
  {
    name: "Dr. Sophia Park",
    nameZh: "朴素菲",
    role: "Research Scientist",
    roleZh: "研究科学家",
    avatar: "SP",
    specialty: "Astronomical Imaging",
    specialtyZh: "天文成像",
    credentials: "Ph.D. Astrophysics, Caltech",
    credentialsZh: "加州理工学院天体物理学博士"
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
            {t("Our Research Team", "我们的研究团队")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
          <p className="mb-6 text-cosmic-200">
            {t(
              "Our team of astronomers, environmental scientists, and engineers work together to provide accurate sky quality measurements and promote dark sky conservation around the world.",
              "我们的天文学家、环境科学家和工程师团队共同努力，提供准确的天空质量测量，并在全球范围内促进暗夜保护。"
            )}
          </p>

          <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'grid-cols-2 gap-4'} mt-6`}>
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
                <div className="space-y-2">
                  <p className="text-xs text-cosmic-300 bg-cosmic-800/50 px-3 py-1.5 rounded-full inline-block">
                    {language === 'en' ? member.specialty : member.specialtyZh}
                  </p>
                  {member.credentials && (
                    <div className="flex items-center text-xs text-cosmic-400 mt-2">
                      <GraduationCap className="h-3 w-3 mr-1.5" />
                      {language === 'en' ? member.credentials : member.credentialsZh}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 bg-cosmic-800/20 p-4 rounded-lg border border-cosmic-700/20">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-yellow-400" />
              <p className="text-sm font-medium text-cosmic-100">
                {t("Research Partners", "研究合作伙伴")}
              </p>
            </div>
            <p className="text-xs text-cosmic-300">
              {t("Collaborating with the International Dark-Sky Association, NASA Night Sky Network, and major universities worldwide.", 
                "与国际暗夜协会、NASA夜空网络和全球主要大学合作。")}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AboutTeam;
