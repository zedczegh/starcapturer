
import React, { ReactNode } from "react";

interface ConditionItemProps {
  icon: ReactNode;
  label: string;
  value: string | number | React.ReactNode;
}

const ConditionItem: React.FC<ConditionItemProps> = ({ icon, label, value }) => (
  <div className="flex items-start group hover:scale-105 transition-transform duration-300">
    <div className="mr-3 rounded-full bg-cosmic-800/80 p-2 group-hover:bg-primary/20 transition-colors shadow-inner">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-cosmic-200">{label}</p>
      <p className="text-lg font-bold bg-gradient-to-r from-white to-cosmic-100 bg-clip-text text-transparent">{value}</p>
    </div>
  </div>
);

export default ConditionItem;
