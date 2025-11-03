import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, MapPin, Star, Eye } from "lucide-react";
import CountryFlag from "@/components/location/CountryFlag";

interface SavedAstroSpot {
  id: string;
  spot_id: string;
  name: string;
  latitude: number;
  longitude: number;
  bortlescale?: number;
  siqs?: number;
  verification_status?: string;
  created_at: string;
  updated_at: string;
}

interface AstroSpotCollectionGridProps {
  spots: SavedAstroSpot[];
  editMode: boolean;
  editingNames: { [id: string]: string };
  savingNames: { [id: string]: boolean };
  onNameChange: (id: string, value: string) => void;
  onSaveName: (spot: SavedAstroSpot) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onViewDetails: (spot: SavedAstroSpot) => void;
}

const AstroSpotCollectionGrid: React.FC<AstroSpotCollectionGridProps> = ({
  spots,
  editMode,
  editingNames,
  savingNames,
  onNameChange,
  onSaveName,
  onDelete,
  onViewDetails,
}) => {
  const { t } = useLanguage();

  const getVerificationBadge = (status?: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">{t('Verified', '已验证')}</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-600 hover:bg-yellow-700">{t('Pending', '待审核')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive">{t('Rejected', '已拒绝')}</Badge>;
      default:
        return <Badge variant="outline">{t('Unverified', '未验证')}</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {spots.map((spot) => {
        const isEditing = editMode && editingNames[spot.id] !== undefined;
        const customName = isEditing ? editingNames[spot.id] : spot.name;
        
        return (
          <Card key={spot.id} className="relative group cosmic-border bg-cosmic-900/50 backdrop-blur-sm hover:bg-cosmic-800/50 transition-all duration-200">
            {editMode && (
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 z-10 rounded-full h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onDelete(spot.spot_id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}

            <CardHeader className="pb-2">
              {editMode ? (
                <div className="flex items-center gap-2">
                  <Input
                    className="flex-1 text-sm border-cosmic-700"
                    value={editingNames[spot.id] ?? spot.name}
                    maxLength={50}
                    onChange={(e) => onNameChange(spot.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={savingNames[spot.id]}
                  />
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSaveName(spot);
                    }}
                    disabled={savingNames[spot.id]}
                    className="px-2"
                  >
                    {savingNames[spot.id] ? t("Saving...", "保存中…") : t("Save", "保存")}
                  </Button>
                </div>
              ) : (
                <CardTitle className="text-primary text-lg leading-tight">{customName}</CardTitle>
              )}
              <div className="flex items-center gap-2 pt-1">
                {getVerificationBadge(spot.verification_status)}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-cosmic-300">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}</span>
              </div>

              {(spot.siqs !== null && spot.siqs !== undefined) && (
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="text-cosmic-200">
                    {t("SIQS", "SIQS")}: <span className="text-primary font-medium">{spot.siqs?.toFixed(1)}</span>
                  </span>
                </div>
              )}

              {(spot.bortlescale !== null && spot.bortlescale !== undefined) && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-xs text-cosmic-900 font-bold">{spot.bortlescale}</span>
                  </div>
                  <span className="text-cosmic-200">
                    {t("Bortle Scale", "波特尔等级")}
                  </span>
                </div>
              )}

              <Button
                onClick={() => onViewDetails(spot)}
                variant="outline"
                size="sm"
                className="w-full mt-3 bg-cosmic-800/30 border-cosmic-700/50 hover:bg-cosmic-700/50 text-cosmic-200 hover:text-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                {t("View Details", "查看详情")}
              </Button>
              
              <div className="flex items-center gap-2 mt-2">
                <CountryFlag latitude={spot.latitude} longitude={spot.longitude} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AstroSpotCollectionGrid;