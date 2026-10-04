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

// Fase C-afspraak: Firebase Auth-user blijft 30 dagen bestaan (dus de
// gebruiker kan in theorie nog inloggen), maar accountStatus='deleted'
// + ingetrokken entitlements blokkeren per direct alle platformtoegang.
// De daadwerkelijke opruiming na 30 dagen (Auth-user + Firestore-data
// definitief verwijderen) is een losse, nog niet gebouwde scheduled job
// — expliciet buiten scope van deze functie, zie docs/changelog.md.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (initError) {
    res.status(500).json({ success: false, error: 'Firebase-configuratie ontbreekt of is onjuist op Vercel: ' + initError.message });
    return;
  }

  const { idToken } = req.body || {};

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
  const db = admin.firestore();

  try {
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      res.status(404).json({ success: false, error: 'Profiel niet gevonden' });
      return;
    }

    const batch = db.batch();

    batch.update(userRef, {
      accountStatus: 'deleted',
      deletionRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Alle entitlements van deze UID per direct intrekken.
    const gamesSnap = await db.collection('entitlements').doc(uid).collection('games').get();
    gamesSnap.forEach((gameDoc) => {
      batch.update(gameDoc.ref, { status: 'revoked' });
    });

    await batch.commit();

    res.status(200).json({ success: true, deletionRequestedAt: new Date().toISOString() });
  } catch (err) {
    console.error('request-account-deletion error:', err);
    res.status(500).json({ success: false, error: 'Serverfout, probeer opnieuw' });
  }
};
