import { ExpoConfig } from 'expo/config';

const { CONFIG } = require('./config.js');

const config: ExpoConfig = {
  name: CONFIG.appName,
  slug: CONFIG.slug,
  version: CONFIG.version,
  orientation: 'portrait',
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
    permissions: ['FOREGROUND_SERVICE', 'WAKE_LOCK'],
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: CONFIG.androidPackage,
    infoPlist: { UIBackgroundModes: ['audio'] },
  },
};

export default config;
