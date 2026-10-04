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

// Idempotent, veilig om bij elke login/elke pagina-load opnieuw aan te
// roepen. accountStatus is een platform-registratie van de lifecycle-
// fase (Fase B/C-afspraak) — Firebase Auth zelf blijft de bron van
// waarheid over of de e-mail geverifieerd is; deze functie synchroniseert
// dat alleen naar users/{uid}.accountStatus.
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
    decoded = await admin.auth().verifyIdToken(idToken, /* checkRevoked */ true);
  } catch (err) {
    res.status(401).json({ success: false, error: 'Ongeldige of verlopen sessie' });
    return;
  }

  const uid = decoded.uid;

  try {
    // Bron van waarheid: de Auth-user zelf, niet alleen de token-claim
    // (die kan iets ouder zijn dan de daadwerkelijke verificatiestatus).
    const authUser = await admin.auth().getUser(uid);
    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      res.status(404).json({ success: false, error: 'Profiel niet gevonden — eerst registreren' });
      return;
    }

    const data = snap.data();

    if (authUser.emailVerified && data.accountStatus === 'pending-verification') {
      await userRef.update({
        accountStatus: 'active',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      res.status(200).json({ success: true, accountStatus: 'active' });
      return;
    }

    res.status(200).json({ success: true, accountStatus: data.accountStatus, emailVerified: authUser.emailVerified });
  } catch (err) {
    console.error('confirm-verification error:', err);
    res.status(500).json({ success: false, error: 'Serverfout, probeer opnieuw' });
  }
};
