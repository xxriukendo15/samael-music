import { ExpoConfig } from 'expo/config';
import { CONFIG } from './config';

const config: ExpoConfig = {
  name: CONFIG.appName,
  slug: CONFIG.slug,
  version: CONFIG.version,
  orientation: 'portrait',
  plugins: [
  [
    'expo-audio',
    {
      enableBackgroundPlayback: true,
    },
  ],
],
  icon: './logo.png',
  userInterfaceStyle: 'dark',
  backgroundColor: CONFIG.colors.background,
  android: {
    package: CONFIG.androidPackage,
    versionCode: Number(process.env.BUILD_NUMBER ?? 1),
    adaptiveIcon: {
      foregroundImage: './logo.png',
      backgroundColor: CONFIG.colors.background,
    },
    permissions: [
  'FOREGROUND_SERVICE',
  'FOREGROUND_SERVICE_MEDIA_PLAYBACK',
  'WAKE_LOCK',
],
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: CONFIG.androidPackage,
    infoPlist: { UIBackgroundModes: ['audio'] },
  },
};

export default config;
