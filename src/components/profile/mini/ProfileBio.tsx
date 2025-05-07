
import React from "react";
import { motion } from "framer-motion";

interface ProfileBioProps {
  bio: string;
  t: (en: string, zh: string) => string;
}

const ProfileBio: React.FC<ProfileBioProps> = ({ bio, t }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-6 bg-cosmic-800/40 p-4 rounded-lg border border-cosmic-700/30"
    >
      <h3 className="text-cosmic-200 text-sm font-medium mb-2">{t("About", "关于")}</h3>
      <p className="text-cosmic-100 text-sm">{bio}</p>
    </motion.div>
  );
};

export default ProfileBio;
