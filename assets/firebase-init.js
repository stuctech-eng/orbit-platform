// ORBIT Platform — Firebase client-side initialisatie (Fase C)
//
// Dit is de PUBLIEKE web-app config (apiKey hier is geen geheim — hij
// identificeert alleen het Firebase-project, vergelijkbaar met een
// publieke sleutel). De geheime service-account-credentials voor de
// Admin SDK staan nergens in dit bestand en nooit client-side.
//
// Geïmporteerd als ES module door elke pagina die auth/Firestore nodig
// heeft: <script type="module" src="../assets/firebase-init.js"></script>
// of via import { auth, db } from './firebase-init.js' in een eigen
// module-script op de pagina zelf.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyBMPIBE4_cNWbIZqeO1Y0-BY-nQHVceXls",
  authDomain: "orbit-platform-3ec4a.firebaseapp.com",
  projectId: "orbit-platform-3ec4a",
  storageBucket: "orbit-platform-3ec4a.firebasestorage.app",
  messagingSenderId: "33110648267",
  appId: "1:33110648267:web:0234b40f3f56c7b54d824e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth,
  db,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit
};
