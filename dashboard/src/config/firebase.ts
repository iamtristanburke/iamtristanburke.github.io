/**
 * Firebase configuration for Colt Agent
 * 
 * To set up:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Enable Realtime Database
 * 3. Get your config from Project Settings > General > Your apps
 * 4. Set environment variables or use localStorage for config
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';

// Firebase config - can be set via environment variables or localStorage
function getFirebaseConfig() {
  // Try environment variables first (for build time)
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || localStorage.getItem('firebase_api_key');
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localStorage.getItem('firebase_auth_domain');
  const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL || localStorage.getItem('firebase_database_url');
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || localStorage.getItem('firebase_project_id');
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localStorage.getItem('firebase_storage_bucket');
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localStorage.getItem('firebase_messaging_sender_id');
  const appId = import.meta.env.VITE_FIREBASE_APP_ID || localStorage.getItem('firebase_app_id');

  if (!apiKey || !databaseURL) {
    console.warn('Firebase config not found. Please set Firebase environment variables or localStorage values.');
    return null;
  }

  return {
    apiKey,
    authDomain: authDomain || undefined,
    databaseURL,
    projectId: projectId || undefined,
    storageBucket: storageBucket || undefined,
    messagingSenderId: messagingSenderId || undefined,
    appId: appId || undefined,
  };
}

let app: FirebaseApp | null = null;
let database: Database | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (app) {
    return app;
  }

  const config = getFirebaseConfig();
  if (!config) {
    return null;
  }

  // Initialize Firebase only if not already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
  } else {
    try {
      app = initializeApp(config);
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      return null;
    }
  }

  return app;
}

export function getFirebaseDatabase(): Database | null {
  if (database) {
    return database;
  }

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) {
    return null;
  }

  try {
    database = getDatabase(firebaseApp);
    return database;
  } catch (error) {
    console.error('Error getting Firebase database:', error);
    return null;
  }
}

export function setFirebaseConfig(config: {
  apiKey: string;
  authDomain?: string;
  databaseURL: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}): void {
  // Store in localStorage for runtime configuration
  if (config.apiKey) localStorage.setItem('firebase_api_key', config.apiKey);
  if (config.authDomain) localStorage.setItem('firebase_auth_domain', config.authDomain);
  if (config.databaseURL) localStorage.setItem('firebase_database_url', config.databaseURL);
  if (config.projectId) localStorage.setItem('firebase_project_id', config.projectId);
  if (config.storageBucket) localStorage.setItem('firebase_storage_bucket', config.storageBucket);
  if (config.messagingSenderId) localStorage.setItem('firebase_messaging_sender_id', config.messagingSenderId);
  if (config.appId) localStorage.setItem('firebase_app_id', config.appId);

  // Reset app and database to force re-initialization
  app = null;
  database = null;
}

