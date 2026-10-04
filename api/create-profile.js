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

function normalizeDisplayName(raw) {
  return String(raw || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function isValidDisplayName(raw) {
  const trimmed = String(raw || '').trim();
  if (trimmed.length < 2 || trimmed.length > 24) return false;
  // Letters (incl. basic accented), digits, spaces, underscore, hyphen — geen URL-onveilige tekens.
  return /^[\p{L}\p{N} _-]+$/u.test(trimmed);
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

  const { idToken, displayName } = req.body || {};

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

  const uid = decoded.uid;
  const email = decoded.email || null;

  if (!isValidDisplayName(displayName)) {
    res.status(400).json({ success: false, error: 'Displaynaam moet 2-24 tekens zijn (letters, cijfers, spatie, - of _)' });
    return;
  }

  const trimmedName = String(displayName).trim();
  const normalized = normalizeDisplayName(trimmedName);

  const db = admin.firestore();
  const userRef = db.collection('users').doc(uid);
  const nameRef = db.collection('displayNames').doc(normalized);

  try {
    const result = await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);

      // Idempotent: als het profiel al bestaat (bv. een herhaalde aanroep
      // na een eerdere netwerkfout), niet opnieuw aanmaken of de
      // displayName-check herhalen — gewoon de bestaande data teruggeven.
      if (userSnap.exists) {
        return { alreadyExisted: true, data: userSnap.data() };
      }

      const nameSnap = await tx.get(nameRef);
      if (nameSnap.exists) {
        throw new Error('DISPLAYNAME_TAKEN');
      }

      const now = admin.firestore.FieldValue.serverTimestamp();
      tx.set(userRef, {
        displayName: trimmedName,
        email: email,
        accountStatus: 'pending-verification',
        createdAt: now,
        updatedAt: now,
      });
      tx.set(nameRef, { uid: uid });

      return { alreadyExisted: false, data: { displayName: trimmedName, accountStatus: 'pending-verification' } };
    });

    res.status(200).json({ success: true, displayName: result.data.displayName, accountStatus: result.data.accountStatus });
  } catch (err) {
    if (err.message === 'DISPLAYNAME_TAKEN') {
      res.status(409).json({ success: false, error: 'Deze displaynaam is al in gebruik' });
      return;
    }
    console.error('create-profile error:', err);
    res.status(500).json({ success: false, error: 'Serverfout, probeer opnieuw' });
  }
};
