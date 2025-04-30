
import React from 'react';

interface TimeItemProps {
  label: string;
  value: string;
}

const TimeItem = ({ label, value }: TimeItemProps) => (
  <div className="flex justify-between items-center">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-xs font-medium ml-2">{value}</span>
  </div>
);

export default React.memo(TimeItem);
