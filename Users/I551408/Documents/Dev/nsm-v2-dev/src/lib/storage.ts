

import type { Quote, UserProfile, Operation, Part, CatalogueOperation, CataloguePart, Checklist, BoatBrand, BoatRange, BoatModel, DealerFitCategory, DealerFitPart, Kit, KitStatus, ServiceItem, KitStatusHistoryItem, DiagnosticReport, CatalogueMotor, RiggingKit, CatalogueTrailer, ColorOption, KeyDocument, BMTQuote, Propeller, FactoryOption, FactoryOptionCategory, DealerFitBrand, DealerFitKit, SyncAuditLog, CrmCredentials } from './types';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, query, orderBy, where, writeBatch, deleteDoc, updateDoc, limit, addDoc, runTransaction, Timestamp } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadString, getDownloadURL, deleteObject, uploadBytes } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import { compressImage } from '@/lib/utils';


// Initialize Storage
const storage = getStorage();

export const getQuotes = async (): Promise<Quote[]> => {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const quotesCollection = collection(db, 'quotes');
    const q = query(quotesCollection);
    const querySnapshot = await getDocs(q);
    const quotes = querySnapshot.docs.map(doc => doc.data() as Quote).filter(quote => quote.status !== 'Deleted');
    
    // Sort quotes by date in descending order (newest first)
    quotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return quotes;
  } catch (e) {
    console.error("Failed to fetch quotes from Firestore", e);
    // Return empty array but also toast an error to the user?
    // For now, let the caller handle UI feedback.
    return [];
  }
};

export const getQuoteById = async (id: string): Promise<Quote | undefined> => {
    if (typeof window === 'undefined') return undefined;
    
    try {
        const quoteDocRef = doc(db, 'quotes', id);
        const docSnap = await getDoc(quoteDocRef);
        if (docSnap.exists()) {
            const quote = docSnap.data() as Quote;
            // Do not return if it's marked as deleted
            if (quote.status === 'Deleted') return undefined;
            return quote;
        }
    } catch (e) {
         console.error(`Failed to fetch quote with attempted ID ${id} from Firestore`, e);
    }
    
    console.warn(`Quote not found with ID: ${id}`);
    return undefined;
};

// --- Logo Functions ---
export const saveStaticLogo = async (logoDataUrl: string) => {
    try {
        const logoDocRef = doc(db, 'settings', 'logo');
        await setDoc(logoDocRef, { dataUrl: logoDataUrl });
    } catch (e) {
        console.error("Failed to save static logo to Firestore", e);
        throw e;
    }
};

export const getStaticLogo = async (): Promise<string | null> => {
    try {
        const logoDocRef = doc(db, 'settings', 'logo');
        const docSnap = await getDoc(logoDocRef);
        if (docSnap.exists()) {
            return docSnap.data().dataUrl as string;
        }
        return null;
    } catch (e) {
        console.error("Failed to fetch static logo from Firestore", e);
        return null;
    }
}

// --- Catalogue Functions ---
const savePartsToCatalogue = async (parts: Part[]) => {
  if (!parts || parts.length === 0) return;

  const cataloguePartsRef = collection(db, 'catalogueParts');
  
  // Fetch existing part IDs to avoid adding duplicates
  const existingPartsSnapshot = await getDocs(cataloguePartsRef);
  const existingPartIds = new Set(existingPartsSnapshot.docs.map(doc => doc.id));

  const batch = writeBatch(db);
  const addedInThisBatch = new Set<string>();

  parts.forEach(part => {
    if (!part.name) return;
    const docId = part.name.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
    
    // Check if part already exists in DB or in the current batch
    if (!existingPartIds.has(docId) && !addedInThisBatch.has(docId)) {
        const docRef = doc(cataloguePartsRef, docId);
        batch.set(docRef, { name: part.name, cost: part.cost }, { merge: true });
        addedInThisBatch.add(docId);
    }
  });

  if (addedInThisBatch.size > 0) {
      await batch.commit();
  }
}

export const saveCatalogueOperation = async (operation: Operation) => {
    if(!operation.heading) return;
    const docId = operation.heading.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
    const operationDocRef = doc(db, 'catalogueOperations', docId);

    const catalogueOperation: CatalogueOperation = {
        heading: operation.heading,
        description: operation.description,
        customerNotes: operation.customerNotes,
        laborHours: operation.laborHours,
        laborRate: operation.laborRate,
        parts: (operation.parts || []).map(p => ({name: p.name, cost: p.cost, quantity: p.quantity})),
    }

    await setDoc(operationDocRef, catalogueOperation, { merge: true });
}

export const deleteCatalogueOperation = async (opHeading: string) => {
    if(!opHeading) return;
    const docId = opHeading.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
    const operationDocRef = doc(db, 'catalogueOperations', docId);
    await deleteDoc(operationDocRef);
}


export const saveCataloguePart = async (part: CataloguePart, originalName?: string) => {
    if (!part.name) return;

    // If the name has changed, we need to delete the old document
    if (originalName && originalName !== part.name) {
        await deleteCataloguePart(originalName);
    }

    const docId = part.name.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
    const partDocRef = doc(db, 'catalogueParts', docId);
    await setDoc(partDocRef, part, { merge: true });
};

export const deleteCataloguePart = async (partName: string) => {
    if (!partName) return;
    const docId = partName.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
    const partDocRef = doc(db, 'catalogueParts', docId);
    await deleteDoc(partDocRef);
};


export const populateCatalogueFromAllQuotes = async (): Promise<{ operationsAdded: number; partsAdded: number }> => {
  try {
    const quotes = await getQuotes();
    let operationsAdded = 0;
    const allParts: Part[] = [];

    for (const quote of quotes) {
      if (quote.operations && quote.operations.length > 0) {
        for (const operation of quote.operations) {
          if (operation.heading) {
            await saveCatalogueOperation(operation);
            operationsAdded++;
            if (operation.parts && operation.parts.length > 0) {
              allParts.push(...operation.parts);
            }
          }
        }
      }
    }

    if (allParts.length > 0) {
      await savePartsToCatalogue(allParts);
    }
    
    return { operationsAdded, partsAdded: allParts.length };
  } catch (e) {
    console.error("Failed to populate catalogue from quotes", e);
    throw e;
  }
};


export const getCatalogueOperations = async (): Promise<CatalogueOperation[]> => {
    try {
        const opsCollection = collection(db, 'catalogueOperations');
        const q = query(opsCollection, orderBy('heading'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as CatalogueOperation);
    } catch(e) {
        console.error("Failed to fetch catalogue operations", e);
        return [];
    }
}

export const getCatalogueParts = async (): Promise<CataloguePart[]> => {
    try {
        const partsCollection = collection(db, 'catalogueParts');
        const q = query(partsCollection, orderBy('name'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as CataloguePart);
    } catch(e) {
        console.error("Failed to fetch catalogue parts", e);
        return [];
    }
}

// --- Autosave Function ---
export const autoSaveQuote = async (quoteToSave: Partial<Quote>) => {
    if (typeof window === 'undefined' || !quoteToSave.userId || !quoteToSave.id) {
        return; // Don't save if no user or ID
    };
    try {
        const quoteDocRef = doc(db, 'quotes', quoteToSave.id);
        const dataToSave = {
            ...quoteToSave,
            updatedAt: new Date().toISOString(),
        };
        // Use merge:true to avoid overwriting fields that might not be in the partial quoteData object yet
        await setDoc(quoteDocRef, dataToSave, { merge: true });
        
        // Also save any new operations/parts to the catalogue during autosave
        if (dataToSave.operations) {
            for (const op of dataToSave.operations) {
                await saveCatalogueOperation(op);
                if (op.parts) {
                    await savePartsToCatalogue(op.parts);
                }
            }
        }
    } catch (e) {
        console.error("Failed to autosave quote to Firestore", e);
        // We don't re-throw here because we don't want to show an error toast for every failed autosave
    }
}


// --- Main Save Function ---
export const saveQuote = async (quoteToSave: Quote, isUpdate: boolean = false) => {
    if (typeof window === 'undefined' || !quoteToSave.userId) {
        console.error("User is not authenticated, cannot save quote.");
        throw new Error("User is not authenticated, cannot save quote.");
    };
    try {
        const quoteDocRef = doc(db, 'quotes', quoteToSave.id);
        const dataToSave = {
            ...quoteToSave,
            createdAt: isUpdate && quoteToSave.createdAt ? quoteToSave.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // When manually saving, move it from 'Work In Progress' to 'Estimate' if it's new
            status: quoteToSave.status === 'Work In Progress' && !isUpdate ? 'Estimate' : quoteToSave.status,
        };
        await setDoc(quoteDocRef, dataToSave, { merge: true });

        // Save operations and parts to catalogue
        if (dataToSave.operations) {
            for (const op of dataToSave.operations) {
                await saveCatalogueOperation(op);
                if (op.parts) {
                    await savePartsToCatalogue(op.parts);
                }
            }
        }

    } catch (e) {
        console.error("Failed to save quote to Firestore", e);
        throw e; // re-throw the error to be caught by the caller
    }
}

export const createNewVersion = async (quoteToVersion: Quote, newOwner?: UserProfile): Promise<string> => {
    const batch = writeBatch(db);

    // 1. Archive the quote that is being versioned by logically deleting it
    const originalQuoteDocRef = doc(db, 'quotes', quoteToVersion.id);
    batch.update(originalQuoteDocRef, { status: 'Cancelled' }); // Using Cancelled as logical delete

    // 2. Determine the new version number and ID
    const newVersionNumber = (quoteToVersion.version || 1) + 1;
    const baseId = quoteToVersion.id.split('-v')[0];
    const newId = `${baseId}-v${newVersionNumber}`;
    
    // 3. Prepare the new quote data
    const newQuoteData: Quote = {
        ...quoteToVersion,
        id: newId,
        version: newVersionNumber,
        status: 'Work In Progress', // New versions should start as 'Work In Progress'
        history: [...(quoteToVersion.history || []), quoteToVersion.id].filter(id => !id.startsWith('QUOTE-')),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    // 4. If a new owner is provided, update the user details for the new version
    if (newOwner) {
        newQuoteData.userId = newOwner.uid;
        newQuoteData.user = {
            ...newQuoteData.user, // keep ref number
            name: newOwner.name,
            phone: newOwner.phone || '',
            email: newOwner.email,
            role: newOwner.role || '',
        };
    }
    
    // 5. Check if this new version ID already exists to prevent conflicts
    const newDocRef = doc(db, 'quotes', newId);
    const newDocSnap = await getDoc(newDocRef);
    if(newDocSnap.exists()) {
        // If it exists, try the next version number. This handles race conditions or stale data.
        return createNewVersion({...quoteToVersion, version: newVersionNumber}, newOwner);
    }


    // 6. Add the new version to the batch
    batch.set(newDocRef, newQuoteData);

    // 7. Commit all batch operations
    await batch.commit();

    return newId;
};

export const moveQuote = async (oldId: string, newQuoteData: Quote) => {
    if (typeof window === 'undefined' || !newQuoteData.userId) {
        throw new Error("User is not authenticated, cannot modify quote.");
    }
    if (oldId === newQuoteData.id) {
        // If ID hasn't changed, just do a normal save
        return saveQuote(newQuoteData, true);
    }
    
    // Check if a quote with the new ID already exists
    const newDocRef = doc(db, 'quotes', newQuoteData.id);
    const newDocSnap = await getDoc(newDocRef);
    if(newDocSnap.exists()) {
        throw new Error(`A quote with the ID ${newQuoteData.id} already exists. Please use a unique Job Card number.`);
    }

    // Prepare to move the document by creating a new one and deleting the old one
    const oldDocRef = doc(db, 'quotes', oldId);
    
    const batch = writeBatch(db);
    
    // Set data for the new document, preserving history from the original quote
    batch.set(newDocRef, {
        ...newQuoteData,
        // Crucially, transfer the history from the old quote to the new one.
        history: [...(newQuoteData.history || [])],
        updatedAt: new Date().toISOString(),
    });
    
    // Delete the old document
    batch.delete(oldDocRef);
    
    try {
        await batch.commit();
    } catch (e) {
        console.error("Failed to move quote in Firestore", e);
        throw e;
    }
};

export const deleteQuote = async (quoteId: string): Promise<void> => {
    try {
        const quoteDocRef = doc(db, 'quotes', quoteId);
        await updateDoc(quoteDocRef, { status: 'Deleted' });
    } catch (e) {
        console.error(`Failed to soft delete quote ${quoteId} from Firestore`, e);
        throw e;
    }
};

export const deleteQuotes = async (quoteIds: string[]): Promise<void> => {
    if (quoteIds.length === 0) return;
    try {
        const batch = writeBatch(db);
        quoteIds.forEach(id => {
            const quoteDocRef = doc(db, 'quotes', id);
            batch.delete(quoteDocRef);
        });
        await batch.commit();
    } catch (e) {
        console.error("Failed to bulk delete quotes from Firestore", e);
        throw e;
    }
};

export const deleteCustomerAndQuotes = async (customerId: string): Promise<void> => {
    if (!customerId) return;

    try {
        const quotesCollection = collection(db, 'quotes');
        // Firestore doesn't support case-insensitive or complex queries on multiple fields like this.
        // We have to fetch all quotes and filter client-side. This is inefficient but necessary with the current data model.
        // For larger scale, the data model should be changed to include a searchable customer ID.
        const q = query(quotesCollection);
        const querySnapshot = await getDocs(q);
        
        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => {
            const quote = doc.data() as Quote;
            if (!quote.customer?.name) return;
            // Sanitize the name from the quote data before comparing
            const sanitizedName = quote.customer.name.toLowerCase().trim().replace(/\//g, '-');
            const quoteCustomerId = `${sanitizedName}|${quote.customer.phone || ''}`;
            
            // The customerId from the client is already sanitized, so we compare against the sanitized version from the quote
            if (quoteCustomerId === customerId) {
                batch.delete(doc.ref);
            }
        });

        await batch.commit();
    } catch (e) {
        console.error(`Failed to delete customer and quotes for ID ${customerId}`, e);
        throw e;
    }
};


export const saveUserProfile = async (userProfile: UserProfile) => {
    if (typeof window === 'undefined' || !userProfile.uid) {
        console.error("User is not authenticated, cannot save user profile.");
        throw new Error("Cannot save user profile without a UID.");
    };
    try {
        const userDocRef = doc(db, 'users', userProfile.uid);
        await setDoc(userDocRef, userProfile, { merge: true });
    } catch (e) {
        console.error("Failed to save user profile to Firestore", e);
        throw e;
    }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (typeof window === 'undefined' || !userId) return null;
    try {
        const userDocRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as UserProfile;
        } else {
            console.warn(`No user profile found for UID: ${userId}`);
            return null;
        }
    } catch (e) {
        console.error(`Failed to fetch user profile for ${userId} from Firestore`, e);
        return null;
    }
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
    const q = query(collection(db, 'users'), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
};


// CHECKLISTS
export const saveChecklist = async (checklistData: Checklist) => {
    const checklistDocRef = doc(db, 'checklists', checklistData.id);
    await setDoc(checklistDocRef, checklistData, { merge: true });
};

export const getChecklists = async (): Promise<Checklist[]> => {
    const checklistsCollection = collection(db, 'checklists');
    const q = query(checklistsCollection, orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Checklist);
};

export const getChecklistById = async (id: string): Promise<Checklist | null> => {
    const checklistDocRef = doc(db, 'checklists', id);
    const docSnap = await getDoc(checklistDocRef);
    return docSnap.exists() ? docSnap.data() as Checklist : null;
};

export const getChecklistTypes = async (): Promise<string[]> => {
    const checklists = await getChecklists();
    const types = new Set(checklists.map(c => c.type));
    return Array.from(types);
};

// BOAT MANAGEMENT
const BOAT_BRANDS_COLLECTION = 'boatBrands';
const BOAT_RANGES_COLLECTION = 'boatRanges';
const BOAT_MODELS_COLLECTION = 'boatModels';

// Upload a file to a specific path in Firebase Storage and get the URL
async function uploadFileToStorage(file: File | Blob, path: string): Promise<string> {
  const fileRef = storageRef(storage, path);
  let dataUrl: string;

  if (file.type.startsWith('image/')) {
    dataUrl = await compressImage(file, 0.7);
  } else {
    dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
  
  await uploadString(fileRef, dataUrl, 'data_url');
  return getDownloadURL(fileRef);
}


// --- Boat Brand ---
export const saveBoatBrand = async (brandData: Partial<BoatBrand>) => {
  const isNew = !brandData.id;
  const docId = isNew ? uuidv4() : brandData.id!;
  const docRef = doc(db, BOAT_BRANDS_COLLECTION, docId);

  let finalData: Omit<BoatBrand, 'id' | 'logoFile'> = {
    name: brandData.name!,
    logo: brandData.logo,
  };

  if (brandData.logoFile) {
    const logoUrl = await uploadFileToStorage(brandData.logoFile, `brand-logos/${docId}`);
    finalData.logo = logoUrl;
  }

  await setDoc(docRef, finalData, { merge: true });
  return { id: docId, ...finalData };
};


export const getBoatBrands = async (): Promise<BoatBrand[]> => {
    const q = query(collection(db, BOAT_BRANDS_COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BoatBrand));
};

export const deleteBoatBrand = async (brandId: string) => {
    const batch = writeBatch(db);
    // Delete the brand
    batch.delete(doc(db, BOAT_BRANDS_COLLECTION, brandId));
    // Find and delete ranges
    const rangesQuery = query(collection(db, BOAT_RANGES_COLLECTION), where('brandId', '==', brandId));
    const rangesSnapshot = await getDocs(rangesQuery);
    const rangeIds = rangesSnapshot.docs.map(d => d.id);
    rangesSnapshot.forEach(d => batch.delete(d.ref));
    // Find and delete models
    if (rangeIds.length > 0) {
        const modelsQuery = query(collection(db, BOAT_MODELS_COLLECTION), where('rangeId', 'in', rangeIds));
        const modelsSnapshot = await getDocs(modelsQuery);
        modelsSnapshot.forEach(d => batch.delete(d.ref));
    }
    await batch.commit();
};

// --- Boat Range ---
export const saveBoatRange = async (rangeData: Partial<BoatRange>) => {
    const isNew = !rangeData.id;
    const docRef = isNew ? doc(collection(db, BOAT_RANGES_COLLECTION)) : doc(db, BOAT_RANGES_COLLECTION, rangeData.id!);
    await setDoc(docRef, rangeData, { merge: true });
};
export const getBoatRanges = async (): Promise<BoatRange[]> => {
    const q = query(collection(db, BOAT_RANGES_COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BoatRange));
};
export const deleteBoatRange = async (rangeId: string) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, BOAT_RANGES_COLLECTION, rangeId));
    const modelsQuery = query(collection(db, BOAT_MODELS_COLLECTION), where('rangeId', '==', rangeId));
    const modelsSnapshot = await getDocs(modelsQuery);
    modelsSnapshot.forEach(d => batch.delete(d.ref));
    await batch.commit();
};

// --- Boat Model ---
export const saveBoatModel = async (modelData: Partial<BoatModel>) => {
  const isNew = !modelData.id;
  const docRef = isNew ? doc(collection(db, BOAT_MODELS_COLLECTION)) : doc(db, BOAT_MODELS_COLLECTION, modelData.id!);
  
  const modelToSave: Partial<BoatModel> = { ...modelData };

  // Handle file uploads for gallery
  if (modelToSave.galleryImages) {
    modelToSave.galleryImages = await Promise.all(
        modelToSave.galleryImages.map(async (image) => {
            if(image.file) {
                const downloadURL = await uploadFileToStorage(image.file, `boat-model-images/${docRef.id}/gallery/${image.id}`);
                return { id: image.id, url: downloadURL };
            }
            return { id: image.id, url: image.url };
        })
    );
  }

  // Handle file uploads for colors
  if (modelToSave.colors) {
    modelToSave.colors = await Promise.all(
      modelToSave.colors.map(async (color) => {
        if (!color.images) return color;
        const processedImages = await Promise.all(
          color.images.map(async (image) => {
            if (image.file) { // If there's a new file to upload
              const downloadURL = await uploadFileToStorage(image.file, `boat-model-images/${docRef.id}/${color.name.replace(/\s+/g, '-')}/${image.id}`);
              return { id: image.id, url: downloadURL };
            }
            return { id: image.id, url: image.url }; // Keep existing image
          })
        );
        return { ...color, images: processedImages };
      })
    );
  }
  
    // Handle file uploads for key documents
  if (modelToSave.keyDocuments) {
    modelToSave.keyDocuments = await Promise.all(
      modelToSave.keyDocuments.map(async (doc) => {
        if (doc.file) {
          const downloadURL = await uploadFileToStorage(doc.file, `boat-documents/${docRef.id}/${doc.id}`);
          return { id: doc.id, name: doc.name, fileUrl: downloadURL };
        }
        return { id: doc.id, name: doc.name, fileUrl: doc.fileUrl }; // Keep existing
      })
    );
  }


  await setDoc(docRef, modelToSave, { merge: true });
};


export const saveBoatModels = async (rangeId: string, rangeName: string, modelNames: string[]) => {
    const batch = writeBatch(db);
    modelNames.forEach(name => {
        const docRef = doc(collection(db, BOAT_MODELS_COLLECTION));
        const modelName = name.includes(rangeName) ? name : `${name} ${rangeName}`;
        batch.set(docRef, { name: modelName, rangeId });
    });
    await batch.commit();
};
export const getBoatModels = async (): Promise<BoatModel[]> => {
    const q = query(collection(db, BOAT_MODELS_COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BoatModel));
};

export const getBoatModelById = async (id: string): Promise<BoatModel | null> => {
    const docRef = doc(db, BOAT_MODELS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as BoatModel) : null;
};

export const deleteBoatModel = async (modelId: string) => {
    await deleteDoc(doc(db, BOAT_MODELS_COLLECTION, modelId));
};
export const deleteBoatModels = async (modelIds: string[]) => {
    const batch = writeBatch(db);
    modelIds.forEach(id => batch.delete(doc(db, BOAT_MODELS_COLLECTION, id)));
    await batch.commit();
};

// --- Kits ---
const KITS_COLLECTION = 'kits';
const DEALER_FIT_PARTS_COLLECTION = 'dealerFitParts';
const DEALER_FIT_CATEGORIES_COLLECTION = 'dealerFitCategories';
const DEALER_FIT_BRANDS_COLLECTION = 'dealerFitBrands';
const SERVICE_ITEMS_COLLECTION = 'serviceItems';


export async function saveKit(kitData: Partial<Kit>) {
    const kitRef = doc(db, KITS_COLLECTION, kitData.id!);
    const dataToSave = {
        ...kitData,
        updatedAt: new Date().toISOString(),
    };
    await setDoc(kitRef, dataToSave, { merge: true });
}

export async function getKits(): Promise<Kit[]> {
    const q = query(collection(db, KITS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Kit);
}

export async function getKitById(id: string): Promise<Kit | null> {
    const docRef = doc(db, KITS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Kit) : null;
}

export async function archiveKit(kit: Kit): Promise<void> {
    const updatedKit: Kit = {
        ...kit,
        status: 'Archived',
    };
    await saveKit(updatedKit);
}

export async function restoreKit(kit: Kit): Promise<void> {
    const updatedKit: Kit = {
        ...kit,
        status: 'Created by Sales', // Or whatever default status you prefer
    };
    await saveKit(updatedKit);
}

// Dealer Fit Parts & Categories
export async function getDealerFitCategories(): Promise<DealerFitCategory[]> {
    const q = query(collection(db, DEALER_FIT_CATEGORIES_COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DealerFitCategory));
}

export async function saveDealerFitCategory(categoryData: Partial<DealerFitCategory>): Promise<void> {
    const isNew = !categoryData.id;
    const docRef = isNew ? doc(collection(db, DEALER_FIT_CATEGORIES_COLLECTION)) : doc(db, DEALER_FIT_CATEGORIES_COLLECTION, categoryData.id!);
    const dataToSave = { ...categoryData, id: docRef.id, createdAt: categoryData.createdAt || new Date().toISOString() };
    await setDoc(docRef, dataToSave, { merge: true });
}

export async function deleteDealerFitCategory(categoryId: string): Promise<void> {
    const batch = writeBatch(db);
    // Delete the category itself
    batch.delete(doc(db, DEALER_FIT_CATEGORIES_COLLECTION, categoryId));
    
    // Find all parts in that category and delete them too
    const partsQuery = query(collection(db, DEALER_FIT_PARTS_COLLECTION), where('categoryId', '==', categoryId));
    const partsSnapshot = await getDocs(partsQuery);
    partsSnapshot.forEach(partDoc => {
        batch.delete(partDoc.ref);
    });
    
    await batch.commit();
}

export async function getDealerFitBrands(): Promise<DealerFitBrand[]> {
    const q = query(collection(db, DEALER_FIT_BRANDS_COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DealerFitBrand));
}

export const saveDealerFitBrand = async (brandData: Partial<DealerFitBrand>) => {
  const isNew = !brandData.id;
  const docId = isNew ? uuidv4() : brandData.id!;
  const docRef = doc(db, DEALER_FIT_BRANDS_COLLECTION, docId);

  const { logoFile, ...dataToSave } = brandData;
  let finalData = dataToSave;

  if (logoFile) {
    const logoUrl = await uploadFileToStorage(logoFile, `dealer-fit-brand-logos/${docId}`);
    finalData.logo = logoUrl;
  }

  await setDoc(docRef, finalData, { merge: true });
  return { id: docId, ...finalData };
};


export async function deleteDealerFitBrand(brandId: string): Promise<void> {
    const batch = writeBatch(db);
    // Delete the brand
    batch.delete(doc(db, DEALER_FIT_BRANDS_COLLECTION, brandId));
    // Find all parts with that brand and disassociate them
    const partsQuery = query(collection(db, DEALER_FIT_PARTS_COLLECTION), where('brandId', '==', brandId));
    const partsSnapshot = await getDocs(partsQuery);
    partsSnapshot.forEach(partDoc => {
        batch.update(partDoc.ref, { brandId: null });
    });
    await batch.commit();
}


export async function deleteDealerFitPart(partId: string): Promise<void> {
    await deleteDoc(doc(db, DEALER_FIT_PARTS_COLLECTION, partId));
}

export const deleteDealerFitParts = async (partIds: string[]) => {
    if (partIds.length === 0) return;
    const batch = writeBatch(db);
    partIds.forEach(id => {
        const docRef = doc(db, DEALER_FIT_PARTS_COLLECTION, id);
        batch.delete(docRef);
    });
    await batch.commit();
};

export async function saveDealerFitParts(categoryId: string, pastedData: string): Promise<number> {
    const lines = pastedData.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return 0;

    const batch = writeBatch(db);
    let count = 0;

    for (const line of lines) {
        const columns = line.split('//').map(col => col.trim());
        if (columns.length < 8) continue; // Ensure all columns are present

        const newPart: Partial<DealerFitPart> = {
            name: columns[0] || 'Unnamed Part',
            supplier: columns[1] || '',
            code: columns[2] || '',
            partNumber: '',
            basePrice: parseFloat(columns[4].replace(/[^0-9.-]+/g,"")) || 0,
            cost: parseFloat(columns[4].replace(/[^0-9.-]+/g,"")) || 0,
            gpPercentage: parseFloat(columns[6]) || 0,
            sellPrice: parseFloat(columns[7].replace(/[^0-9.-]+/g,"")) || 0,
            categoryId: categoryId,
        };
        
        const docRef = doc(collection(db, DEALER_FIT_PARTS_COLLECTION));
        batch.set(docRef, newPart);
        count++;
    }

    await batch.commit();
    return count;
}


// Service Items
export async function saveServiceItem(serviceData: ServiceItem): Promise<void> {
    const serviceRef = doc(db, SERVICE_ITEMS_COLLECTION, serviceData.id);
    await setDoc(serviceRef, serviceData, { merge: true });
}

// Diagnostics
export async function saveDiagnosticReport(report: DiagnosticReport): Promise<void> {
    const reportRef = doc(db, 'diagnosticReports', report.id);
    await setDoc(reportRef, report);
}

export async function getDiagnosticReports(): Promise<DiagnosticReport[]> {
    const q = query(collection(db, 'diagnosticReports'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as DiagnosticReport);
}

export async function getDiagnosticReportById(id: string): Promise<DiagnosticReport | null> {
    const docRef = doc(db, 'diagnosticReports', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as DiagnosticReport : null;
}

export async function deleteDiagnosticReport(id: string): Promise<void> {
    await deleteDoc(doc(db, 'diagnosticReports', id));
}

export async function deleteAllDiagnosticReports(): Promise<void> {
    const snapshot = await getDocs(collection(db, 'diagnosticReports'));
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
}


// --- CPQ ---
const BMT_QUOTES_COLLECTION = 'bmtQuotes';
const MOTORS_COLLECTION = 'catalogueMotors';
const RIGGING_KITS_COLLECTION = 'catalogueRiggingKits';
const TRAILERS_COLLECTION = 'catalogueTrailers';
const PROPELLERS_COLLECTION = 'cataloguePropellers';
const FACTORY_OPTIONS_COLLECTION = 'catalogueFactoryOptions';
const FACTORY_OPTION_CATEGORIES_COLLECTION = 'catalogueFactoryOptionCategories';

export const getBmtQuotes = async (): Promise<BMTQuote[]> => {
    const q = query(collection(db, BMT_QUOTES_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as BMTQuote);
};

export const getBmtQuoteById = async (id: string): Promise<BMTQuote | null> => {
    const docRef = doc(db, BMT_QUOTES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as BMTQuote) : null;
};

export const saveBmtQuote = async (quoteData: BMTQuote) => {
    const docRef = doc(db, BMT_QUOTES_COLLECTION, quoteData.id);
    await setDoc(docRef, { ...quoteData, updatedAt: new Date().toISOString() }, { merge: true });
};

export const getCatalogueMotors = async (): Promise<CatalogueMotor[]> => {
    const q = query(collection(db, MOTORS_COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    const motors = await Promise.all(snapshot.docs.map(async (doc) => {
        const motor = { id: doc.id, ...doc.data() } as CatalogueMotor;
        // Fetch propellers for each motor
        const propellers = await getCataloguePropellers();
        motor.propellers = propellers.filter(p => p.compatibleMotorIds?.includes(motor.id!));
        return motor;
    }));
    return motors;
};

export const getMotorById = async(id: string): Promise<CatalogueMotor | null> => {
    const docRef = doc(db, MOTORS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
     if (!docSnap.exists()) return null;

    const motor = { id: docSnap.id, ...docSnap.data() } as CatalogueMotor;
    // Fetch propellers for the motor
    const propellers = await getCataloguePropellers();
    motor.propellers = propellers.filter(p => p.compatibleMotorIds?.includes(motor.id!));
    return motor;
}


export const saveCatalogueMotor = async (motorData: Partial<CatalogueMotor>) => {
    const isNew = !motorData.id;
    const docId = isNew ? uuidv4() : motorData.id!;
    const docRef = doc(db, MOTORS_COLLECTION, docId);
    
    const { id, imageFile, propellers, ...dataToSave } = motorData;
  
    if (motorData.imageFile) {
      const imageUrl = await uploadFileToStorage(motorData.imageFile, `motor-images/${docRef.id}`);
      dataToSave.imageUrl = imageUrl;
    }
  
    await setDoc(docRef, dataToSave, { merge: true });
    
    return { ...dataToSave, id: docId };
};


export const deleteCatalogueMotor = async (motorId: string) => {
    await deleteDoc(doc(db, MOTORS_COLLECTION, motorId));
};

export const getRiggingKits = async (): Promise<RiggingKit[]> => {
    const q = query(collection(db, RIGGING_KITS_COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RiggingKit));
}

export const getRiggingKitById = async (id: string): Promise<RiggingKit | null> => {
    const docRef = doc(db, RIGGING_KITS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as RiggingKit) : null;
};

export const saveRiggingKit = async (kitData: Partial<RiggingKit>) => {
    const isNew = !kitData.id;
    const docId = isNew ? uuidv4() : kitData.id!;
    const docRef = doc(db, RIGGING_KITS_COLLECTION, docId);
    
    const { imageFile, ...dataToSave } = { ...kitData, id: docId };

    if (kitData.imageFile) {
        const imageUrl = await uploadFileToStorage(kitData.imageFile, `rigging-kit-images/${docId}`);
        dataToSave.imageUrl = imageUrl;
    }
    
    await setDoc(docRef, dataToSave, { merge: true });
    return dataToSave as RiggingKit;
};

export const deleteRiggingKit = async (kitId: string) => {
    await deleteDoc(doc(db, RIGGING_KITS_COLLECTION, kitId));
};


export const getCatalogueTrailers = async (): Promise<CatalogueTrailer[]> => {
    const q = query(collection(db, TRAILERS_COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CatalogueTrailer));
};

export const getTrailerById = async (id: string): Promise<CatalogueTrailer | null> => {
    const docRef = doc(db, TRAILERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as CatalogueTrailer) : null;
};

export const saveCatalogueTrailer = async (trailerData: Partial<CatalogueTrailer>) => {
    const isNew = !trailerData.id;
    const docId = isNew ? uuidv4() : trailerData.id!;
    const docRef = doc(db, TRAILERS_COLLECTION, docId);
    
    const { imageFile, ...dataToSave } = { ...trailerData };

    if (trailerData.imageFile) {
        const imageUrl = await uploadFileToStorage(trailerData.imageFile, `trailer-images/${docId}`);
        dataToSave.imageUrl = imageUrl;
    }

    await setDoc(docRef, dataToSave, { merge: true });
    return { id: docId, ...dataToSave };
};

export const deleteCatalogueTrailer = async (trailerId: string) => {
    await deleteDoc(doc(db, TRAILERS_COLLECTION, trailerId));
};

export const getCataloguePropellers = async (): Promise<Propeller[]> => {
    const q = query(collection(db, PROPELLERS_COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Propeller));
};

export const getPropellerById = async (id: string): Promise<Propeller | null> => {
    const docRef = doc(db, PROPELLERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Propeller) : null;
};

export const saveCataloguePropeller = async (propData: Partial<Propeller>) => {
    const isNew = !propData.id;
    const docId = isNew ? uuidv4() : propData.id!;
    const docRef = doc(db, PROPELLERS_COLLECTION, docId);
    
    const { id, imageFile, ...finalData } = propData;

    if (propData.imageFile) {
        const imageUrl = await uploadFileToStorage(propData.imageFile, `propeller-images/${docRef.id}`);
        finalData.imageUrl = imageUrl;
    }

    await setDoc(docRef, finalData, { merge: true });
    return { id: docRef.id, ...finalData };
};

export const deleteCataloguePropeller = async (propId: string) => {
    await deleteDoc(doc(db, PROPELLERS_COLLECTION, propId));
};

export const getCatalogueFactoryOptions = async (): Promise<FactoryOption[]> => {
    const q = query(collection(db, FACTORY_OPTIONS_COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FactoryOption));
};

export const getFactoryOptionById = async (id: string): Promise<FactoryOption | null> => {
    const docRef = doc(db, FACTORY_OPTIONS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as FactoryOption) : null;
};

export const saveFactoryOptionCategory = async (categoryData: Partial<FactoryOptionCategory>): Promise<void> => {
    const isNew = !categoryData.id;
    const docId = isNew ? uuidv4() : categoryData.id!;
    const docRef = doc(db, FACTORY_OPTION_CATEGORIES_COLLECTION, docId);

    const dataToSave: Partial<FactoryOptionCategory> = {
        name: categoryData.name,
        tag: categoryData.tag || 'Boat',
        compatibleBoatModelIds: categoryData.tag === 'Boat' ? categoryData.compatibleBoatModelIds || [] : [],
        compatibleMotorIds: categoryData.tag === 'Motor' ? categoryData.compatibleMotorIds || [] : [],
        compatibleTrailerIds: categoryData.tag === 'Trailer' ? categoryData.compatibleTrailerIds || [] : [],
    };
    
    await setDoc(docRef, { ...dataToSave, id: docId }, { merge: true });

    // After saving the category, find all options in it and update their compatibility
    if (categoryData.tag === 'Boat' && dataToSave.compatibleBoatModelIds && dataToSave.compatibleBoatModelIds.length > 0) {
        const partsQuery = query(collection(db, FACTORY_OPTIONS_COLLECTION), where('categoryId', '==', docId));
        const partsSnapshot = await getDocs(partsQuery);
        
        if (!partsSnapshot.empty) {
            const batch = writeBatch(db);
            partsSnapshot.forEach(partDoc => {
                const partRef = doc(db, FACTORY_OPTIONS_COLLECTION, partDoc.id);
                const existingBoatIds = (partDoc.data().compatibleBoatModelIds || []) as string[];
                const newBoatIds = new Set([...existingBoatIds, ...dataToSave.compatibleBoatModelIds!]);
                batch.update(partRef, { compatibleBoatModelIds: Array.from(newBoatIds) });
            });
            await batch.commit();
        }
    }
}


export const deleteFactoryOptionCategory = async (categoryId: string): Promise<void> => {
    const batch = writeBatch(db);
    // Delete the category itself
    batch.delete(doc(db, FACTORY_OPTION_CATEGORIES_COLLECTION, categoryId));
    
    // Find all parts in that category and set their categoryId to null
    const partsQuery = query(collection(db, FACTORY_OPTIONS_COLLECTION), where('categoryId', '==', categoryId));
    const partsSnapshot = await getDocs(partsQuery);
    partsSnapshot.forEach(partDoc => {
        const partRef = doc(db, FACTORY_OPTIONS_COLLECTION, partDoc.id);
        batch.update(partRef, { categoryId: null });
    });
    
    await batch.commit();
}


export const getFactoryOptionCategories = async (): Promise<FactoryOptionCategory[]> => {
    const q = query(collection(db, FACTORY_OPTION_CATEGORIES_COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FactoryOptionCategory));
};

export const saveCatalogueFactoryOption = async (optionData: Partial<FactoryOption>) => {
    const isNew = !optionData.id;
    const docId = isNew ? uuidv4() : optionData.id!;
    const docRef = doc(db, FACTORY_OPTIONS_COLLECTION, docId);
    
    const categoryId = (optionData.categoryId === '__none__' || !optionData.categoryId) ? null : optionData.categoryId;
    
    const { id, imageFile, ...restOfData } = optionData;

    const finalData: Partial<Omit<FactoryOption, 'id' | 'imageFile'>> = {
        ...restOfData,
        categoryId: categoryId,
        nsmCode: optionData.nsmCode || '',
        factoryCode: optionData.factoryCode || '',
        tag: optionData.tag || 'Boat',
        compatibleBoatModelIds: optionData.tag === 'Boat' ? optionData.compatibleBoatModelIds || [] : [],
        compatibleMotorIds: optionData.tag === 'Motor' ? optionData.compatibleMotorIds || [] : [],
        compatibleTrailerIds: optionData.tag === 'Trailer' ? optionData.compatibleTrailerIds || [] : [],
    };
    
    // Inherit compatibility from the category if it exists
    if (finalData.categoryId) {
        const categoryDoc = await getDoc(doc(db, FACTORY_OPTION_CATEGORIES_COLLECTION, finalData.categoryId));
        if (categoryDoc.exists()) {
            const categoryData = categoryDoc.data() as FactoryOptionCategory;
            if (categoryData.tag === 'Boat' && categoryData.compatibleBoatModelIds) {
                finalData.compatibleBoatModelIds = Array.from(new Set([...(finalData.compatibleBoatModelIds || []), ...categoryData.compatibleBoatModelIds]));
            }
            // Add similar logic for motors and trailers if needed in the future
        }
    }


    if (optionData.imageFile) {
        const imageUrl = await uploadFileToStorage(optionData.imageFile, `factory-option-images/${docRef.id}`);
        finalData.imageUrl = imageUrl;
    }

    await setDoc(docRef, finalData, { merge: true });
    return { id: docRef.id, ...finalData } as FactoryOption;
};

export const deleteCatalogueFactoryOption = async (optionId: string) => {
    await deleteDoc(doc(db, FACTORY_OPTIONS_COLLECTION, optionId));
};

export const getSampleOperations = async (num: number): Promise<CatalogueOperation[]> => {
    const q = query(collection(db, 'catalogueOperations'), limit(num));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as CatalogueOperation);
};

export async function getDealerFitParts(): Promise<DealerFitPart[]> {
    const q = query(collection(db, DEALER_FIT_PARTS_COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DealerFitPart));
}

export async function saveDealerFitPart(partData: Partial<DealerFitPart>): Promise<DealerFitPart> {
    const isNew = !partData.id;
    const docId = isNew ? uuidv4() : partData.id!;
    const docRef = doc(db, DEALER_FIT_PARTS_COLLECTION, docId);

    const categoryId = (partData.categoryId === '__none__' || !partData.categoryId) ? null : partData.categoryId;
    const brandId = (partData.brandId === '__none__' || !partData.brandId) ? null : partData.brandId;

    const { imageFile, ...dataToSave } = partData;
    let finalData: Partial<DealerFitPart> = { 
        ...dataToSave, 
        categoryId: categoryId,
        brandId: brandId,
    };

    if (imageFile) {
        const imageUrl = await uploadFileToStorage(imageFile, `dealer-fit-images/${docId}`);
        finalData.imageUrl = imageUrl;
    }

    await setDoc(docRef, finalData, { merge: true });
    return { ...finalData, id: docId } as DealerFitPart;
}

export const getDealerFitKits = async (): Promise<DealerFitKit[]> => {
    const q = query(collection(db, 'dealerFitKits'), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DealerFitKit));
};

export const saveDealerFitKit = async (kitData: Partial<DealerFitKit>) => {
    const isNew = !kitData.id;
    const docId = isNew ? uuidv4() : kitData.id!;
    const docRef = doc(db, 'dealerFitKits', docId);
    await setDoc(docRef, { ...kitData, id: docId }, { merge: true });
    return { ...kitData, id: docId };
};

export const deleteDealerFitKit = async (kitId: string) => {
    const docRef = doc(db, 'dealerFitKits', kitId);
    await deleteDoc(docRef);
};


// --- Sync Audit Log Functions ---
const SYNC_AUDIT_LOGS_COLLECTION = 'syncAuditLogs';

export async function saveSyncAuditLog(logData: Omit<SyncAuditLog, 'id'>): Promise<SyncAuditLog> {
    const docRef = await addDoc(collection(db, SYNC_AUDIT_LOGS_COLLECTION), logData);
    return { id: docRef.id, ...logData };
}

export async function getSyncAuditLogs(): Promise<SyncAuditLog[]> {
    const q = query(collection(db, SYNC_AUDIT_LOGS_COLLECTION), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SyncAuditLog));
}

// --- CRM Credentials Functions ---
export const saveCrmCredentials = async (credentials: CrmCredentials) => {
    try {
        const credsDocRef = doc(db, 'settings', 'crmCredentials');
        await setDoc(credsDocRef, credentials, { merge: true });
    } catch (e) {
        console.error("Failed to save CRM credentials to Firestore", e);
        throw e;
    }
};

export const getCrmCredentials = async (): Promise<CrmCredentials | null> => {
    try {
        const credsDocRef = doc(db, 'settings', 'crmCredentials');
        const docSnap = await getDoc(credsDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as CrmCredentials;
        }
        return null;
    } catch (e) {
        console.error("Failed to fetch CRM credentials from Firestore", e);
        return null;
    }
};
    










    


