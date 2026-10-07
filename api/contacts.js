const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

let initError = null;
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  }
} catch (err) {
  initError = err;
}

// ORBIT Telefoon — eigen contacten per account. Zelfde vertrouwensmodel
// als api/submit-score.js: het score-token (type "score-session",
// gameId "orbit") bepaalt de uid; de client levert nooit zelf een uid.
// Opslag: contacts/{uid} = { items: [{id, name, number}], updatedAt }.
// Acties: "get" (lezen) en "set" (volledige lijst vervangen).
const MAX_CONTACTS = 1000;      // veiligheidsgrens, ruim boven normaal gebruik
const MAX_NAME_LENGTH = 20;     // zelfde als de game
const NUMBER_PATTERN = /^0\d{9}$/;

function sanitizeItems(items) {
  if (!Array.isArray(items) || items.length > MAX_CONTACTS) return null;
  const seenIds = new Set();
  const seenNumbers = new Set();
  const clean = [];
  for (const it of items) {
    if (!it || typeof it !== 'object') return null;
    const id = it.id, name = it.name, number = it.number;
    if (typeof id !== 'string' || id.length < 1 || id.length > 40) return null;
    if (typeof name !== 'string') return null;
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > MAX_NAME_LENGTH) return null;
    if (typeof number !== 'string' || !NUMBER_PATTERN.test(number)) return null;
    if (seenIds.has(id) || seenNumbers.has(number)) return null;
    seenIds.add(id);
    seenNumbers.add(number);
    clean.push({ id: id, name: trimmed, number: number });
  }
  return clean;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (initError) {
    res.status(500).json({ success: false, error: 'Firebase-configuratie ontbreekt of is onjuist op Vercel: ' + initError.message });
    return;
  }
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    res.status(500).json({ success: false, error: 'ACCESS_TOKEN_SECRET ontbreekt op Vercel' });
    return;
  }

  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const { gameId, action, items } = req.body || {};
  if (!token) {
    res.status(400).json({ success: false, error: 'Token ontbreekt' });
    return;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, error: 'SCORE_TOKEN_EXPIRED' });
    } else {
      res.status(401).json({ success: false, error: 'Ongeldig token' });
    }
    return;
  }
  if (decoded.type !== 'score-session') {
    res.status(403).json({ success: false, error: 'Ongeldig tokentype' });
    return;
  }
  if (!gameId || decoded.gameId !== gameId) {
    res.status(403).json({ success: false, error: 'gameId komt niet overeen met token' });
    return;
  }

  const ref = admin.firestore().collection('contacts').doc(decoded.uid);

  try {
    if (action === 'get') {
      const snap = await ref.get();
      if (!snap.exists) {
        res.status(200).json({ success: true, exists: false, items: [] });
        return;
      }
      const data = snap.data() || {};
      res.status(200).json({ success: true, exists: true, items: Array.isArray(data.items) ? data.items : [] });
      return;
    }
    if (action === 'set') {
      const clean = sanitizeItems(items);
      if (!clean) {
        res.status(400).json({ success: false, error: 'Ongeldige contactenlijst' });
        return;
      }
      await ref.set({ items: clean, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      res.status(200).json({ success: true, count: clean.length });
      return;
    }
    res.status(400).json({ success: false, error: 'Onbekende actie' });
  } catch (err) {
    console.error('contacts error:', err);
    res.status(500).json({ success: false, error: 'Serverfout, probeer opnieuw' });
  }
};
