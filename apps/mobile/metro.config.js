const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web implementation (the web demo's storage) ships its
// SQLite engine as a .wasm asset.
config.resolver.assetExts.push('wasm');

// expo-sqlite on web needs SharedArrayBuffer, which browsers only expose to
// cross-origin-isolated pages — mirror the headers vercel.json sets in
// production so `expo start --web` behaves the same locally.
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  return middleware(req, res, next);
};

module.exports = config;
