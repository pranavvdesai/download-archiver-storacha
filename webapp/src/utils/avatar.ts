/**
 * Generates an avatar URL for a given email using UI Avatars service
 * @param email User's email address
 * @returns URL for the avatar image
 */
export const generateAvatarUrl = (email: string): string => {
  const name = email.split('@')[0];
  
  const options = {
    name: encodeURIComponent(name),
    background: '7C3AED',
    color: 'fff',
    size: 150,
  };

  return `https://ui-avatars.com/api/?${Object.entries(options)
    .map(([key, value]) => `${key}=${value}`)
    .join('&')}`;
};
