
import React from "react";

/**
 * Observatory Dome style marker SVG.
 * - Large white dome with blue shadow/highlight
 * - Slit showing a telescope peeking out at an angle
 * - Subtle base and a drop shadow for "ground"
 * - Designed for map marker usage
 */
type Props = {
  size?: number;
};

const TakahashiMarkerSVG: React.FC<Props> = ({ size = 48 }) => {
  // Dome and features scale with marker size
  const width = size;
  const height = size;

  const domeWhite = "#fff";
  const domeShadow = "#d0e4f5";
  const blueAccent = "#19a2d6";
  const slitGray = "#b9c4dd";
  const slitDark = "#7b8593";
  const telescopeBody = "#3b4f6e";
  const telescopeHighlight = "#a7d4f7";
  const shadow = "#000";
  const base = "#9aa5b9";

  return (
    <svg width={width} height={height} viewBox="0 0 54 54" fill="none">
      {/* Drop shadow */}
      <ellipse
        cx="27"
        cy="49"
        rx="17"
        ry="5.5"
        fill={shadow}
        opacity="0.13"
      />
      {/* Dome main shape */}
      <ellipse
        cx="27"
        cy="28"
        rx="21"
        ry="18"
        fill={domeWhite}
        stroke={domeShadow}
        strokeWidth="2.2"
      />
      {/* Dome shadow (right side) */}
      <path
        d="
          M48 28
          a21 18 0 0 1 -21 18
          a21 18 0 0 0 21 -18
          Z
        "
        fill={domeShadow}
        opacity="0.43"
      />
      {/* Dome slit */}
      <rect
        x="22.4"
        y="10"
        width="7.25"
        height="25"
        rx="3.5"
        fill={slitGray}
        stroke={slitDark}
        strokeWidth="1.2"
      />
      {/* Slit shadow line */}
      <rect
        x="25.47"
        y="10"
        width="1.1"
        height="25"
        rx="0.6"
        fill={slitDark}
        opacity="0.36"
      />
      {/* Telescope tube peeking out of slit (angled) */}
      <rect
        x="28"
        y="15"
        width="3.8"
        height="15"
        rx="1.7"
        fill={telescopeBody}
        stroke={telescopeHighlight}
        strokeWidth="0.75"
        transform="rotate(28 30 22.5)"
      />
      {/* Telescope front (light blue) */}
      <ellipse
        cx="34.8"
        cy="22.4"
        rx="2.2"
        ry="1.6"
        fill={telescopeHighlight}
        opacity="0.79"
        transform="rotate(28 34.8 22.4)"
      />
      {/* Dome base */}
      <ellipse
        cx="27"
        cy="44.5"
        rx="15"
        ry="3.9"
        fill={base}
        opacity="0.57"
      />
      {/* Decorative blue ring on base */}
      <ellipse
        cx="27"
        cy="44.5"
        rx="12"
        ry="2.3"
        fill={blueAccent}
        opacity="0.18"
      />
      {/* Outline for clarity on bright maps */}
      <ellipse
        cx="27"
        cy="28"
        rx="21"
        ry="18"
        fill="none"
        stroke="#fff"
        strokeWidth="2.5"
        opacity="0.96"
      />
    </svg>
  );
};

export default TakahashiMarkerSVG;
