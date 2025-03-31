
import React from 'react';

interface ConditionItemProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

const ConditionItem: React.FC<ConditionItemProps> = ({ label, value, icon }) => {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-cosmic-900/30 border border-cosmic-700/20 hover:border-cosmic-600/30 transition-all duration-300">
      <div className="flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold">{value}</div>
      </div>
    </div>
  );
};

export default ConditionItem;
