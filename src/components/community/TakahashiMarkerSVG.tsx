
import React from "react";
import { Telescope } from "lucide-react";

type Props = {
  size?: number;
  color?: string;
};

const TakahashiMarkerSVG: React.FC<Props> = ({ 
  size = 20,
  color = "#fff" 
}) => {
  return <Telescope size={size} color={color} strokeWidth={2} />;
};

export default TakahashiMarkerSVG;
