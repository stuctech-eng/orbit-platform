const admin = require('firebase-admin');

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

// Genereert een leesbare, voldoende unieke code — geen externe
// dependency nodig. Formaat: ORBIT-XXXX-XXXX (hoofdletters/cijfers,
// geen verwarrende tekens zoals 0/O of 1/I).
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return 'ORBIT-' + part() + '-' + part();
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

  const { idToken, code, maxUses, expires } = req.body || {};

  if (!idToken || typeof idToken !== 'string') {
    res.status(400).json({ success: false, error: 'Niet ingelogd' });
    return;
  }

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    res.status(401).json({ success: false, error: 'Ongeldige of verlopen sessie' });
    return;
  }

  // De enige echte beveiligingslaag — server-side allowlist, nooit
  // client-side vertrouwd. ORBIT_ADMIN_UIDS: kommagescheiden lijst
  // van Firebase Auth UID's in Vercel Environment Variables.
  const adminUidsRaw = process.env.ORBIT_ADMIN_UIDS || '';
  const adminUids = adminUidsRaw.split(',').map((s) => s.trim()).filter(Boolean);

  if (adminUids.indexOf(decoded.uid) === -1) {
    res.status(403).json({ success: false, error: 'Geen toegang' });
    return;
  }

  // Code zelf opgeven (genormaliseerd, zelfde regel als redeem-beta-
  // code.js) of automatisch laten genereren.
  let normalizedCode;
  if (code && typeof code === 'string' && code.trim()) {
    normalizedCode = code.trim().toUpperCase();
  } else {
    normalizedCode = generateCode();
  }

  const docData = {
    status: 'active',
    games: ['orbit'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: decoded.uid,
  };

  if (typeof maxUses === 'number' && maxUses > 0) {
    docData.maxUses = maxUses;
  }
  if (expires && typeof expires === 'string') {
    const expiresDate = new Date(expires);
    if (!isNaN(expiresDate.getTime())) {
      docData.expires = admin.firestore.Timestamp.fromDate(expiresDate);
    }
  }

  const db = admin.firestore();
  const codeRef = db.collection('beta_codes').doc(normalizedCode);

  try {
    const existing = await codeRef.get();
    if (existing.exists) {
      res.status(409).json({ success: false, error: 'Deze code bestaat al — kies een andere of laat leeg om automatisch te genereren' });
      return;
    }

    await codeRef.set(docData);

    res.status(200).json({ success: true, code: normalizedCode });
  } catch (err) {
    console.error('admin-create-code error:', err);
    res.status(500).json({ success: false, error: 'Serverfout, probeer opnieuw' });
  }
};
