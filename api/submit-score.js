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

// Fase H — minimale rondeduur, afgeleid uit de daadwerkelijke Classic-
// engine (INTRO_DELAY 350ms + SCAN_CROSS_DURATION ≥4500ms +
// FEEDBACK_DURATION 500ms), zie het H3/H4-ontwerp. Dit is een
// security ceiling, GEEN gameplay-norm — de server gebruikt dit
// uitsluitend om onmogelijke sprongen te verwerpen, nooit om te
// suggereren wat een "normale" voortgang is.
const MIN_ROUND_SECONDS = 5.35;

// Per modus de velden die een geldig resultaat moet bevatten, en de
// primaire rankingwaarde (hoger = beter voor alle huidige modi, zie
// H2). Geen gedeeld schema — elke modus zijn eigen vocabulaire.
const MODE_FIELDS = {
  classic: ['ladderIndex', 'score'],
  tracking: ['balls', 'errors', 'timeMs'],
  pattern: ['balls', 'errors', 'timeMs'],
  sequence: ['length', 'errors', 'timeMs'],
};

const PRIMARY_FIELD = {
  classic: 'ladderIndex',
  tracking: 'balls',
  pattern: 'balls',
  sequence: 'length',
};

function isValidResult(modeId, result) {
  const fields = MODE_FIELDS[modeId];
  if (!fields) return false;
  for (const f of fields) {
    if (typeof result[f] !== 'number' || !isFinite(result[f]) || result[f] < 0) return false;
  }
  if (('timeMs' in result) && result.timeMs <= 0) return false;
  return true;
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

  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    res.status(500).json({ success: false, error: 'ACCESS_TOKEN_SECRET ontbreekt op Vercel' });
    return;
  }

  // Score-token komt via de Authorization-header (normale fetch) OF
  // via scoreToken in de body (sendBeacon kan geen custom headers
  // zetten — zie Fase H-ontwerp). Beide paden worden hierna identiek
  // geverifieerd; de transportmethode verandert niets aan het
  // vertrouwensmodel, dat zit uitsluitend in de handtekening + "type".
  const authHeader = req.headers['authorization'] || '';
  const headerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const { scoreToken, gameId, modeId, result } = req.body || {};
  const token = headerToken || scoreToken;

  if (!token || typeof token !== 'string') {
    res.status(400).json({ success: false, error: 'Score-token ontbreekt' });
    return;
  }
  if (!gameId || !modeId || !result || typeof result !== 'object') {
    res.status(400).json({ success: false, error: 'Onvolledig verzoek' });
    return;
  }

  let decoded;
  try {
    // exp wordt hier al door jsonwebtoken zelf gecontroleerd —
    // gooit bij een verlopen token, afgevangen in de catch hieronder.
    decoded = jwt.verify(token, secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, error: 'SCORE_TOKEN_EXPIRED' });
    } else {
      res.status(401).json({ success: false, error: 'Ongeldig token' });
    }
    return;
  }

  if (decoded.type !== 'score-session') {
    // Voorkomt expliciet dat een handoff-token (of enig ander token)
    // hier bruikbaar is — nooit afleiden uit afwezigheid van een veld,
    // altijd expliciet op de eigen "type"-claim controleren.
    res.status(403).json({ success: false, error: 'Ongeldig tokentype' });
    return;
  }
  if (decoded.gameId !== gameId) {
    res.status(403).json({ success: false, error: 'gameId komt niet overeen met token' });
    return;
  }
  if (!MODE_FIELDS[modeId]) {
    res.status(400).json({ success: false, error: 'Onbekende modus' });
    return;
  }
  if (!isValidResult(modeId, result)) {
    res.status(400).json({ success: false, error: 'Ongeldig resultaat' });
    return;
  }

  const uid = decoded.uid;
  const db = admin.firestore();
  const primaryField = PRIMARY_FIELD[modeId];
  const newValue = result[primaryField];

  const scoreRef = db.collection('scores').doc(uid).collection('games').doc(gameId).collection('modes').doc(modeId);
  const leaderboardRef = db.collection('leaderboards').doc(gameId + '_' + modeId).collection('entries').doc(uid);
  const userRef = db.collection('users').doc(uid);

  try {
    const outcome = await db.runTransaction(async (tx) => {
      const scoreSnap = await tx.get(scoreRef);
      const existing = scoreSnap.exists ? scoreSnap.data() : null;
      const currentBest = existing ? (existing[primaryField] || 0) : 0;

      // Classic-specifieke, tijdsafhankelijke plausibiliteitscontrole.
      // Uitsluitend gebaseerd op de DOOR DE SERVER GEVERIFIEERDE
      // token-"iat" (decoded.iat, al door jwt.verify gecontroleerd op
      // geldigheid/handtekening) — nooit op een door de client
      // aangeleverd tijdstip. 336 is hier geen apart afgedwongen getal;
      // het volgt vanzelf uit deze formule zodra elapsed zijn maximum
      // (1800s, de token-levensduur) bereikt — een ouder token is dan
      // al door jwt.verify's exp-check geweigerd, hierboven.
      if (modeId === 'classic') {
        const elapsedSeconds = Math.max(0, Math.floor(Date.now() / 1000) - decoded.iat);
        const allowedDelta = Math.floor(elapsedSeconds / MIN_ROUND_SECONDS);
        const delta = newValue - currentBest;
        if (delta > allowedDelta) {
          throw new Error('IMPLAUSIBLE_RESULT');
        }
      } else {
        // Tracking/Patroon/Sequence: per-inzending check, onafhankelijk
        // van de Classic-tijdlogica hierboven — elke modus zijn eigen
        // mechanisme, zoals vastgelegd in H4.
        const minPossibleTime = newValue * MIN_ROUND_SECONDS * 1000;
        if (result.timeMs < minPossibleTime * 0.5) {
          // Royale marge (0.5×) — dit is een ceiling, geen precieze
          // gameplaynorm; doel is alleen evident onmogelijke waarden
          // afvangen, nooit een legitieme snelle speler raken.
          throw new Error('IMPLAUSIBLE_RESULT');
        }
      }

      if (newValue <= currentBest) {
        // Geen verbetering — stilletjes niets doen. Dit maakt een
        // dubbele of vertraagde (pending/beacon) inzending vanzelf
        // onschadelijk, zonder aparte de-duplicatielogica (H5).
        return { improved: false };
      }

      const now = admin.firestore.FieldValue.serverTimestamp();
      tx.set(scoreRef, Object.assign({}, result, { achievedAt: now }), { merge: true });

      return { improved: true, now: now };
    });

    if (outcome.improved) {
      // Leaderboard-entry + displayName apart bijwerken, buiten de
      // transactie (displayName verandert zelden, een extra read hier
      // zou de transactie nodeloos zwaarder maken; eventuele, zeer
      // zeldzame veroudering van de weergavenaam op het leaderboard is
      // onschadelijk en wordt bij de eerstvolgende score vanzelf
      // bijgewerkt).
      const userSnap = await userRef.get();
      const displayName = userSnap.exists ? userSnap.data().displayName : 'Speler';

      await leaderboardRef.set(Object.assign({}, result, {
        displayName: displayName,
        achievedAt: admin.firestore.FieldValue.serverTimestamp(),
      }), { merge: true });
    }

    res.status(200).json({ success: true, improved: outcome.improved });
  } catch (err) {
    if (err.message === 'IMPLAUSIBLE_RESULT') {
      res.status(403).json({ success: false, error: 'Resultaat kon niet worden geverifieerd' });
      return;
    }
    console.error('submit-score error:', err);
    res.status(500).json({ success: false, error: 'Serverfout, probeer opnieuw' });
  }
};
