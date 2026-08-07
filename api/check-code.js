const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { code, clientId } = req.body || {};

  if (!code || typeof code !== 'string') {
    res.status(400).json({ valid: false, error: 'Code ontbreekt' });
    return;
  }

  const normalized = code.trim().toUpperCase();

  if (!normalized) {
    res.status(400).json({ valid: false, error: 'Code ontbreekt' });
    return;
  }

  try {
    const ref = db.collection('beta_codes').doc(normalized);
    const snap = await ref.get();

    if (!snap.exists) {
      res.status(404).json({ valid: false, error: 'Onbekende code' });
      return;
    }

    const data = snap.data();

    if (data.status !== 'active') {
      res.status(403).json({ valid: false, error: 'Deze code is niet meer geldig' });
      return;
    }

    if (data.expires && typeof data.expires.toDate === 'function' && data.expires.toDate() < new Date()) {
      res.status(403).json({ valid: false, error: 'Deze code is verlopen' });
      return;
    }

    await ref.update({
      usedBy: admin.firestore.FieldValue.arrayUnion(clientId || 'anonymous'),
      lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ valid: true, games: data.games || [] });
  } catch (err) {
    console.error('check-code error:', err);
    res.status(500).json({ valid: false, error: 'Serverfout, probeer opnieuw' });
  }
};
