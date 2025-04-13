
# SIQS (Stellar Imaging Quality Score) Algorithm Documentation

## Overview

The SIQS algorithm calculates a score (0-10) that represents the quality of stargazing or astrophotography conditions at a specific location. This document explains the critical components of the algorithm to help maintain its integrity in future code changes.

## Critical Components

### 1. Factor Calculation

The SIQS calculation is based on several environmental factors, each with its own scoring function:

- **Cloud Cover**: Higher cloud cover reduces score (0-100% → 100-0 points)
- **Light Pollution**: Based on Bortle scale (1-9 → 100-0 points)
- **Seeing Conditions**: Atmospheric stability (1-5 → 100-0 points)
- **Wind Speed**: Higher wind reduces score (0-35+ km/h → 100-0 points)
- **Humidity**: Higher humidity reduces score (0-100% → 100-0 points)
- **Moon Phase**: New moon is best (0-1 → 100-0-100 points)
- **Air Quality**: AQI value (0-500+ → 100-0 points)
- **Clear Sky Rate**: Annual clear sky percentage (0-100% → 0-100 points)

Each factor is converted to a 0-100 scale and then weighted.

### 2. Weights

Current factor weights are carefully calibrated based on astronomical research:

```
cloud:          0.27  (most important)
lightPollution: 0.18
seeing:         0.14
wind:           0.09
humidity:       0.09
moon:           0.05
aqi:            0.08
clearSky:       0.10
```

### 3. Night Forecasting

For future forecasts, the algorithm prioritizes nighttime hours (6PM-8AM) because:
- Astronomy happens at night
- Different weather conditions can occur at night vs day

## Implementation Details

The key implementation files are:

- `src/lib/siqs/factors.ts` - Individual factor scoring functions
- `src/lib/calculateSIQS.ts` - Main algorithm implementation
- `src/services/realTimeSiqsService.ts` - Real-time SIQS calculation with caching

## WARNING: Critical Algorithm Protection

When modifying code related to SIQS:

1. **DO NOT** change the factor weights without thorough testing
2. **DO NOT** modify the factor scoring functions without understanding their curves
3. **ALWAYS** validate that changes don't break existing functionality
4. **MAINTAIN** backwards compatibility with existing data

## Visualization

The SIQS score is visualized with color coding:
- 0.0-3.9: Red (Poor conditions)
- 4.0-6.9: Yellow (Good conditions)
- 7.0-10.0: Green (Excellent conditions)

## Testing

When making changes to the SIQS algorithm:
1. Test with known good and bad conditions
2. Verify that the calculated scores match expected outcomes
3. Ensure changes don't break existing visualizations
