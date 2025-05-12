
import React from "react";
import { Button } from "@/components/ui/button";

interface ProfileActionsProps {
  isFromMessages: boolean | undefined;
  user: any;
  profileId: string | undefined;
  handleSendMessage: () => void;
  navigate: (path: number) => void;
  t: (en: string, zh: string) => string;
}

const ProfileActions: React.FC<ProfileActionsProps> = ({
  isFromMessages,
  user,
  profileId,
  handleSendMessage,
  navigate,
  t
}) => {
  return (
    <div className="flex justify-between mt-6">
      {!isFromMessages && user && user.id !== profileId && (
        <Button
          onClick={handleSendMessage}
          className="w-full mr-2"
        >
          {t("Send Message", "发送消息")}
        </Button>
      )}
      <Button 
        variant="secondary" 
        onClick={() => navigate(-1)}
        className={isFromMessages || (user && user.id !== profileId) ? "" : "w-full"}
      >
        {t("Back", "返回")}
      </Button>
    </div>
  );
};

export default ProfileActions;
