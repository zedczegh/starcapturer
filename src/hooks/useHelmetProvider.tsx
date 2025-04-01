
import { useEffect, useState } from 'react';

/**
 * A hook to safely handle Helmet rendering and ensure it's only used on the client side
 * This helps prevent react-helmet-async errors like "Cannot read properties of undefined (reading 'add')"
 */
export function useHelmetProvider() {
  const [canUseHelmet, setCanUseHelmet] = useState(false);
  
  useEffect(() => {
    // Only enable Helmet on the client side after component mounts
    setCanUseHelmet(true);
  }, []);
  
  return { canUseHelmet };
}

export default useHelmetProvider;
