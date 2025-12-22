
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "nsm-service-quotation",
  "appId": "1:615514836181:web:df62871bc2a5b649b8a65c",
  "storageBucket": "nsm-service-quotation.firebasestorage.app",
  "apiKey": "AIzaSyBYcXzAoNcUhPy_H82yFtfk9ZGinJlWNl4",
  "authDomain": "nsm-service-quotation.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "615514836181"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export { app }; // Export the app instance
