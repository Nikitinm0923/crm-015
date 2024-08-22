import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  appId: process.env.REACT_APP_APP_ID,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  messagingSenderId: process.env.REACT_APP_MSG_SENDER_ID,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence);

export { auth, db };
