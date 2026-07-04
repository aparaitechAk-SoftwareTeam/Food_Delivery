// metro.config.js
// Enables symlink resolution so Metro can follow Windows reparse-point
// symlinks inside node_modules (e.g. expo/src/winter/fetch/*).
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Allow Metro to follow symlinks / Windows reparse points.
// Required on Windows when node_modules contains symlinked source files.
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
