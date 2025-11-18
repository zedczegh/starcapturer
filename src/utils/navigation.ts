import { NavigateFunction } from 'react-router-dom';

/**
 * Navigate to a user's profile, automatically redirecting to /profile if it's the current user
 */
export const navigateToUserProfile = (
  navigate: NavigateFunction,
  targetUserId: string,
  currentUserId: string | undefined
) => {
  if (currentUserId && targetUserId === currentUserId) {
    navigate('/profile');
  } else {
    navigate(`/user/${targetUserId}`);
  }
};
