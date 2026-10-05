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

// Uitsluitend een UX-check — bepaalt alleen of de beheerlink getoond
// wordt. De ECHTE beveiliging blijft de ORBIT_ADMIN_UIDS-check in
// api/admin-create-code.js zelf; dit endpoint doet verder niets
// gevoeligs en geeft nooit de UID-lijst zelf terug, alleen een
// boolean voor de aanroepende (al bekende) uid.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (initError) {
    res.status(200).json({ isAdmin: false });
    return;
  }

  const { idToken } = req.body || {};

  if (!idToken || typeof idToken !== 'string') {
    res.status(200).json({ isAdmin: false });
    return;
  }

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    res.status(200).json({ isAdmin: false });
    return;
  }

  const adminUidsRaw = process.env.ORBIT_ADMIN_UIDS || '';
  const adminUids = adminUidsRaw.split(',').map((s) => s.trim()).filter(Boolean);

  res.status(200).json({ isAdmin: adminUids.indexOf(decoded.uid) !== -1 });
};
