import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import config from "../../firebase-applet-config.json";

const app = initializeApp({
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Get Firestore instance using getFirestore with optional custom databaseId
export const db = getFirestore(app, config.firestoreDatabaseId || "(default)");
