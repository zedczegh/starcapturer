import React from 'react';
import { BORTLE_SCALE_DATA } from '@/utils/bortleScaleColors';

interface BortleScaleLegendProps {
  className?: string;
}

const BortleScaleLegend: React.FC<BortleScaleLegendProps> = ({ className = '' }) => {
  return (
    <div className={`bg-cosmic-900/95 backdrop-blur-xl border border-primary/20 rounded-lg p-4 shadow-lg ${className}`}>
      <p className="text-sm font-semibold text-foreground mb-3">Bortle Dark Sky Scale</p>
      
      <div className="space-y-2">
        {BORTLE_SCALE_DATA.map((item) => (
          <div key={item.scale} className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <div 
                className="w-6 h-6 rounded-sm border border-white/20 flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground">
                  {item.scale} - {item.name}
                </div>
                <div className="text-xs text-cosmic-400 truncate">
                  {item.description}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-primary/20">
        <p className="text-xs text-cosmic-400">
          Lower numbers = Darker skies = Better for stargazing
        </p>
      </div>
    </div>
  );
};

export default BortleScaleLegend;
