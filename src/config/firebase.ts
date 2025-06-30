import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Parse Firebase config from environment variable
let firebaseConfig: any;
try {
  const configString = import.meta.env.VITE_FIREBASE_CONFIG;
  if (!configString) {
    throw new Error('VITE_FIREBASE_CONFIG environment variable is not set');
  }
  firebaseConfig = JSON.parse(configString);
} catch (error) {
  console.error('Error parsing Firebase config:', error);
  // Fallback configuration - replace with your actual Firebase config
  firebaseConfig = {
    apiKey: "AIzaSyDZxtWzJAAMZTPHQbJ64Huhxt-eVMeC54E",
    authDomain: "summarize-9ce2b.firebaseapp.com",
    projectId: "summarize-9ce2b",
    storageBucket: "summarize-9ce2b.firebasestorage.app",
    messagingSenderId: "57003211858",
    appId: "1:57003211858:web:f7e82b78e25c81b4ec738b"
  };
}

// Validate required config fields
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

if (missingFields.length > 0) {
  console.error('Missing Firebase configuration fields:', missingFields);
  throw new Error(`Missing Firebase configuration fields: ${missingFields.join(', ')}`);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export the config for debugging purposes
export { firebaseConfig };