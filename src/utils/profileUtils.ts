
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
  uploadBackground
} from './profile/backgroundUtils';

export {
  saveUserTags,
  fetchUserTags
} from './profile/profileTagUtils';

export type { ProfileData } from './profile/profileCore';
