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

// Vervangt de rol van het oude, code-gebaseerde check-code.js (dat
// bestand blijft nog even staan maar wordt nergens meer aangeroepen —
// zie README). Identiteit is nu de UID, niet een los clientId. Dit lost
// meteen de twee eerder gevonden gaten op: maxUses wordt nu gehandhaafd,
// en een entitlement is per UID, niet voor altijd geldig na één check.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (initError) {
    res.status(500).json({ success: false, error: 'Firebase-configuratie ontbreekt of is onjuist op Vercel: ' + initError.message });
    return;
  }

  const { idToken, code } = req.body || {};

  if (!idToken || typeof idToken !== 'string') {
    res.status(400).json({ success: false, error: 'Niet ingelogd' });
    return;
  }
  if (!code || typeof code !== 'string') {
    res.status(400).json({ success: false, error: 'Code ontbreekt' });
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
  const normalizedCode = code.trim().toUpperCase();
  const db = admin.firestore();

  try {
    // Eerst het profiel checken, buiten de transactie (geen race-gevoelig
    // gegeven — accountStatus verandert niet tijdens deze aanroep).
    const userSnap = await db.collection('users').doc(uid).get();
    if (!userSnap.exists) {
      res.status(404).json({ success: false, error: 'Profiel niet gevonden' });
      return;
    }
    if (userSnap.data().accountStatus !== 'active') {
      res.status(403).json({ success: false, error: 'Bevestig eerst je e-mailadres voordat je een code kunt invoeren' });
      return;
    }

    const codeRef = db.collection('beta_codes').doc(normalizedCode);

    const result = await db.runTransaction(async (tx) => {
      const codeSnap = await tx.get(codeRef);
      if (!codeSnap.exists) {
        throw new Error('CODE_NOT_FOUND');
      }

      const data = codeSnap.data();

      if (data.status !== 'active') {
        throw new Error('CODE_INACTIVE');
      }
      if (data.expires && typeof data.expires.toDate === 'function' && data.expires.toDate() < new Date()) {
        throw new Error('CODE_EXPIRED');
      }

      const claimedByUids = Array.isArray(data.claimedByUids) ? data.claimedByUids : [];
      const alreadyClaimed = claimedByUids.indexOf(uid) !== -1;

      if (!alreadyClaimed && typeof data.maxUses === 'number' && claimedByUids.length >= data.maxUses) {
        throw new Error('CODE_MAXUSES');
      }

      const games = Array.isArray(data.games) ? data.games : [];

      // Idempotent: als deze UID de code al eerder claimde, niet opnieuw
      // tellen, wel de entitlements (opnieuw) bevestigen.
      if (!alreadyClaimed) {
        tx.update(codeRef, {
          claimedByUids: admin.firestore.FieldValue.arrayUnion(uid),
          lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      const now = admin.firestore.FieldValue.serverTimestamp();
      games.forEach((gameId) => {
        const entitlementRef = db.collection('entitlements').doc(uid).collection('games').doc(gameId);
        tx.set(entitlementRef, {
          source: 'beta',
          status: 'active',
          code: normalizedCode,
          grantedAt: now,
        }, { merge: true });
      });

      return { games };
    });

    res.status(200).json({ success: true, games: result.games });
  } catch (err) {
    const map = {
      CODE_NOT_FOUND: ['Onbekende code', 404],
      CODE_INACTIVE: ['Deze code is niet meer geldig', 403],
      CODE_EXPIRED: ['Deze code is verlopen', 403],
      CODE_MAXUSES: ['Deze code is al het maximum aantal keren gebruikt', 403],
    };
    if (map[err.message]) {
      const [message, status] = map[err.message];
      res.status(status).json({ success: false, error: message });
      return;
    }
    console.error('redeem-beta-code error:', err);
    res.status(500).json({ success: false, error: 'Serverfout, probeer opnieuw' });
  }
};
