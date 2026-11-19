const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// video/ es el proyecto de Remotion, con su propio node_modules. Si Metro lo indexa, mezcla dependencias.
const carpetaVideo = path.resolve(__dirname, 'video').replace(/[/\\]/g, '[/\\\\]');
config.resolver.blockList = [new RegExp(`^${carpetaVideo}([/\\\\].*)?$`)];

module.exports = withNativeWind(config, { input: './src/global.css' });
