
# Project Critical Functionality Warning 🚨

## Calculated and Certified Locations Algorithm

### DO NOT MODIFY WITHOUT CAREFUL REVIEW

The algorithms for calculated and certified locations are **mission-critical** and have undergone extensive refinement. Any changes must be:

1. Thoroughly tested against existing test cases
2. Reviewed by the project maintainers
3. Validated for performance and accuracy

#### Key Components to Protect:
- `src/hooks/photoPoints/useCalculatedLocationsFind.ts`
- `src/services/locationSpotService.ts`
- `src/services/calculatedLocationsService.ts`
- Location details rendering logic in multiple components

#### Potential Risks of Modification:
- Reduced location discovery quality
- Performance degradation
- Incorrect SIQS score calculations
- Broken user experience in location search

**When in doubt, consult the project maintainers before making changes.**
