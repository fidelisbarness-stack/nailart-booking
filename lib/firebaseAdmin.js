import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const getAdminApp = () => {
  const existingApp = getApps()[0];
  if (existingApp) return existingApp;

  const serviceAccountValue = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountValue) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
  }

  const serviceAccount = JSON.parse(serviceAccountValue);
  if (typeof serviceAccount.private_key === 'string') {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
};

export const firestore = () => getFirestore(getAdminApp());
export { FieldValue };
