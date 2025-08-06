const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration for crypto modules
config.resolver.alias = {
  ...config.resolver.alias,
  crypto: 'react-native-get-random-values',
  stream: 'readable-stream',
  buffer: '@craftzdog/react-native-buffer',
};

// Add unstable_enablePackageExports to handle @noble/hashes exports
config.resolver.unstable_enablePackageExports = true;

module.exports = config;