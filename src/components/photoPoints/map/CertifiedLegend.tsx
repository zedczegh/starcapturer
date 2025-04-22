import React from "react";
import { Star, Circle, BedDouble, Buildings, Hotel, ParkingCircle, Trees, Mountain, Tent, Telescope } from "lucide-react";

const legendItems = [
  {
    icon: <Star className="w-5 h-5 text-yellow-400" />,
    label: "Dark Sky Park",
    color: "#fde68a"
  },
  {
    icon: <Circle className="w-5 h-5 text-purple-500" />,
    label: "Dark Sky Reserve",
    color: "#a78bfa"
  },
  {
    icon: <Hotel className="w-5 h-5 text-pink-400" />,
    label: "Dark Sky Lodging",
    color: "#f9a8d4"
  },
  {
    icon: (
      <span className="relative w-7 h-7 flex items-center justify-center">
        {/* Circle background */}
        <span className="absolute w-7 h-7 rounded-full bg-sky-100 border-2 border-sky-400"></span>
        {/* Telescope */}
        <Telescope className="w-4 h-4 text-sky-400 relative z-10" />
      </span>
    ),
    label: "User AstroSpot",
    color: "#e0f2fe"
  },
];

const CertifiedLegend: React.FC = () => {
  return (
    <div className="p-4 bg-cosmic-900/70 rounded-xl flex flex-col space-y-3 border border-cosmic-700/40 mt-2">
      <span className="uppercase text-xs font-semibold text-cosmic-200 tracking-wide mb-2">
        Certified & User Markers
      </span>
      <ul className="space-y-1">
        {legendItems.map((item, idx) => (
          <li key={idx} className="flex items-center gap-2">
            {item.icon}
            <span className="text-sm text-cosmic-100" style={{ color: item.color }}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CertifiedLegend;
