
import React from "react";
import { TableHead, TableHeader as UITableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  DynamicTemperatureIcon, 
  DynamicCloudCoverIcon, 
  DynamicWindIcon, 
  DynamicHumidityIcon 
} from "@/components/weather/DynamicIcons";

const TableHeader: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <UITableHeader>
      <TableRow className="bg-cosmic-800/40 hover:bg-cosmic-800/60">
        <TableHead className="py-3">{t("Time", "时间")}</TableHead>
        <TableHead className="text-center">
          <DynamicTemperatureIcon temperature={20} className="inline h-4 w-4 mr-1" />
          {t("Temp", "温度")}
        </TableHead>
        <TableHead className="text-center">
          <DynamicCloudCoverIcon cloudCover={50} className="inline h-4 w-4 mr-1" />
          {t("Clouds", "云层")}
        </TableHead>
        <TableHead className="text-center">
          <DynamicWindIcon windSpeed={15} className="inline h-4 w-4 mr-1" />
          {t("Wind", "风速")}
        </TableHead>
        <TableHead className="text-center">
          <DynamicHumidityIcon humidity={50} className="inline h-4 w-4 mr-1" />
          {t("Humid", "湿度")}
        </TableHead>
        <TableHead>{t("Conditions", "天气状况")}</TableHead>
        <TableHead className="text-center">{t("Astro Score", "天文评分")}</TableHead>
      </TableRow>
    </UITableHeader>
  );
};

export default React.memo(TableHeader);
