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

  if (!isValidDisplayName(displayName)) {
    res.status(400).json({ success: false, error: 'Displaynaam moet 2-24 tekens zijn (letters, cijfers, spatie, - of _)' });
    return;
  }

  const trimmedName = String(displayName).trim();
  const normalized = normalizeDisplayName(trimmedName);

  const db = admin.firestore();
  const userRef = db.collection('users').doc(uid);
  const newNameRef = db.collection('displayNames').doc(normalized);

  try {
    await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new Error('PROFILE_NOT_FOUND');
      }

      const currentName = userSnap.data().displayName;
      const currentNormalized = normalizeDisplayName(currentName);

      // Geen wijziging nodig — zelfde naam opnieuw ingediend.
      if (currentNormalized === normalized) {
        return;
      }

      const newNameSnap = await tx.get(newNameRef);
      if (newNameSnap.exists) {
        throw new Error('DISPLAYNAME_TAKEN');
      }

      const oldNameRef = db.collection('displayNames').doc(currentNormalized);

      // Atomair: oude reservering weg, nieuwe erbij, profiel bijgewerkt —
      // alle drie in dezelfde transactie, zodat een gebruiker nooit
      // tussentijds zonder geldige naam-reservering komt te zitten.
      tx.delete(oldNameRef);
      tx.set(newNameRef, { uid: uid });
      tx.update(userRef, {
        displayName: trimmedName,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    res.status(200).json({ success: true, displayName: trimmedName });
  } catch (err) {
    if (err.message === 'DISPLAYNAME_TAKEN') {
      res.status(409).json({ success: false, error: 'Deze displaynaam is al in gebruik' });
      return;
    }
    if (err.message === 'PROFILE_NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Profiel niet gevonden' });
      return;
    }
    console.error('update-displayname error:', err);
    res.status(500).json({ success: false, error: 'Serverfout, probeer opnieuw' });
  }
};
