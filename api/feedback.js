import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth }                       from 'firebase-admin/auth';
import { getFirestore, FieldValue }      from 'firebase-admin/firestore';

function getFirebaseServices() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  }

  return {
    auth: getAuth(),
    db: getFirestore(),
  };
}

function getRequestBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return req.body;
}

function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (typeof header !== 'string') return '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : '';
}

function normaliseOptionalString(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const body = getRequestBody(req);
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body.' });
  }

  const message = normaliseOptionalString(body.message, 2000);
  const contact = normaliseOptionalString(body.contact, 200);
  const gameId = normaliseOptionalString(body.gameId, 100).toLowerCase();

  if (!message) {
    return res.status(400).json({ error: 'Feedback message is required.' });
  }

  try {
    const { auth, db } = getFirebaseServices();
    const decodedToken = await auth.verifyIdToken(token);

    const payload = {
      message,
      contact: contact || null,
      userId: decodedToken.uid,
      userEmail: decodedToken.email || null,
      createdAt: FieldValue.serverTimestamp(),
    };

    if (gameId) {
      payload.gameId = gameId;
    }

    const ref = await db.collection('feedback').add(payload);
    return res.status(200).json({ ok: true, id: ref.id });
  } catch (error) {
    if (error && typeof error.code === 'string' && error.code.startsWith('auth/')) {
      return res.status(401).json({ error: 'Authentication failed.' });
    }
    console.error('[feedback] Request failed:', error);
    return res.status(500).json({ error: 'Server error — please try again.' });
  }
}
