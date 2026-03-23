import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.storify.app',
  appName: 'Storify',
  webDir: 'build',
  plugins: {
    StatusBar: {
      style: 'DEFAULT'
    }
  }
};

export default config;
