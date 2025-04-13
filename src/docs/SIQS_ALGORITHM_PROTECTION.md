
# SIQS Algorithm Protection Guidelines

## Critical Warning

The SIQS (Stellar Imaging Quality Score) algorithm is a scientifically calibrated system that provides accurate assessments of stargazing and astrophotography conditions. **Modifying this algorithm without proper understanding can severely impact its accuracy and reliability.**

## Protected Components

The following components are protected against unintentional modifications:

1. **Factor Scoring Functions** - The mathematical functions that convert environmental measurements into standardized scores
2. **Factor Weights** - The carefully calibrated importance of each environmental factor
3. **Data Validation** - Input validation that ensures reasonable values are used

## Guidelines for Developers

If you need to work with the SIQS algorithm:

1. **DO NOT** modify the core factor calculation functions without expert consultation
2. **DO NOT** change the factor weights without scientific validation
3. **DO USE** the protected interfaces in `protectedFactors.ts` instead of directly accessing `factors.ts`
4. **DO** consult the documentation in `SIQS_ALGORITHM.md` before making any changes
5. **DO** run the full test suite after any modifications

## Modification Process

If algorithm changes are absolutely necessary:

1. Document the scientific basis for the proposed changes
2. Create a test dataset with known inputs and expected outputs
3. Implement changes in a separate branch
4. Validate against historical data
5. Get peer review from a team member familiar with astronomical observation
6. Only then merge changes

## Technical Implementation

The algorithm protection is implemented through:

1. Object freezing to prevent weight modification
2. Input validation with fallbacks for invalid values
3. Redundant score calculation for verification
4. Console warnings when invalid inputs are detected

Remember: The SIQS algorithm's accuracy directly impacts user experience and the reliability of recommendations. Protect its integrity at all costs.
