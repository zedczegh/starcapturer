
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, MapPin, Calendar, Tag, Album, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CommunityAstroSpotDialogProps {
  open: boolean;
  onClose: () => void;
  spot: any | null;
  spotImages?: string[];
}

const CommunityAstroSpotDialog: React.FC<CommunityAstroSpotDialogProps> = ({
  open, onClose, spot, spotImages = []
}) => {
  const { t } = useLanguage();

  if (!spot) return null;

  // Utility for username fallback
  const getUsername = (comment: any) => {
    if (!comment || !comment.profiles) return t("Anonymous", "匿名用户");
    if (typeof comment.profiles === 'object') {
      return comment.profiles.username || t("Anonymous", "匿名用户");
    }
    return t("Anonymous", "匿名用户");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="
          bg-cosmic-800/70 backdrop-blur-xl shadow-glow border border-cosmic-700/40
          max-w-2xl w-full glassmorphism
          px-0 py-0
        "
        style={{
          background: "linear-gradient(135deg, rgba(58,40,95,0.92) 75%, rgba(89,94,117,0.97) 100%)",
          boxShadow: "0 16px 48px rgba(139,92,246,0.25), 0 2px 16px #2228",
          overflow: "visible",
        }}
      >
        <DialogHeader className="bg-cosmic-900/70 rounded-t-xl px-6 py-4 border-b-cosmic-700/25 border-b">
          <DialogTitle className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400 animate-pulse" />
            {spot.name}
          </DialogTitle>
          <div className="flex items-center gap-5 mt-1 text-cosmic-300 text-sm flex-wrap">
            <div className="flex items-center"><MapPin className="h-4 w-4 mr-1" /> {spot.latitude?.toFixed(4)}, {spot.longitude?.toFixed(4)}</div>
            <div className="flex items-center"><Calendar className="h-4 w-4 mr-1" /> {new Date(spot.created_at).toLocaleDateString()}</div>
            {spot.siqs && (
              <div className="flex items-center rounded-full bg-gradient-to-r from-green-600/40 to-blue-600/40 px-3 py-1 text-white ml-2">
                SIQS: <span className="font-semibold ml-1">{spot.siqs}</span>
              </div>
            )}
          </div>
        </DialogHeader>
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {spot.description && (
            <div className="glassmorphism-light p-4 rounded-lg border border-cosmic-700/30">
              <h2 className="font-semibold text-primary mb-1">{t("Description", "描述")}</h2>
              <p className="text-gray-200">{spot.description}</p>
            </div>
          )}

          {spot.astro_spot_types?.length > 0 && (
            <div className="glassmorphism-light p-4 rounded-lg border border-cosmic-700/30">
              <h2 className="font-semibold text-primary mb-1 flex items-center gap-2">
                <Tag className="h-4 w-4" />{t("Location Type", "位置类型")}
              </h2>
              <div className="flex gap-2 flex-wrap">
                {spot.astro_spot_types.map((type: any) => (
                  <span key={type.id} className="px-3 py-1 rounded-full text-xs bg-gradient-to-r from-purple-600/40 to-indigo-600/30 border border-purple-400/30 text-cosmic-100">{type.type_name}</span>
                ))}
              </div>
            </div>
          )}

          {spot.astro_spot_advantages?.length > 0 && (
            <div className="glassmorphism-light p-4 rounded-lg border border-cosmic-700/30">
              <h2 className="font-semibold text-green-400 mb-1">{t("Advantages", "优势")}</h2>
              <div className="flex gap-2 flex-wrap">
                {spot.astro_spot_advantages.map((adv: any) => (
                  <span key={adv.id} className="px-3 py-1 rounded-full text-xs bg-gradient-to-r from-green-600/40 to-teal-600/30 border border-green-400/30 text-cosmic-100">{adv.advantage_name}</span>
                ))}
              </div>
            </div>
          )}

          <div className="glassmorphism-light p-4 rounded-lg border border-cosmic-700/30">
            <h2 className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
              <Album className="h-4 w-4" />{t("Location Images", "位置图片")}
            </h2>
            {spotImages?.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {spotImages.map((img: string, idx: number) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`astropoint-img-${idx}`}
                    className="rounded-lg border border-cosmic-600/20 shadow backdrop-blur-lg object-cover aspect-square w-full h-full"
                  />
                ))}
              </div>
            ) : (
              <div className="text-cosmic-300 text-xs flex items-center gap-1 py-2">
                <Album className="h-4 w-4" /> {t("No images available", "暂无图片")}
              </div>
            )}
          </div>

          <div className="glassmorphism-light p-4 rounded-lg border border-cosmic-700/30">
            <h2 className="font-semibold text-primary mb-1 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> {t("Comments", "评论")}
            </h2>
            {spot.astro_spot_comments?.length > 0 ? (
              <div className="space-y-2 max-h-[140px] overflow-y-auto">
                {spot.astro_spot_comments.slice(0, 2).map((comment: any) => (
                  <div key={comment.id} className="rounded glassmorphism-light border border-cosmic-600/15 px-3 py-2">
                    <div className="flex items-center gap-2 text-xs mb-0.5 text-cosmic-200">
                      <span className="font-bold">{getUsername(comment)}</span>
                      <span className="text-cosmic-300">{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-cosmic-100 text-sm">{comment.content}</p>
                  </div>
                ))}
                {spot.astro_spot_comments.length > 2 && (
                  <div className="text-right mt-2 text-xs text-primary cursor-pointer hover:underline">
                    {t("View all comments...", "查看全部评论...")}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-cosmic-300 text-xs flex items-center gap-1">
                <MessageCircle className="h-4 w-4" /> {t("No comments yet", "暂无评论")}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommunityAstroSpotDialog;

