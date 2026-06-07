const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@': './src',
  '@components': './src/components',
  '@screens': './src/screens',
  '@navigation': './src/navigation',
  '@hooks': './src/hooks',
  '@services': './src/services',
  '@types': './src/types',
  '@utils': './src/utils',
  '@constants': './src/constants',
};

module.exports = config;
