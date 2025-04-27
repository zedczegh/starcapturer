
// Fix for the Re-exporting a type when 'isolatedModules' is enabled
// The original code had:
// export { SiqsResult, SiqsCalculationOptions };
// We need to change that to:
export type { SiqsResult, SiqsCalculationOptions };
