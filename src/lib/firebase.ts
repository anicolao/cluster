// Import the functions you need from the SDKs you need
import { initializeApp } from "@firebase/app";
import { getDatabase } from "@firebase/database";
import { getFirestore } from "@firebase/firestore";
//import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyD8RehkUFLhOZU7gzUVrlbB_dE9fLH40JM",
  authDomain: "cluster-7c384.firebaseapp.com",
  databaseURL: "https://cluster-7c384-default-rtdb.firebaseio.com",
  projectId: "cluster-7c384",
  storageBucket: "cluster-7c384.appspot.com",
  messagingSenderId: "311902599737",
  appId: "1:311902599737:web:cbeaebcd033f6770a1ebe8",
  measurementId: "G-HZRX1LJR44",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const firestore = getFirestore();
export const realtimeDB = getDatabase(app);
//const analytics = getAnalytics(app);
