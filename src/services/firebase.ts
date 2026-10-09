import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signInAnonymously,
  sendPasswordResetEmail,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc,
  getDocFromServer,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  getDocs,
  Unsubscribe 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { logger } from './logger';
import { StudyNote, UserProfile, ComplaintTicket, MistakeItem } from '../types';

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

export function cleanFirestoreData<T extends Record<string, any>>(data: T): Partial<T> {
  const result: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  logger.error('Firebase', `Firestore Operation Failed [${operationType}] at ${path}:`, errInfo);
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// CRITICAL: Database initialized with custom firestoreDatabaseId from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Safe connection check that never crashes or throws on boot
async function testConnection() {
  try {
    // Only attempt when authenticated to respect zero-trust security rules
    if (auth.currentUser) {
      await getDoc(doc(db, 'users', auth.currentUser.uid));
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[FIRESTORE] Client is currently working in offline mode.');
    }
  }
}
setTimeout(testConnection, 2000);

// Check for redirect result on app initialization (e.g. after redirect OAuth)
export async function checkRedirectAuthResult(): Promise<FirebaseUser | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      logger.info('Auth', `[AUTH] Redirect Sign-In completed for: ${result.user.email} (${result.user.uid})`);
      return result.user;
    }
  } catch (error: any) {
    logger.warn('Auth', `[AUTH] Redirect result check notice [${error?.code || 'unknown'}]:`, error?.message);
  }
  return null;
}

// Authentication Helpers with Explicit Diagnostic Logging & Popup / Redirect Resilience
export async function signInWithGoogle(): Promise<FirebaseUser> {
  logger.info('Auth', '[AUTH] Initiating Google Sign-In with popup');
  try {
    const result = await signInWithPopup(auth, googleProvider);
    logger.info('Auth', `[AUTH] Google Sign-In successful for: ${result.user.email} (${result.user.uid})`);
    return result.user;
  } catch (error: any) {
    const code = error?.code || 'auth/unknown';
    logger.error('Auth', `[AUTH] Google Sign-In failed [${code}]:`, error?.message);

    // If popup was blocked by browser or iframe constraints, try redirect fallback
    if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
      try {
        logger.info('Auth', '[AUTH] Popup was blocked or cancelled, attempting signInWithRedirect fallback');
        await signInWithRedirect(auth, googleProvider);
        return new Promise(() => {}); // Wait for page redirect
      } catch (redirectErr: any) {
        logger.warn('Auth', '[AUTH] Redirect fallback notice:', redirectErr?.message);
      }
    }

    if (code === 'auth/unauthorized-domain') {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
      throw new Error(`Domain "${hostname}" is not authorized for OAuth in Firebase Console. Please add "${hostname}" in Firebase Console -> Authentication -> Settings -> Authorized domains.`);
    }
    throw error;
  }
}

export async function signUpWithEmail(
  email: string, 
  password: string, 
  displayName: string, 
  classPreference: string = 'Class 10'
): Promise<FirebaseUser> {
  const cleanEmail = email.trim();
  logger.info('Auth', `[AUTH] Attempting new student registration for: ${cleanEmail}`);
  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    if (displayName) {
      try {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      } catch (pErr) {
        logger.warn('Auth', '[AUTH] Display name update notice:', pErr);
      }
    }
    logger.info('Auth', `[AUTH] User account created successfully: ${cred.user.uid}`);
    
    // Background profile sync: non-blocking so registration never hangs if Firestore is busy
    syncUserProfile(cred.user, classPreference, true).catch((syncErr) => {
      logger.warn('Auth', '[FIRESTORE] Non-blocking initial profile creation catch:', syncErr);
    });

    return cred.user;
  } catch (error: any) {
    const code = error?.code || 'auth/unknown';
    logger.error('Auth', `[AUTH] Registration failed [${code}]:`, error?.message);
    if (code === 'auth/admin-restricted-operation' || error?.message?.includes('admin-restricted-operation')) {
      const err = new Error('Sign-up is restricted by administrator settings in Firebase Console (User account creation is disabled). In Firebase Console -> Authentication -> Settings -> User actions, turn ON "Enable create (sign-up)".');
      (err as any).code = 'auth/admin-restricted-operation';
      throw err;
    }
    throw error;
  }
}

export async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const cleanEmail = email.trim();
  logger.info('Auth', `[AUTH] Attempting email sign-in for: ${cleanEmail}`);
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    logger.info('Auth', `[AUTH] Email sign-in successful: ${cred.user.uid}`);
    return cred.user;
  } catch (error: any) {
    logger.error('Auth', `[AUTH] Email sign-in failed [${error?.code || 'auth/unknown'}]:`, error?.message);
    throw error;
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  const cleanEmail = email.trim();
  logger.info('Auth', `[AUTH] Sending password reset email to: ${cleanEmail}`);
  try {
    await sendPasswordResetEmail(auth, cleanEmail);
    logger.info('Auth', `[AUTH] Password reset email dispatched successfully to: ${cleanEmail}`);
  } catch (error: any) {
    logger.error('Auth', `[AUTH] Password reset dispatch failed [${error?.code || 'auth/unknown'}]:`, error?.message);
    throw error;
  }
}

export async function signInAsGuestStudent(
  studentName: string = 'Guest Student', 
  classPreference: string = 'Class 10'
): Promise<FirebaseUser> {
  logger.info('Auth', '[AUTH] Attempting anonymous guest sign-in');
  try {
    const cred = await signInAnonymously(auth);
    if (studentName) {
      try {
        await updateProfile(cred.user, { displayName: studentName.trim() });
      } catch (pErr) {
        logger.warn('Auth', '[AUTH] Guest display name notice:', pErr);
      }
    }
    logger.info('Auth', `[AUTH] Guest session active: ${cred.user.uid}`);

    // Background profile sync: non-blocking, guest login NEVER fails if Firestore has issues
    syncUserProfile(cred.user, classPreference, true).catch((syncErr) => {
      logger.warn('Auth', '[FIRESTORE] Non-blocking guest profile sync catch:', syncErr);
    });

    return cred.user;
  } catch (error: any) {
    const code = error?.code || 'auth/unknown';
    logger.error('Auth', `[AUTH] Guest sign-in failed [${code}]:`, error?.message);
    if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation' || error?.message?.includes('admin-restricted-operation')) {
      const err = new Error('Guest/Anonymous sign-in is not enabled in Firebase Console. Please enable "Anonymous" under Firebase Console -> Authentication -> Sign-in method, or sign in with Google/Email.');
      (err as any).code = 'auth/admin-restricted-operation';
      throw err;
    }
    throw error;
  }
}

export async function logOut(): Promise<void> {
  try {
    logger.info('Auth', '[AUTH] Signing out user');
    await signOut(auth);
    logger.info('Auth', '[AUTH] User logged out successfully');
  } catch (error) {
    logger.error('Auth', '[AUTH] Failed to sign out', error);
    throw error;
  }
}

// User Profile Operations with Resilient In-Memory & LocalStorage Fallbacks
export function buildFallbackUserProfile(
  user: FirebaseUser, 
  classPreference?: string, 
  acceptedTerms?: boolean
): UserProfile {
  const now = new Date().toISOString();
  const normalizedEmail = (user.email || '').toLowerCase();
  const isAdminEmail = 
    normalizedEmail === 'brainyyybuzz@gmail.com' || 
    normalizedEmail === 'gautamankur0101@gmail.com' || 
    normalizedEmail === 'pathpriya99@gmail.com';

  const defaultDisplayName = user.displayName || (user.email ? user.email.split('@')[0] : (user.isAnonymous ? 'Guest Student' : 'Student Scholar'));

  return {
    id: user.uid,
    displayName: defaultDisplayName,
    email: user.email || '',
    photoURL: user.photoURL || '',
    role: isAdminEmail ? 'admin' : 'student',
    classPreference: classPreference || 'Class 10',
    className: classPreference || 'Class 10',
    acceptedTerms: acceptedTerms ?? true,
    xp: 250,
    streakDays: 1,
    lastActiveDate: now.split('T')[0],
    badges: ['Welcome Scholar'],
    createdAt: now,
    updatedAt: now,
  };
}

export async function syncUserProfile(
  user: FirebaseUser, 
  classPreference?: string, 
  acceptedTerms?: boolean
): Promise<UserProfile> {
  const now = new Date().toISOString();
  const normalizedEmail = (user.email || '').toLowerCase();
  const isAdminEmail = 
    normalizedEmail === 'brainyyybuzz@gmail.com' || 
    normalizedEmail === 'gautamankur0101@gmail.com' || 
    normalizedEmail === 'pathpriya99@gmail.com';

  const cacheKey = `bb_user_profile_${user.uid}`;
  const fallbackProfile = buildFallbackUserProfile(user, classPreference, acceptedTerms);

  // Restore cached profile from localStorage if present
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      Object.assign(fallbackProfile, parsed);
    }
  } catch (_) {}

  const userRef = doc(db, 'users', user.uid);

  try {
    logger.info('Firebase', `[FIRESTORE] Fetching profile for uid: ${user.uid}`);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const initialProfile: Record<string, any> = {
        id: user.uid,
        displayName: fallbackProfile.displayName,
        email: user.email || '',
        photoURL: user.photoURL || '',
        role: isAdminEmail ? 'admin' : 'student',
        classPreference: classPreference || fallbackProfile.classPreference || 'Class 10',
        className: classPreference || fallbackProfile.className || 'Class 10',
        acceptedTerms: acceptedTerms ?? fallbackProfile.acceptedTerms ?? true,
        xp: fallbackProfile.xp || 250,
        streakDays: fallbackProfile.streakDays || 1,
        lastActiveDate: now.split('T')[0],
        badges: fallbackProfile.badges || ['Welcome Scholar'],
        createdAt: now,
        updatedAt: now,
      };
      if (acceptedTerms) {
        initialProfile.onboardedAt = now;
      }
      const cleaned = cleanFirestoreData(initialProfile);
      // Use setDoc with merge: true so it creates or merges safely
      await setDoc(userRef, cleaned, { merge: true });
      logger.info('Firebase', `[FIRESTORE] Successfully created profile document for ${user.uid}`);
      const createdProfile = { ...fallbackProfile, ...cleaned } as UserProfile;
      try { localStorage.setItem(cacheKey, JSON.stringify(createdProfile)); } catch (_) {}
      return createdProfile;
    } else {
      const existing = userDoc.data() as UserProfile;
      const updates: Record<string, any> = {
        displayName: user.displayName || existing.displayName || fallbackProfile.displayName,
        photoURL: user.photoURL || existing.photoURL || '',
        updatedAt: now,
        lastActiveDate: now.split('T')[0],
      };
      if (classPreference && (!existing.classPreference || existing.classPreference === 'Class 10')) {
        updates.classPreference = classPreference;
        updates.className = classPreference;
      }
      if (acceptedTerms !== undefined) {
        updates.acceptedTerms = acceptedTerms;
        if (acceptedTerms && !existing.onboardedAt) {
          updates.onboardedAt = now;
        }
      }
      if (isAdminEmail && existing.role !== 'admin') {
        updates.role = 'admin';
      }
      const cleanedUpdates = cleanFirestoreData(updates);
      // setDoc with merge: true avoids "no document to update" errors
      await setDoc(userRef, cleanedUpdates, { merge: true });
      const mergedProfile = { ...existing, ...cleanedUpdates };
      try { localStorage.setItem(cacheKey, JSON.stringify(mergedProfile)); } catch (_) {}
      logger.info('Firebase', `[FIRESTORE] Profile refreshed for ${user.uid}`);
      return mergedProfile;
    }
  } catch (error: any) {
    // CRITICAL: A Firestore error must never fail login! Return the resilient fallback profile.
    logger.warn('Firebase', `[FIRESTORE] Non-fatal profile sync fallback for ${user.uid}:`, error?.message || error);
    try { localStorage.setItem(cacheKey, JSON.stringify(fallbackProfile)); } catch (_) {}
    return fallbackProfile;
  }
}

export async function updateStudentProfile(
  userId: string,
  details: {
    displayName?: string;
    classPreference?: string;
    className?: string;
    age?: number | string;
    sex?: string;
    mobileNumber?: string;
    email?: string;
    targetExam?: string;
    acceptedTerms?: boolean;
  }
): Promise<UserProfile> {
  const userRef = doc(db, 'users', userId);
  const now = new Date().toISOString();
  const cacheKey = `bb_user_profile_${userId}`;

  let currentProfile: Partial<UserProfile> = {};
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) currentProfile = JSON.parse(cached);
  } catch (_) {}

  const updates: Record<string, any> = {
    ...details,
    updatedAt: now,
    onboardedAt: now,
    acceptedTerms: true,
  };
  if (details.classPreference && !details.className) {
    updates.className = details.classPreference;
  }
  const cleaned = cleanFirestoreData(updates);

  try {
    // setDoc with merge: true works whether document exists or not!
    await setDoc(userRef, cleaned, { merge: true });
    logger.info('User', `Updated student onboarding profile in Firestore for ${userId}`);
  } catch (error) {
    logger.warn('User', `Firestore write deferred for ${userId} (offline or security notice):`, error);
  }

  const merged = { ...currentProfile, ...cleaned, id: userId } as UserProfile;
  try { localStorage.setItem(cacheKey, JSON.stringify(merged)); } catch (_) {}
  return merged;
}

export function subscribeToUserProfile(userId: string, callback: (profile: UserProfile | null) => void): Unsubscribe {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(
    userRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const profile = docSnap.data() as UserProfile;
        try { localStorage.setItem(`bb_user_profile_${userId}`, JSON.stringify(profile)); } catch (_) {}
        callback(profile);
      }
    },
    (error) => {
      logger.warn('Firebase', `Profile subscription notice for ${userId}: ${error.message}`);
      // Do NOT set profile to null on snapshot error! Preserves local profile state.
    }
  );
}

// Note Operations
export async function saveStudyNote(note: Omit<StudyNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const noteId = `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const noteDoc = doc(db, 'notes', noteId);
  const noteData: StudyNote = {
    ...note,
    id: noteId,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const cleanedNote = cleanFirestoreData(noteData);
    await setDoc(noteDoc, cleanedNote);
    logger.info('Notes', `Saved study note ${noteId}: ${note.title}`);
    return noteId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `notes/${noteId}`);
    throw error;
  }
}

export async function deleteStudyNote(noteId: string): Promise<void> {
  const noteDoc = doc(db, 'notes', noteId);
  try {
    await deleteDoc(noteDoc);
    logger.info('Notes', `Deleted note ${noteId}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `notes/${noteId}`);
    throw error;
  }
}

export function subscribeToStudyNotes(callback: (notes: StudyNote[]) => void, classGradeFilter?: string): Unsubscribe {
  const notesCol = collection(db, 'notes');
  let q = query(notesCol, limit(50));
  if (classGradeFilter && classGradeFilter !== 'All') {
    q = query(notesCol, where('classGrade', '==', classGradeFilter), limit(50));
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const notes: StudyNote[] = [];
      snapshot.forEach((doc) => {
        notes.push(doc.data() as StudyNote);
      });
      // Sort newest first in memory
      notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(notes);
    },
    (error) => {
      logger.warn('Firebase', `Study notes subscription notice: ${error.message}`);
      callback([]);
    }
  );
}

// Complaint Operations
export async function submitComplaint(
  ticket: Omit<ComplaintTicket, 'id' | 'ticketId' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ticketRefId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
  const complaintId = `comp_${Date.now()}`;
  const now = new Date().toISOString();
  const complaintDoc = doc(db, 'complaints', complaintId);

  const fullComplaint: ComplaintTicket = {
    ...ticket,
    id: complaintId,
    ticketId: ticketRefId,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  try {
    const cleanedComplaint = cleanFirestoreData(fullComplaint);
    await setDoc(complaintDoc, cleanedComplaint);
    logger.info('Complaint', `Logged complaint ${ticketRefId} by ${ticket.userEmail}`);
    return ticketRefId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `complaints/${complaintId}`);
    throw error;
  }
}

export async function updateComplaintStatus(
  complaintId: string, 
  status: 'pending' | 'in_review' | 'resolved', 
  adminNotes?: string
): Promise<void> {
  const complaintDoc = doc(db, 'complaints', complaintId);
  const now = new Date().toISOString();
  try {
    await updateDoc(complaintDoc, {
      status,
      adminNotes: adminNotes || '',
      updatedAt: now,
    });
    logger.info('Complaint', `Updated complaint ${complaintId} status to ${status}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `complaints/${complaintId}`);
    throw error;
  }
}

export function subscribeToComplaints(callback: (complaints: ComplaintTicket[]) => void): Unsubscribe {
  if (!auth.currentUser) {
    callback([]);
    return () => {};
  }

  const complaintsCol = collection(db, 'complaints');
  const q = query(complaintsCol, limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const complaints: ComplaintTicket[] = [];
      snapshot.forEach((doc) => {
        complaints.push(doc.data() as ComplaintTicket);
      });
      complaints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(complaints);
    },
    (error) => {
      logger.warn('Firebase', `Complaints subscription notice: ${error.message}`);
      callback([]);
    }
  );
}

// Gamification XP & Badge operations
export async function awardStudentXP(userId: string, points: number, badgeName?: string): Promise<number> {
  const userRef = doc(db, 'users', userId);
  const cacheKey = `bb_user_profile_${userId}`;
  let newXp = points;
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      newXp = (data.xp || 0) + points;
      const updates: Record<string, any> = { xp: newXp, updatedAt: new Date().toISOString() };
      if (badgeName && (!data.badges || !data.badges.includes(badgeName))) {
        updates.badges = [...(data.badges || []), badgeName];
      }
      await updateDoc(userRef, updates);
    }
  } catch (err) {
    logger.warn('Gamification', '[FIRESTORE] Local XP fallback cache updated:', err);
  }
  // LocalStorage update
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const p = JSON.parse(cached);
      p.xp = (p.xp || 0) + points;
      if (badgeName && (!p.badges || !p.badges.includes(badgeName))) {
        p.badges = [...(p.badges || []), badgeName];
      }
      localStorage.setItem(cacheKey, JSON.stringify(p));
    }
  } catch (_) {}
  return newXp;
}

// Mistake Book Operations (Firestore + LocalStorage resilient)
export async function saveMistake(mistake: Omit<MistakeItem, 'id' | 'timestamp' | 'resolved'>): Promise<string> {
  const mistakeId = `mst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const fullMistake: MistakeItem = {
    ...mistake,
    id: mistakeId,
    timestamp: now,
    resolved: false,
  };

  const localKey = `bb_mistakes_${mistake.userId}`;
  try {
    const raw = localStorage.getItem(localKey);
    const list: MistakeItem[] = raw ? JSON.parse(raw) : [];
    list.unshift(fullMistake);
    localStorage.setItem(localKey, JSON.stringify(list.slice(0, 200)));
  } catch (_) {}

  try {
    const mistakeDoc = doc(db, 'mistakes', mistakeId);
    await setDoc(mistakeDoc, cleanFirestoreData(fullMistake));
    logger.info('Mistakes', `[FIRESTORE] Saved mistake ${mistakeId} for student ${mistake.userId}`);
  } catch (err) {
    logger.warn('Mistakes', `[FIRESTORE] Saved mistake to local storage fallback:`, err);
  }
  return mistakeId;
}

export function getLocalMistakes(userId: string): MistakeItem[] {
  try {
    const raw = localStorage.getItem(`bb_mistakes_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

export function resolveLocalMistake(userId: string, mistakeId: string): void {
  try {
    const localKey = `bb_mistakes_${userId}`;
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const list: MistakeItem[] = JSON.parse(raw);
      const updated = list.map(m => m.id === mistakeId ? { ...m, resolved: true } : m);
      localStorage.setItem(localKey, JSON.stringify(updated));
    }
  } catch (_) {}
}

