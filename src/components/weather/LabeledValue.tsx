
import React from "react";

interface LabeledValueProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const LabeledValue: React.FC<LabeledValueProps> = ({ icon, label, value }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="font-medium">{value}</span>
    </div>
  );
};

export default LabeledValue;
