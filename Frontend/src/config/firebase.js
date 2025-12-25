import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAJ1x3hfF5V9wZwq8n2ihON2xZ2Jf2JF6s",
    authDomain: "campus-connect-985d7.firebaseapp.com",
    projectId: "campus-connect-985d7",
    storageBucket: "campus-connect-985d7.firebasestorage.app",
    messagingSenderId: "72976290052",
    appId: "1:72976290052:web:74e77197ef37e7d7860051",
    measurementId: "G-SWYLKY6S7Q"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const storage = getStorage(app);
