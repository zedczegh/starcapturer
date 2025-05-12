
# Geocoding Service Backup

This directory contains backup copies of the geocoding services that are working well in production.
These files are preserved to prevent accidental regression or damage during development.

## Files Backed Up:

1. **reverseGeocoding.backup.ts** - Core reverse geocoding functionality
2. **enhancedReverseGeocoding.backup.ts** - Enhanced location details with water detection
3. **LocationNameService.backup.ts** - User-friendly location name resolution
4. **nearestTownCalculator.backup.ts** - Algorithm for finding nearest known towns
5. **locationNameUpdater.backup.ts** - Update location names with proper formatting

## How to Restore

If you need to restore any of these files, simply copy the contents back to their original location.
The original file paths are:

- `src/services/geocoding/reverseGeocoding.ts`
- `src/services/geocoding/enhancedReverseGeocoding.ts`
- `src/components/location/map/LocationNameService.ts`
- `src/utils/nearestTownCalculator.ts`
- `src/lib/locationNameUpdater.ts`

## Important Notes

These files were backed up on 2025-05-08 after fixing various issues with the geocoding system.
The current implementation handles:

- Proper water location detection
- Special handling for remote regions
- Mobile-optimized timeouts
- Enhanced caching for better performance
- Multilingual support (English and Chinese)
- Fallback mechanisms when API calls fail

Do not modify these backup files. If you need to make changes, modify the original files and then update the backups if the changes are stable.
