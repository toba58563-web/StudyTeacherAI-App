import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import config from "../../firebase-applet-config.json";

const app = !getApps().length ? initializeApp(config) : getApp();
export const db = getFirestore(app, (config as any).firestoreDatabaseId || "(default)");

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support all of the features required to enable persistence.');
  } else {
    console.warn('Persistence could not be enabled:', err);
  }
});

export const auth = getAuth(app);
export const storage = getStorage(app);
