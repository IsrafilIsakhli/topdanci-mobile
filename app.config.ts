import type { ExpoConfig } from 'expo/config';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';
const localHttpApi = /^http:\/\/(?:localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(apiBaseUrl);

const config: ExpoConfig = {
  name: 'TopdanBazar',
  slug: 'topdanbazar-mobile',
  scheme: 'topdanbazar',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  icon: './assets/images/icon.png',
  ios: { bundleIdentifier: 'az.topdanbazar.mobile', supportsTablet: true,
    infoPlist: localHttpApi ? {
      NSLocalNetworkUsageDescription: 'TopdanBazar tətbiqinin lokal sınaq API-sinə qoşulması üçün şəbəkə icazəsi lazımdır.',
      NSAppTransportSecurity: { NSAllowsLocalNetworking: true },
    } : {},
  },
  android: {
    package: 'az.topdanbazar.mobile',
    ...(process.env.GOOGLE_SERVICES_FILE ? { googleServicesFile: process.env.GOOGLE_SERVICES_FILE } : {}),
    adaptiveIcon: { foregroundImage: './assets/images/android-icon-foreground.png', backgroundColor: '#064e3b' },
  },
  plugins: ['expo-notifications', 'expo-router', 'expo-secure-store', './plugins/with-android-dev-support.cjs',
    ['expo-build-properties', { android: { usesCleartextTraffic: localHttpApi } }],
    ['expo-image-picker', { photosPermission: 'Məhsul və mağaza şəkillərini seçmək üçün qalereyaya giriş lazımdır.' }],
    ['expo-splash-screen', { image: './assets/images/splash-icon.png', backgroundColor: '#064e3b', imageWidth: 160 }]],
  experiments: { typedRoutes: false },
  extra: { apiBaseUrl, ...(process.env.EXPO_PUBLIC_EAS_PROJECT_ID ? { eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID } } : {}) },
};

export default config;
