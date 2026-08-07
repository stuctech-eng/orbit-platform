function readEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
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

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(config);
}
