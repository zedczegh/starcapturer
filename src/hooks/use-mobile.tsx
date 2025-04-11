
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  const mqlRef = React.useRef<MediaQueryList | null>(null)

  React.useEffect(() => {
    // Initialize with current window state
    const initialState = window.innerWidth < MOBILE_BREAKPOINT
    setIsMobile(initialState)
    
    // Create media query list and store in ref for cleanup
    mqlRef.current = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }
    
    // Use the appropriate event listener based on browser support
    mqlRef.current.addEventListener("change", onChange)
    
    // Cleanup
    return () => {
      if (mqlRef.current) {
        mqlRef.current.removeEventListener("change", onChange)
      }
    }
  }, [])

  // Return boolean with definite type (not undefined)
  return !!isMobile
}

// Export a hook that gets window dimensions for more precise controls
export function useWindowSize() {
  const [windowSize, setWindowSize] = React.useState({
    width: 0,
    height: 0,
  });

  React.useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Add event listener
    window.addEventListener("resize", handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures effect runs only on mount and unmount

  return windowSize;
}
