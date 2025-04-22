
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

export const useSpotFormValidation = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  const validateForm = (locationName: string, selectedTypes: string[]): string | null => {
    if (!user) {
      return "You must be logged in to create an astro spot";
    }
    if (!locationName.trim()) {
      return "Location name is required";
    }
    if (!isAdmin && selectedTypes.length === 0) {
      return "Please select at least one location type";
    }
    return null;
  };

  return { validateForm };
};
