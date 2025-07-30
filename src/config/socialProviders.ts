export interface SocialProvider {
  id: string;
  name: string;
  enabled: boolean;
  icon: string;
}

// Configure social providers here
export const SOCIAL_PROVIDERS: SocialProvider[] = [
  {
    id: 'google',
    name: 'Google',
    enabled: true, // Set to false to disable
    icon: '🌟'
  },
  {
    id: 'github',
    name: 'GitHub', 
    enabled: true, // Set to false to disable
    icon: '🐙'
  },
  {
    id: 'discord',
    name: 'Discord',
    enabled: false, // Set to true to enable
    icon: '🎮'
  }
];

export const getEnabledSocialProviders = (): SocialProvider[] => {
  return SOCIAL_PROVIDERS.filter(provider => provider.enabled);
};