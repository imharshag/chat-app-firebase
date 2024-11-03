// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyDXxCA4eqYEuvSbYzfX_UtFNV0M-tVF6Ok",
    authDomain: "medical-ai-7bfcd.firebaseapp.com",
    projectId: "medical-ai-7bfcd",
    storageBucket: "medical-ai-7bfcd.firebasestorage.app",
    messagingSenderId: "811843705703",
    appId: "1:811843705703:web:0610efaccfc7480cfbadc2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const provider = new GoogleAuthProvider();

export { auth, firestore, provider };
