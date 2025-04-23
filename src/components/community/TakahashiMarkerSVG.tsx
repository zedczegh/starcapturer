
import React from "react";

/**
 * Takahashi 106ED style marker SVG
 * You can further tweak the design, but this focuses on representing
 * - A white tube with blue ring
 * - A black dew shield out front
 * - A blue focuser at the back
 * - Legs for a simple tripod look
 * - Subtle drop shadow/outline
 */
type Props = {
  size?: number;
};

const TakahashiMarkerSVG: React.FC<Props> = ({ size = 20 }) => {
  // Scale all internal dimensions according to `size` for consistency
  const width = size;
  const height = size;

  // Tube and ring proportion calculation
  const tubeStart = width * 0.14;
  const tubeEnd = width * 0.85;
  const ringWidth = width * 0.05;
  const blue = "#19a2d6";
  const white = "#fff";
  const focuserBlue = "#2d81a8";
  const black = "#222"; // Dew shield
  const tripodGray = "#8E9196";

  return (
    <svg width={width} height={height} viewBox="0 0 42 42" fill="none">
      <g>
        {/* Tripod legs */}
        <rect x="15.1" y="31" width="2.5" height="8" rx="1.15" fill={tripodGray} />
        <rect x="24.4" y="31" width="2.5" height="8" rx="1.15" fill={tripodGray} />
        <rect
          x="19.8"
          y="32"
          width="2.5"
          height="7.3"
          rx="1.15"
          fill={tripodGray}
          transform="rotate(-10 20.8 35.65)"
        />
        {/* Main telescope tube */}
        <rect
          x="9.5"
          y="19"
          width="23"
          height="7"
          rx="3.5"
          fill={white}
          stroke="#d6edf6"
          strokeWidth="1"
        />
        {/* Blue ring near front */}
        <rect
          x="9.5"
          y="19"
          width="3.1"
          height="7"
          rx="1.55"
          fill={blue}
          opacity="0.89"
        />
        {/* Black dew shield at the left (front) */}
        <rect
          x="5"
          y="19.8"
          width="5"
          height="5.4"
          rx="2.3"
          fill={black}
        />
        {/* Rear focuser (blue rectangle) */}
        <rect
          x="32.5"
          y="21"
          width="5"
          height="3.1"
          rx="1.6"
          fill={focuserBlue}
        />
        {/* Eyepiece circle */}
        <ellipse
          cx="38.2"
          cy="22.8"
          rx="1.4"
          ry="1.75"
          fill={black}
          opacity="0.67"
        />
        {/* White border outline for visiblity */}
        <rect
          x="9.5"
          y="19"
          width="23"
          height="7"
          rx="3.5"
          fill="none"
          stroke="#fff"
          strokeWidth="1.6"
        />
        {/* Subtle blur behind for drop shadow */}
        <ellipse
          cx="21.3"
          cy="27.6"
          rx="12"
          ry="2.5"
          fill="#000"
          opacity="0.13"
        />
      </g>
    </svg>
  );
};

export default TakahashiMarkerSVG;

