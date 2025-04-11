
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Initial check based on window width
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Run initial check
    checkIsMobile()
    
    // Set up event listener for resize
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Use the more modern approach for browser compatibility
    try {
      // Modern browsers
      mql.addEventListener("change", checkIsMobile)
      
      // Cleanup function
      return () => mql.removeEventListener("change", checkIsMobile)
    } catch (e) {
      // Fallback for older browsers
      console.log("Using legacy media query listener")
      
      // @ts-ignore - For older browsers
      mql.addListener(checkIsMobile)
      
      // Cleanup
      return () => {
        // @ts-ignore - For older browsers
        mql.removeListener(checkIsMobile)
      }
    }
  }, [])

  // Default to non-mobile if we can't determine
  return isMobile ?? false
}
