import { db } from './firebase';
import { collection, doc, getDoc, setDoc, addDoc, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { BookingApplication, BookingApplicationStatus } from './types';

const BOOKING_APPLICATIONS_COLLECTION = 'bookingApplications';

// Function to generate a simple unique key (can use UUID library for stronger keys)
export function generateAccessKey(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Recursively sanitizes an object, replacing `undefined` with `null`.
function sanitizeData(data: any): any {
  if (data === null || data === undefined) {
    return null;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  if (typeof data === 'object' && !(data instanceof Timestamp) && data.constructor === Object) {
    const sanitizedObject: { [key: string]: any } = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];
        sanitizedObject[key] = value === undefined ? null : sanitizeData(value);
      }
    }
    return sanitizedObject;
  }
  return data;
}


export async function createBookingApplication(data: Omit<BookingApplication, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'accessKey'>): Promise<BookingApplication | null> {
  try {
    const sanitizedData = sanitizeData(data);

    // Create a temporary reference to get a new document ID
    const tempDocRef = doc(collection(db, BOOKING_APPLICATIONS_COLLECTION));
    const newId = tempDocRef.id;

    // Prepare the full data object, including the new ID as the accessKey
    const newApplicationData: Omit<BookingApplication, 'id'> = {
      ...sanitizedData,
      accessKey: newId,
      createdAt: Timestamp.now(),
      status: 'Awaiting Confirmation',
    };
    
    // Perform a single `setDoc` operation with the new ID
    await setDoc(doc(db, BOOKING_APPLICATIONS_COLLECTION, newId), newApplicationData);

    // Fetch the newly created document to return it
    const savedDoc = await getDoc(doc(db, BOOKING_APPLICATIONS_COLLECTION, newId));
    if (savedDoc.exists()) {
        const savedData = savedDoc.data() as BookingApplication;
        return { id: savedDoc.id, ...savedData };
    }
    return null;

  } catch (error) {
    console.error("Error creating booking application:", error);
    // It's better to throw the error so the UI can catch the specific message
    throw new Error("Could not create booking application in the database.");
  }
}

export async function getBookingApplication(id: string): Promise<BookingApplication | null> {
  try {
    const docRef = doc(db, BOOKING_APPLICATIONS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as BookingApplication) };
    }
    return null;
  } catch (error) {
    console.error("Error getting booking application by ID:", error);
    return null;
  }
}

export async function updateBookingApplicationStatus(id: string, status: BookingApplicationStatus): Promise<boolean> {
  try {
    const docRef = doc(db, BOOKING_APPLICATIONS_COLLECTION, id);
    await setDoc(docRef, { status: status, updatedAt: Timestamp.now() }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error updating booking application status:", error);
    return false;
  }
}

export async function updateBookingApplication(id: string, data: Partial<BookingApplication>): Promise<boolean> {
  try {
    const docRef = doc(db, BOOKING_APPLICATIONS_COLLECTION, id);
    await setDoc(docRef, { ...data, updatedAt: Timestamp.now() }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error updating booking application:", error);
    return false;
  }
}

export async function getAllBookingApplications(): Promise<BookingApplication[]> {
  try {
    const q = query(collection(db, BOOKING_APPLICATIONS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as BookingApplication) }));
  } catch (error) {
    console.error("Error getting all booking applications:", error);
    return [];
  }
}
