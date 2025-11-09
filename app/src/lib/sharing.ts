import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Project, SharingSettings } from '@/types/presentation';

export function generateShareId(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

export async function createShareLink(
  projectId: string,
  userId: string,
  settings: Partial<SharingSettings>
): Promise<string> {
  const shareId = settings.shareId || generateShareId();

  const sharingSettings: SharingSettings = {
    isPublic: true,
    shareId,
    password: settings.password,
    expiresAt: settings.expiresAt,
    allowComments: settings.allowComments ?? true,
    allowDownload: settings.allowDownload ?? true,
  };

  // Update project with sharing settings
  const projectRef = doc(db, 'users', userId, 'projects', projectId);
  await setDoc(projectRef, { sharing: sharingSettings }, { merge: true });

  // Create a shared presentation document
  const sharedRef = doc(db, 'sharedPresentations', shareId);
  await setDoc(sharedRef, {
    projectId,
    userId,
    createdAt: Date.now(),
    settings: sharingSettings,
  });

  return shareId;
}

export async function getSharedPresentation(shareId: string): Promise<{
  project: Project | null;
  settings: SharingSettings | null;
}> {
  const sharedRef = doc(db, 'sharedPresentations', shareId);
  const sharedDoc = await getDoc(sharedRef);

  if (!sharedDoc.exists()) {
    return { project: null, settings: null };
  }

  const sharedData = sharedDoc.data();

  // Check if link has expired
  if (sharedData.settings.expiresAt && sharedData.settings.expiresAt < Date.now()) {
    return { project: null, settings: null };
  }

  // Get the actual project
  const projectRef = doc(db, 'users', sharedData.userId, 'projects', sharedData.projectId);
  const projectDoc = await getDoc(projectRef);

  if (!projectDoc.exists()) {
    return { project: null, settings: null };
  }

  return {
    project: { id: projectDoc.id, ...projectDoc.data() } as Project,
    settings: sharedData.settings,
  };
}

export async function revokeShareLink(projectId: string, userId: string, shareId: string): Promise<void> {
  // Remove sharing settings from project
  const projectRef = doc(db, 'users', userId, 'projects', projectId);
  await setDoc(projectRef, {
    sharing: {
      isPublic: false,
      shareId: null,
    }
  }, { merge: true });

  // Remove shared presentation document
  const sharedRef = doc(db, 'sharedPresentations', shareId);
  await setDoc(sharedRef, { deletedAt: Date.now() }, { merge: true });
}

export function generateShareUrl(shareId: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/view/${shareId}`;
  }
  return `/view/${shareId}`;
}

export function validatePassword(enteredPassword: string, actualPassword?: string): boolean {
  if (!actualPassword) return true;
  return enteredPassword === actualPassword;
}
