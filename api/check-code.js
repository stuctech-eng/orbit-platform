// api/check-code.js — Vercel serverless function
// Checks an invite code against Firebase Firestore.
//
// Environment variables required (set in Vercel project settings):
//   FIREBASE_PROJECT_ID
//   FIREBASE_CLIENT_EMAIL
//   FIREBASE_PRIVATE_KEY   (the full PEM string, newlines as \n)
//
// Firestore document structure expected:
//   beta_codes/{code}
//     status:  "active" | "revoked"
//     games:   ["orbit", ...]
//     expires: Timestamp (optional)
//     usedBy:  string (optional)

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue }      from 'firebase-admin/firestore';

// Lazy-initialise Firebase Admin (safe across Vercel hot-reloads)
function getDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

// Game URL registry — extend as more games are added to the platform
const GAME_URLS = {
  orbit: 'https://orbit-game.vercel.app',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body || {};
  if (typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ valid: false, message: 'No code provided.' });
  }

  const normalised = code.trim().toUpperCase();

  try {
    const db  = getDb();
    const ref = db.collection('beta_codes').doc(normalised);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(200).json({ valid: false, message: 'Code not recognised. Check for typos.' });
    }

    const data = doc.data();

    if (data.status !== 'active') {
      return res.status(200).json({ valid: false, message: 'This code has been revoked.' });
    }

    if (data.expires && data.expires.toDate() < new Date()) {
      return res.status(200).json({ valid: false, message: 'This code has expired.' });
    }

    // Mark as used (non-blocking — don't let a write failure block the user)
    ref.update({ usedBy: data.usedBy || normalised, usedAt: FieldValue.serverTimestamp() })
       .catch(() => {/* fire-and-forget */});

    // Return the first matching game URL (codes can unlock multiple games)
    const games   = Array.isArray(data.games) ? data.games : ['orbit'];
    const gameUrl = GAME_URLS[games[0]] || GAME_URLS.orbit;

    return res.status(200).json({ valid: true, games, gameUrl });

  } catch (err) {
    console.error('[check-code] Firestore error:', err);
    return res.status(500).json({ valid: false, message: 'Server error — please try again.' });
  }
}
