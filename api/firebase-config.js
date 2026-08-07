function readEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function hasAnyConfig(config) {
  return Boolean(config.apiKey || config.authDomain || config.projectId);
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const config = {
    apiKey: readEnv(
      'ORBIT_FB_API_KEY',
      'FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'VITE_FIREBASE_API_KEY'
    ),
    authDomain: readEnv(
      'ORBIT_FB_AUTH_DOMAIN',
      'FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_AUTH_DOMAIN'
    ),
    projectId: readEnv(
      'ORBIT_FB_PROJECT_ID',
      'FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_PROJECT_ID'
    ),
  };

  if (!hasAnyConfig(config)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'Firebase client config is not set yet.' });
  }

  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=300');
  return res.status(200).json(config);
}
