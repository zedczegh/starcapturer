
import React, { ReactNode } from "react";

interface ConditionItemProps {
  icon: ReactNode;
  label: string;
  value: string | number | React.ReactNode;
}

const ConditionItem: React.FC<ConditionItemProps> = ({ icon, label, value }) => (
  <div className="flex items-start group hover:scale-105 transition-transform duration-300">
    <div className="mr-2 rounded-full bg-cosmic-700/50 p-1.5 group-hover:bg-primary/20 transition-colors">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-cosmic-200">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  </div>
);

export default ConditionItem;
