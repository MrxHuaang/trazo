const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// La carpeta video/ es un proyecto aparte (Remotion) con sus propias dependencias: Metro no debe verla.
const carpetaVideo = path.resolve(__dirname, 'video').replace(/[/\\]/g, '[/\\\\]');
config.resolver.blockList = [new RegExp(`^${carpetaVideo}([/\\\\].*)?$`)];

module.exports = withNativeWind(config, { input: './src/global.css' });
