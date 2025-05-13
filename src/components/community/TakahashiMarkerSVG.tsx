
import React from "react";
import { Telescope } from "lucide-react";

type Props = {
  size?: number;
  color?: string;
  fill?: string;
  strokeWidth?: number;
};

const TakahashiMarkerSVG: React.FC<Props> = ({ 
  size = 20,
  color = "#fff",
  fill = "none",
  strokeWidth = 2
}) => {
  return (
    <Telescope 
      size={size} 
      color={color} 
      strokeWidth={strokeWidth}
      fill={fill}
      className="telescope-icon"
    />
  );
};

export default TakahashiMarkerSVG;
