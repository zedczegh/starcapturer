
import React from "react";

/**
 * NEW: Equatorial mount Takahashi telescope marker, large and clearer.
 * Focused on a realistic tube, equatorial axis, mount base, knob, and tripod for better astronomy feel.
 */
type Props = {
  size?: number;
};

const TakahashiMarkerSVG: React.FC<Props> = ({ size = 44 }) => {
  // The SVG is scaled to 58x58 for clarity and size, but size prop scales it for the marker.
  // Colors:
  const blue = "#19a2d6";
  const white = "#fff";
  const focuserBlue = "#236993";
  const dewShieldBlack = "#222";
  const mountMetal = "#b3b8bd";
  const mountShadow = "#788093";
  const tripodLeg = "#8E9196";
  const tripodShade = "#585b60";
  const equatorialAxis = "#B9BEC9";
  const mountKnob = "#44464d";
  const mountBase = "#dfdfeb";
  const shadow = "#222638";

  return (
    <svg width={size} height={size} viewBox="0 0 58 58" fill="none">
      {/* Tripod legs */}
      <rect x="13" y="41" width="5.5" height="16" rx="2.5" fill={tripodLeg} />
      <rect x="40" y="41" width="5.5" height="16" rx="2.5" fill={tripodLeg} />
      {/* Center leg with a little tilt for realism */}
      <rect
        x="24.5"
        y="43"
        width="7"
        height="15"
        rx="2.7"
        fill={tripodShade}
        transform="rotate(-4 28 50.5)"
      />
      {/* Mount base */}
      <ellipse
        cx="29"
        cy="44"
        rx="10"
        ry="4.2"
        fill={mountBase}
        stroke={mountShadow}
        strokeWidth="1.1"
        opacity="0.89"
      />
      {/* Equatorial axis */}
      <rect
        x="26.4"
        y="21.5"
        width="5.2"
        height="24"
        rx="2.2"
        fill={equatorialAxis}
        transform="rotate(-21 29 33.5)"
        opacity="0.92"
      />
      {/* Mount knob */}
      <ellipse
        cx="25.7"
        cy="37"
        rx="2.1"
        ry="2.7"
        fill={mountKnob}
        opacity="0.77"
        transform="rotate(-19 26 37)"
      />
      {/* Main tube */}
      <rect
        x="6"
        y="16"
        width="33"
        height="10.3"
        rx="5.2"
        fill={white}
        stroke="#cce3ef"
        strokeWidth="1"
      />
      {/* Blue front ring */}
      <rect
        x="6"
        y="16"
        width="4.4"
        height="10.3"
        rx="2.2"
        fill={blue}
        opacity="0.93"
      />
      {/* Black dew shield at the left (front) */}
      <rect
        x="0.5"
        y="17.2"
        width="8.2"
        height="8"
        rx="3.2"
        fill={dewShieldBlack}
      />
      {/* Rear blue focuser */}
      <rect
        x="34.2"
        y="18.2"
        width="8.9"
        height="7"
        rx="2.8"
        fill={focuserBlue}
      />
      {/* Eyepiece */}
      <ellipse
        cx="45.5"
        cy="21.9"
        rx="2.1"
        ry="2.9"
        fill={dewShieldBlack}
        opacity="0.72"
      />
      {/* Outline */}
      <rect
        x="6"
        y="16"
        width="33"
        height="10.3"
        rx="5.2"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
      />
      {/* Mount base center post */}
      <ellipse
        cx="29"
        cy="44"
        rx="3.9"
        ry="1.4"
        fill={shadow}
        opacity="0.38"
      />
      {/* Shadow, elliptical under telescope */}
      <ellipse
        cx="29"
        cy="57"
        rx="16"
        ry="3.1"
        fill="#000"
        opacity="0.18"
      />
    </svg>
  );
};

export default TakahashiMarkerSVG;
