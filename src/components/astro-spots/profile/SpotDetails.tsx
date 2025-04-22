
import React from 'react';
import { Tag } from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";

interface SpotDetailsProps {
  description?: string;
  types?: Array<{ id: string; type_name: string }>;
  advantages?: Array<{ id: string; advantage_name: string }>;
}

const SpotDetails: React.FC<SpotDetailsProps> = ({ description, types, advantages }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {description && (
        <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30">
          <h2 className="text-xl font-semibold text-gray-200 mb-3 flex items-center">
            <span className="w-2 h-6 bg-primary rounded-sm mr-2.5"></span>
            {t("Description", "描述")}
          </h2>
          <p className="text-gray-300 whitespace-pre-wrap">{description}</p>
        </div>
      )}
      
      {types && types.length > 0 && (
        <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30">
          <h2 className="text-xl font-semibold text-gray-200 mb-3 flex items-center">
            <Tag className="h-5 w-5 mr-2 text-primary/80" />
            {t("Location Type", "位置类型")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {types.map((type) => (
              <span 
                key={type.id}
                className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-700/50 to-indigo-700/50 border border-purple-600/30 text-sm text-gray-200 backdrop-blur-sm"
              >
                {type.type_name}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {advantages && advantages.length > 0 && (
        <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30">
          <h2 className="text-xl font-semibold text-gray-200 mb-3 flex items-center">
            <span className="w-2 h-6 bg-green-500 rounded-sm mr-2.5"></span>
            {t("Advantages", "优势")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {advantages.map((advantage) => (
              <span 
                key={advantage.id}
                className="px-3 py-1 rounded-full bg-gradient-to-r from-green-700/50 to-teal-700/50 border border-green-600/30 text-sm text-gray-200 backdrop-blur-sm"
              >
                {advantage.advantage_name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotDetails;
