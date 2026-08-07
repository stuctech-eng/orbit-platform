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

  const { message, contact, gameId } = req.body || {};

  if (!message || typeof message !== 'string' || message.trim().length < 3) {
    res.status(400).json({ success: false, error: 'Bericht is te kort' });
    return;
  }

  try {
    await db.collection('feedback').add({
      message: message.trim(),
      contact: contact ? String(contact).trim() : null,
      gameId: gameId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('feedback error:', err);
    res.status(500).json({ success: false, error: 'Serverfout, probeer opnieuw' });
  }
};
