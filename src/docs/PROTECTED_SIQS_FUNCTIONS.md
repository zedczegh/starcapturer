
# Protected SIQS Functions

## Overview

This document describes the protected SIQS (Stellar Imaging Quality Score) calculation functions that are critical to the application's functionality. These functions should not be modified without thorough testing and validation.

## Why Protection is Needed

The SIQS calculation is a core feature of our application that many components depend on. Changes to these functions can have widespread effects and potentially break functionality across multiple components.

## Protected Functions

The following functions are protected and should not be modified without thorough testing:

- `getSiqsScore()`: Safely extracts a numeric SIQS score from various input formats
- `normalizeToSiqsScale()`: Ensures a SIQS score is properly normalized to the 0-10 scale
- `formatSiqsForDisplay()`: Formats a SIQS score for display
- `formatSiqsScore()`: Combines getSiqsScore and formatSiqsForDisplay
- `isSiqsAtLeast()`: Compares a SIQS value to a threshold (>=)
- `isSiqsGreaterThan()`: Compares a SIQS value to a threshold (>)
- `sortLocationsBySiqs()`: Sorts locations by their SIQS scores

## How Protection is Implemented

1. **Code Freezing**: The functions are frozen using Object.freeze() to prevent runtime modifications
2. **Documentation**: Clear documentation and warnings in the code
3. **Tests**: A comprehensive test suite that must pass before any changes
4. **Re-exporting**: The functions are defined in a protected file and re-exported

## Making Changes (if absolutely necessary)

If changes to these functions are required:

1. Run the existing tests to ensure they pass
2. Make a copy of the functions before modifying them
3. Implement the changes
4. Update the tests to verify the new behavior
5. Run the full application test suite
6. Document why the changes were necessary

## Usage

Always import these functions from the utilities module, never reimplement them:

```typescript
import { getSiqsScore, formatSiqsScore } from '@/utils/siqsHelpers';
```

## Testing

Run the tests for these functions using:

```javascript
window.testCoreSiqsFunctions();
```

or by running the full test suite:

```javascript
window.runAllTests();
```
