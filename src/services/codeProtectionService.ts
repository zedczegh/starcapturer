/**
 * Code Protection Service
 * Initializes and manages code protection features
 */

import { initializeIntegrityChecking } from '@/utils/integrityChecker';

/**
 * Initialize all code protection services
 */
export function initializeCodeProtection(): void {
  console.log('Initializing code protection services...');
  
  // Check code integrity
  initializeIntegrityChecking();
  
  // Apply runtime protections
  applyRuntimeProtections();
  
  console.log('Code protection services initialized');
}

/**
 * Apply runtime protections to prevent code tampering
 */
function applyRuntimeProtections(): void {
  // Protect console in production to prevent easy debugging
  if (process.env.NODE_ENV === 'production') {
    try {
      const originalConsole = { ...console };
      
      // Preserve error logging but protect from tampering
      window.console = Object.freeze({
        ...console,
        log: function(...args: any[]) {
          // Filter sensitive logs in production
          if (!args[0]?.toString().includes('SIQS algorithm')) {
            originalConsole.log(...args);
          }
        },
        // Keep error logging intact for debugging
        error: originalConsole.error,
        warn: originalConsole.warn,
      });
    } catch (e) {
      // Silent fail - we don't want to break the app if this fails
    }
  }
  
  // Prevent tampering with Object.freeze
  const originalFreeze = Object.freeze;
  try {
    Object.defineProperty(Object, 'freeze', {
      value: originalFreeze,
      writable: false,
      configurable: false
    });
  } catch (e) {
    // Silent fail
  }
}
