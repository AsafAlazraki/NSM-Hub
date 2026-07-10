

import { Timestamp } from 'firebase/firestore';

export interface Part {
  id: string;
  name: string;
  cost: number; // ex. GST
  costIncGst?: number; // cost * 1.1, kept in sync by the part editors
  quantity?: number;
}

export interface Operation {
  id:string;
  heading: string;
  description: string;
  laborRate: number;
  laborHours: number;
  parts: Part[];
  customerNotes?: string; // Added this line
}

export interface CataloguePart {
  name: string;
  cost: number; // ex. GST
  costIncGst?: number;
  quantity?: number;
}

export interface CatalogueOperation {
  heading: string;
  description: string;
  customerNotes?: string; // Added this line
  laborHours: number;
  laborRate: number;
  parts: CataloguePart[];
}


export interface Customer {
  id?: string; // Optional ID for hub aggregation
  name: string;
  address?: {
    street?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
  };
  phone?: string;
  email?: string;
}

export interface Boat {
  make: string;
  model: string;
  registration: string;
  hin: string;
  insuranceRef: string;
}

export interface Motor {
  id: string;
  make?: string;
  model?: string;
  serial?: string;
}

export interface Trailer {
  make: string;
  model: string;
  registration: string;
  vin?: string;
}

export interface UserDetails {
  ref: string;
  name: string;
  phone: string;
  email: string;
  role?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

export type EstimateType = 'Installation' | 'Insurance' | 'Mechanical Estimate';

export interface InsuranceCompany {
  name: string;
  email?: string;
  phone?: string;
  abn?: string;
}

export type QuoteStatus = 'Work In Progress' | 'Estimate' | 'Pending' | 'Approved' | 'Complete' | 'Cancelled' | 'Deleted';

export interface Quote {
  id: string;
  userId: string; // Added to associate quote with a user
  status: QuoteStatus;
  user: UserDetails;
  customer: Customer;
  boat: Boat;
  motors: Motor[];
  trailer: Trailer;
  operations: Operation[];
  createdAt: string;
  updatedAt?: string;
  version: number;
  history: string[];
  estimateType?: EstimateType;
  insuranceCompany?: InsuranceCompany | null;
}

export interface ChecklistItem {
    id: string;
    text: string;
    instructions?: string;
    imageUrl?: string;
    children: ChecklistItem[];
}

export interface Checklist {
    id: string;
    userId: string;
    name: string;
    type: string;
    items: ChecklistItem[];
    createdAt: string;
    updatedAt?: string;
}

export interface BoatBrand {
    id?: string;
    name: string;
    logo?: string;
    logoFile?: File; // For client-side handling
}

export interface BoatRange {
    id?: string;
    brandId: string;
    name: string;
}

export interface Propeller {
    id?: string;
    name: string;
    basePrice: number;
    sellPrice: number;
    cost: number;
    gpPercentage: number;
    nsmCode?: string;
    factoryCode?: string;
    imageUrl?: string | null;
    imageFile?: File;
    compatibleMotorIds?: string[];
}

export type OptionTag = 'Boat' | 'Motor' | 'Trailer' | 'Misc';

export interface FactoryOptionCategory {
    id?: string;
    name: string;
    createdAt?: string;
    tag?: OptionTag;
    compatibleBoatModelIds?: string[];
    compatibleMotorIds?: string[];
    compatibleTrailerIds?: string[];
}

export interface FactoryOption {
    id?: string;
    categoryId?: string | null;
    name: string;
    basePrice: number;
    sellPrice: number;
    gpPercentage: number;
    nsmCode: string;
    factoryCode: string;
    imageUrl?: string | null;
    imageFile?: File;
    tag?: OptionTag;
    compatibleBoatModelIds?: string[];
    compatibleMotorIds?: string[];
    compatibleTrailerIds?: string[];
}

export interface CatalogueMotor {
    id?: string;
    name: string;
    basePrice: number;
    sellPrice: number;
    gpPercentage: number;
    compatiblePropellerIds?: string[];
    specifications?: { name: string; value: string; }[];
    includesPreDelivery?: boolean;
    imageUrl?: string;
    imageFile?: File;
    propellers?: Propeller[];
    compatibleFactoryOptionIds?: string[];
}


export interface ColorOption {
    name: string;
    images: { id: string; url: string; file?: File }[];
}

export type KeyDocument = {
    id: string;
    name: string;
    fileUrl: string;
    file?: File; // Temporary client-side file
};

export interface Preconfiguration {
    id: string;
    name: string;
    selectedMaterial?: string;
    selectedColorName?: string;
    selectedTrailerId?: string;
    compatibleMotorIds?: string[];
    compatibleRiggingKitIds?: string[];
    compatibleFactoryOptionIds?: string[];
    standardFactoryOptionIds?: string[];
    compatibleDealerFitOptionIds?: string[];
}

export interface BoatModelCompatibleTrailer {
    trailerId: string;
    compatibleFactoryOptionIds?: string[];
}

export interface BoatModelCompatibleMotor {
    motorId: string;
    compatiblePropellerIds?: string[];
    compatibleFactoryOptionIds?: string[];
}

export interface DealerFitKit {
    id?: string;
    name: string;
    partIds: string[];
}

export interface BoatModel {
    id?: string;
    rangeId: string;
    name: string;
    materials?: string[];
    colors?: ColorOption[];
    galleryImages?: { id: string; url: string; file?: File }[];
    consoleOptions?: { name: string; price: number; asStandard?: boolean; }[];
    pricing?: { material: string; color: string; price: number; includesGst?: boolean; }[];
    standardFeatures?: string[];
    specifications?: { name: string; value: string; }[];
    compatibleMotors?: BoatModelCompatibleMotor[];
    compatibleRiggingKitIds?: string[];
    compatibleTrailers?: BoatModelCompatibleTrailer[];
    compatibleFactoryOptionIds?: string[];
    compatibleFactoryOptionCategoryIds?: string[];
    standardFactoryOptionIds?: string[];
    compatibleDealerFitOptionIds?: string[];
    compatibleDealerFitKitIds?: string[];
    keyDocuments?: KeyDocument[];
    preconfigurations?: Preconfiguration[];
}

export interface DealerFitCategory {
    id?: string;
    name: string;
    createdAt?: string;
}

export interface DealerFitBrand {
    id?: string;
    name: string;
    logo?: string;
    logoFile?: File;
}

export interface DealerFitPart {
    id?: string;
    categoryId?: string | null;
    brandId?: string | null;
    name: string;
    supplier?: string;
    code?: string;
    basePrice: number;
    basePriceIncGst: number;
    sellPrice: number;
    sellPriceIncGst: number;
    gpPercentage: number;
    nsmCode?: string;
    factoryCode?: string;
    imageUrl?: string | null;
    imageFile?: File; // For client-side handling
    compatibleBoatModelIds?: string[];
    partNumber?: string;
    pa?: number;
    cost?: number;
    mu?: number;
    gp?: number;
}


export interface ServiceChecklistItem {
    id: string;
    text: string;
}

export interface ServiceItem {
    id: string;
    kitId: string;
    name: string;
    description: string;
    chargeRate: number;
    hoursToComplete: number;
    checklistItems: ServiceChecklistItem[];
    createdAt: string;
    updatedAt?: string;
}

export interface KitFitment {
    brands: string[];
    ranges: string[];
    models: string[];
}

export type KitStatus = 'Created by Sales' | 'Awaiting checks' | 'Approved by P&A' | 'Approved by Service' | 'Awaiting Confirmation' | 'Completed' | 'Archived';

export interface KitStatusHistoryItem {
    status: KitStatus;
    date: string;
}

export interface Kit {
    id: string;
    name: string;
    fitment: KitFitment;
    parts: DealerFitPart[];
    createdAt: string;
    updatedAt?: string;
    userId: string;
    user: UserDetails;
    status: KitStatus;
    statusHistory: KitStatusHistoryItem[];
    serviceItemId?: string;
    serviceItem?: ServiceItem;
    paApprovedBy?: { uid: string; name: string; date: string; };
    serviceApprovedBy?: { uid: string; name: string; date: string; };
}

export interface EngineHourAnalysis {
    rpmRange: string;
    hours: number;
}

export interface DiagnosisRecord {
    code: string;
    description: string;
    occurrences: number;
}

export interface OilExchangeRecord {
    item: string;
    value: string;
}

export interface EngineRecordItem {
    item: string;
    value: string;
}

export interface EngineDetails {
  id: string;
  make?: string;
  model?: string;
  serial?: string;
  hours?: number;
  hourAnalysis?: EngineHourAnalysis[];
  diagnosisRecords?: DiagnosisRecord[];
  oilExchangeRecords?: OilExchangeRecord[];
  engineRecords?: EngineRecordItem[];
  rawContent: string; // Added rawContent to EngineDetails
}

export interface SourceFile {
    name: string;
    content: string; // Base64 encoded PDF
}

export interface DiagnosticReport {
    id: string;
    userId: string;
    user: UserDetails;
    customer: Customer;
    engines: EngineDetails[];
    sourceFiles: SourceFile[];
    reportContent: string;
    status: 'Processing' | 'Processed' | 'Error';
    createdAt: string;
    updatedAt?: string;
}

export type BookingApplicationStatus = 'Awaiting Confirmation' | 'Contacted' | 'Booked' | 'Declined' | 'Completed';

export type NsmBranch = 'Boondall' | 'Coomera';

export interface BookingApplication {
  id?: string; // Firestore document ID (will also be the accessKey)
  accessKey: string; // Unique, non-guessable key for public access (same as id)
  location?: NsmBranch; // Which NSM branch the customer wants to visit
  
  // Customer Details
  customerName: string;
  customerAddress?: string | null; // Single address field for simplicity from image
  customerMobileNumber?: string | null;
  customerEmail: string;

  // Boat Details
  boatMake?: string | null;
  boatModel?: string | null;
  boatHin?: string | null;
  boatRegistrationNumber?: string | null;

  // Engine Details
  engineMake?: string | null;
  engineModel?: string | null;
  engineSerialNumber?: string | null;

  // Trailer Details
  trailerMake?: string | null;
  trailerModel?: string | null;
  trailerVin?: string | null;
  trailerRegistration?: string | null;

  // Work to be performed
  workToBePerformed: string;

  // Dates
  bookingDateRequested?: string | null;
  dateRequiredForCollection?: string | null;

  createdAt: Timestamp;
  updatedAt?: Timestamp;
  status: BookingApplicationStatus; // For internal staff tracking
  staffNotes?: string; // Internal notes by staff
  deleted?: boolean; // Soft-deleted (in the bin); restorable until permanently deleted
}

// CPQ Specific Types
export interface RiggingKit {
    id?: string;
    name: string;
    basePrice: number;
    sellPrice: number;
    gpPercentage: number;
    nsmCode?: string;
    factoryCode?: string;
    imageUrl?: string | null;
    imageFile?: File;
}

export interface CatalogueTrailer {
    id?: string;
    name: string;
    price: number;
    imageUrl?: string;
    specifications?: { name: string; value: string; }[];
    imageFile?: File;
    compatibleFactoryOptionIds?: string[];
}

export type BMTQuoteStatus = 'Draft' | 'Sent to Customer' | 'Approved' | 'Not Approved' | 'Cancelled' | 'Archived';

export interface BMTQuote {
    id: string;
    userId: string;
    user: UserDetails;
    customer?: Customer;
    brandId: string;
    brandName: string;
    status: BMTQuoteStatus;
    createdAt: string;
    updatedAt: string;

    // Selections
    selectedRangeId: string | null;
    selectedModelId: string | null;
    selectedMaterial: string | null;
    selectedColorName: string | null;
    selectedConsoleName: string | null;
    selectedMotorId: string | null;
    selectedPropellerId: string | 'N/A' | null;
    selectedRiggingKitId: string | null;
    selectedControlId: string | null;
    selectedGaugeId: string | null;
    selectedTrailerId: string | null;
    selectedFactoryOptionIds?: string[];
    selectedDealerFitOptionIds?: string[];

    // Checkboxes
    hullIncludesPreDelivery: boolean;
    hullIncludesRegistration: boolean;
    motorIncludesPreDelivery: boolean;
    riggingIncludesInstallation: boolean;
    trailerIncludesPreDelivery: boolean;
    trailerIncludesRegistration: boolean;

    // Pricing snapshot
    pricing: {
        hullPrice: number;
        consolePrice: number;
        motorPrice: number;
        propellerPrice: number;
        riggingKitPrice: number;
        trailerPrice: number;
    }
}


export interface SyncAuditLog {
    id?: string;
    timestamp: Timestamp;
    userId: string;
    userName: string;
    action: string;
    error?: string | null;
}

export interface CrmCredentials {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    resource: string;
}
    

    

    
