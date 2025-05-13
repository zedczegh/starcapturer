
// Export the updated, refactored profile utilities
export { 
  ensureUserProfile, 
  upsertUserProfile, 
  fetchUserProfile 
} from './profile/profileCore';

export { 
  uploadAvatar 
} from './profile/avatarUtils';

export {
  saveUserTags,
  fetchUserTags
} from './profile/profileTagUtils';

export type { ProfileData } from './profile/profileCore';

/**
 * Gets the initials from a username or display name
 * @param name The name to extract initials from
 * @returns Up to two characters representing the initials
 */
export const getInitials = (name: string): string => {
  if (!name) return '';
  
  // Split the name by spaces and get the first two parts
  const nameParts = name.trim().split(' ');
  
  if (nameParts.length === 1) {
    // If only one name, return the first character
    return nameParts[0].charAt(0).toUpperCase();
  } else {
    // If multiple names, return the first character of the first and last names
    return (
      nameParts[0].charAt(0).toUpperCase() + 
      nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    );
  }
};
