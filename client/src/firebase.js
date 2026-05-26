import { initializeApp } from "firebase/app";

import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBS4Xg34AhVZSVLAZ_ac9Ez86ilUH62CWc",
  authDomain: "healgo-6f3bd.firebaseapp.com",
  projectId: "healgo-6f3bd",
  storageBucket: "healgo-6f3bd.firebasestorage.app",
  messagingSenderId: "868572034551",
  appId: "1:868572034551:web:e961d8dd4359435be6eaf2",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const provider = new GoogleAuthProvider();
