import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Plus, Eye, EyeOff, Lock, Unlock, Trash2 } from "lucide-react";
import { MotionAnimationLayer } from "@/types/motionAnimationLayer";
import { cn } from "@/lib/utils";

interface LayerPanelProps {
  layers: MotionAnimationLayer[];
  activeLayerId: string;
  onSelectLayer: (layerId: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onToggleLock: (layerId: string) => void;
}

export const LayerPanel = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onDeleteLayer,
  onToggleVisibility,
  onToggleLock,
}: LayerPanelProps) => {
  const { t } = useLanguage();

  return (
    <Card className="bg-cosmic-800/60 border-primary/20 backdrop-blur-xl p-3 sm:p-4 mx-3 sm:mx-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          {t("Layers", "图层")}
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={onAddLayer}
          disabled={layers.length >= 5}
          title={t("Add Layer", "添加图层")}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
              activeLayerId === layer.id
                ? "bg-primary/20 border border-primary/40"
                : "bg-cosmic-900/40 hover:bg-cosmic-900/60 border border-transparent"
            )}
            onClick={() => !layer.locked && onSelectLayer(layer.id)}
          >
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(layer.id);
                }}
                title={layer.visible ? t("Hide", "隐藏") : t("Show", "显示")}
              >
                {layer.visible ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <EyeOff className="w-3 h-3 opacity-50" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock(layer.id);
                }}
                title={layer.locked ? t("Unlock", "解锁") : t("Lock", "锁定")}
              >
                {layer.locked ? (
                  <Lock className="w-3 h-3" />
                ) : (
                  <Unlock className="w-3 h-3 opacity-50" />
                )}
              </Button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground truncate">
                {layer.name}
              </div>
              <div className="flex gap-1 mt-1">
                <div
                  className="w-3 h-3 rounded-sm border border-white/20"
                  style={{ backgroundColor: layer.rangeColor }}
                  title={t("Range color", "范围颜色")}
                />
                <div
                  className="w-3 h-3 rounded-sm border border-white/20"
                  style={{ backgroundColor: layer.motionColor }}
                  title={t("Motion color", "运动颜色")}
                />
              </div>
            </div>

            {layers.length > 1 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteLayer(layer.id);
                }}
                title={t("Delete Layer", "删除图层")}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
