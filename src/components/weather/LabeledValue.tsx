
import React from "react";

interface LabeledValueProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const LabeledValue: React.FC<LabeledValueProps> = ({ icon, label, value }) => {
  return (
    <div className="flex items-center justify-between group hover:bg-cosmic-800/30 rounded-md p-1.5 transition-colors duration-200">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="font-medium text-base text-cosmic-100">{value}</span>
    </div>
  );
};

export default LabeledValue;
