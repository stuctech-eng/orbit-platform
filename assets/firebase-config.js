(function bootstrapFirebaseConfig(global) {
  const env = global.process && global.process.env ? global.process.env : {};
  const configSources = [
    global.__ORBIT_FIREBASE_CONFIG__,
    global.ORBIT_FIREBASE_CONFIG,
    global.__ORBIT_CONFIG__ && global.__ORBIT_CONFIG__.firebase,
    global.__ENV__ && global.__ENV__.firebase,
  ];

  function readString(source, keys) {
    if (!source || typeof source !== 'object') return '';
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return '';
  }

  function resolveValue(keys) {
    for (const source of configSources) {
      const fromConfig = readString(source, keys);
      if (fromConfig) return fromConfig;
    }

    const fromWindow = readString(global, keys);
    if (fromWindow) return fromWindow;

    return readString(env, keys);
  }

  global.__ORBIT_FB_API_KEY__ = resolveValue([
    '__ORBIT_FB_API_KEY__',
    'ORBIT_FB_API_KEY',
    'FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'VITE_FIREBASE_API_KEY',
  ]);

  global.__ORBIT_FB_AUTH_DOMAIN__ = resolveValue([
    '__ORBIT_FB_AUTH_DOMAIN__',
    'ORBIT_FB_AUTH_DOMAIN',
    'FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_AUTH_DOMAIN',
  ]);

  global.__ORBIT_FB_PROJECT_ID__ = resolveValue([
    '__ORBIT_FB_PROJECT_ID__',
    'ORBIT_FB_PROJECT_ID',
    'FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_PROJECT_ID',
  ]);

  global.__ORBIT_FB_CONFIG_READY__ = Boolean(
    global.__ORBIT_FB_API_KEY__ &&
    global.__ORBIT_FB_AUTH_DOMAIN__ &&
    global.__ORBIT_FB_PROJECT_ID__
  );
})(window);
