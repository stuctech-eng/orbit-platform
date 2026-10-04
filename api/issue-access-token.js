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

// Fase D — de ENIGE plek waar een entitlement daadwerkelijk tegen
// Firestore wordt gecontroleerd. De game zelf (stuctech-eng/orbit)
// doet dat nooit — die vertrouwt uitsluitend op het ondertekende
// token dat deze functie uitgeeft. Dit platform is de poortwachter
// bij elke nieuwe "Play ORBIT"-start, niet alleen bij het inwisselen
// van een beta-code.
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

  const { idToken, gameId } = req.body || {};

  if (!idToken || typeof idToken !== 'string') {
    res.status(400).json({ success: false, error: 'Niet ingelogd' });
    return;
  }
  if (!gameId || typeof gameId !== 'string') {
    res.status(400).json({ success: false, error: 'gameId ontbreekt' });
    return;
  }

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    res.status(401).json({ success: false, error: 'Ongeldige of verlopen sessie' });
    return;
  }

  const uid = decoded.uid;
  const db = admin.firestore();

  try {
    // Server-side herverifiëren — nooit vertrouwen op wat de client
    // (games.html) al toont. De UI kan verouderd of gemanipuleerd zijn.
    const userSnap = await db.collection('users').doc(uid).get();
    if (!userSnap.exists || userSnap.data().accountStatus !== 'active') {
      res.status(403).json({ success: false, error: 'Account niet actief — bevestig eerst je e-mailadres' });
      return;
    }

    const entitlementSnap = await db.collection('entitlements').doc(uid).collection('games').doc(gameId).get();
    if (!entitlementSnap.exists || entitlementSnap.data().status !== 'active') {
      res.status(403).json({ success: false, error: 'Geen geldige toegang tot dit spel' });
      return;
    }

    // Bewust kort: 120 seconden, dekt alleen de handoff zelf, niet de
    // hele speelsessie. Symmetrisch secret (HS256) — zie Fase D-addendum
    // voor het expliciet vastgelegde risico en RS256 als toekomstig
    // verbeterpunt.
    const token = jwt.sign({ uid: uid, gameId: gameId }, secret, { expiresIn: '120s' });

    res.status(200).json({ success: true, token: token });
  } catch (err) {
    console.error('issue-access-token error:', err);
    res.status(500).json({ success: false, error: 'Serverfout, probeer opnieuw' });
  }
};
