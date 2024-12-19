const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: ['@ui-kitten/components']
    }
  }, argv);

  // Add rule for handling SVG files
  config.module.rules.push({
    test: /\.svg$/,
    use: ['@svgr/webpack']
  });

  // Customize the config for web platform
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native$': 'react-native-web',
    'react-native-svg': 'react-native-svg-web'
  };

  // Customize the config before returning it.
  return config;
};
