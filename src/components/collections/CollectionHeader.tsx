
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CollectionHeaderProps {
  count: number;
  editMode: boolean;
  onToggleEditMode: () => void;
}

const CollectionHeader: React.FC<CollectionHeaderProps> = ({
  count,
  editMode,
  onToggleEditMode,
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-foreground">
        {t("My Collections", "我的收藏")}
      </h1>
      {count > 0 && (
        <button
          className="bg-cosmic-800 text-white rounded-full px-4 py-1 text-sm font-medium border border-cosmic-600 shadow hover:bg-cosmic-700 transition"
          onClick={onToggleEditMode}
        >
          {editMode ? t("Done", "完成") : t("Edit", "编辑")}
        </button>
      )}
    </div>
  );
};

export default CollectionHeader;
