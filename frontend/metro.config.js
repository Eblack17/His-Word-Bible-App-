const { getDefaultConfig } = require('expo/metro-config');
const { resolver: { sourceExts, assetExts } } = getDefaultConfig(__dirname);

module.exports = getDefaultConfig(__dirname, {
  // Add additional configuration options here
  resolver: {
    assetExts: [...assetExts, 'svg'],
    sourceExts: [...sourceExts, 'svg'],
  },
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  },
});
