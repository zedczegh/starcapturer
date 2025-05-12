
import React from "react";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

interface ProfileNotFoundProps {
  navigate: (path: number) => void;
  t: (en: string, zh: string) => string;
}

const ProfileNotFound: React.FC<ProfileNotFoundProps> = ({ navigate, t }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cosmic-900 text-white">
      <User className="w-10 h-10 mb-4 text-cosmic-400" />
      <div>{t("User not found.", "找不到用户。")}</div>
      <Button className="mt-4" onClick={() => navigate(-1)}>
        {t("Back", "返回")}
      </Button>
    </div>
  );
};

export default ProfileNotFound;
