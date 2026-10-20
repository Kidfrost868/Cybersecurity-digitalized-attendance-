/**
 * ============================================================================
 * FIREBASE FIRESTORE CLOUD CONFIGURATION & SETUP GUIDE
 * ============================================================================
 * 
 * Centralized multi-device real-time cloud database configuration for UniPass.
 * Replaces isolated local browser storage (localStorage) with Google Cloud Firestore,
 * enabling real-time sync across student smartphones, rep laptops, and classroom projectors.
 * 
 * ----------------------------------------------------------------------------
 * HOW TO SET UP YOUR OWN FREE FIREBASE PROJECT (Step-by-Step Instructions):
 * ----------------------------------------------------------------------------
 * 1. Visit Google Firebase Console: https://console.firebase.google.com/
 * 2. Click "Add project" (or "Create a project").
 * 3. Enter a project name (e.g. "unipass-cybersecurity") and click "Continue".
 * 4. (Optional) Toggle Google Analytics on or off, then click "Create project".
 * 5. In your new Firebase Project dashboard:
 *    a. Navigate to "Build" -> "Firestore Database" in the left sidebar menu.
 *    b. Click "Create database".
 *    c. Select a cloud region closest to you (e.g. "europe-west2" or "us-central1").
 *    d. Select Security Rules (e.g. "Start in test mode" or apply the provided firestore.rules).
 * 6. Register a Web Application to generate your configuration credentials:
 *    a. Click the Project Settings gear icon ⚙️ (top-left, next to Project Overview).
 *    b. Under the "General" tab, scroll down to "Your apps" and click the Web icon (</>).
 *    c. Enter an App nickname (e.g., "UniPass Web") and click "Register app".
 * 7. Copy the config values and paste them into the CUSTOM_FIREBASE_CONFIG object below!
 * ============================================================================
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
  doc,
  getDoc,
} from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

// ============================================================================
// 🔑 PASTE YOUR FIREBASE CONFIGURATION KEYS HERE IF DEPLOYING OUTSIDE AI STUDIO:
// ============================================================================
export const CUSTOM_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCF9Rdni0SGCUQQfXzd2dI88_2puOok82U",
  authDomain: "commanding-webbing-jz37z.firebaseapp.com",
  projectId: "commanding-webbing-jz37z",
  storageBucket: "commanding-webbing-jz37z.firebasestorage.app",
  messagingSenderId: "563833730704",
  appId: "1:563833730704:web:0163089e1116b6b02e4a15",
  firestoreDatabaseId: "ai-studio-unipasssmartuniv-55ea37a0-7c17-4d61-8510-097896832482",
};

// Priority: Use auto-provisioned AI Studio config if present, or fallback to CUSTOM_FIREBASE_CONFIG
const activeConfig = {
  apiKey: appletConfig?.apiKey || CUSTOM_FIREBASE_CONFIG.apiKey,
  authDomain: appletConfig?.authDomain || CUSTOM_FIREBASE_CONFIG.authDomain,
  projectId: appletConfig?.projectId || CUSTOM_FIREBASE_CONFIG.projectId,
  storageBucket: appletConfig?.storageBucket || CUSTOM_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: appletConfig?.messagingSenderId || CUSTOM_FIREBASE_CONFIG.messagingSenderId,
  appId: appletConfig?.appId || CUSTOM_FIREBASE_CONFIG.appId,
  firestoreDatabaseId: appletConfig?.firestoreDatabaseId || CUSTOM_FIREBASE_CONFIG.firestoreDatabaseId || '(default)',
};

// 1. Initialize Firebase App singleton
export const firebaseApp: FirebaseApp = getApps().length === 0
  ? initializeApp(activeConfig)
  : getApp();

// 2. Initialize Firebase Auth
export const auth: Auth = getAuth(firebaseApp);

// 3. Initialize Cloud Firestore with offline local cache & auto-detect long polling for iframe/proxy environments
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(
    firebaseApp,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
      experimentalAutoDetectLongPolling: true,
    },
    activeConfig.firestoreDatabaseId
  );
} catch {
  firestoreDb = getFirestore(firebaseApp, activeConfig.firestoreDatabaseId);
}

export const db: Firestore = firestoreDb;

// ============================================================================
// STANDARDIZED FIRESTORE ERROR HANDLING (ABAC & Permission Diagnostics)
// ============================================================================
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 4. Validate connection to Firestore on demand
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'system', 'connection_test'));
    return snap.exists();
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn('Firestore is running in offline cache mode.');
    }
    return false;
  }
}
