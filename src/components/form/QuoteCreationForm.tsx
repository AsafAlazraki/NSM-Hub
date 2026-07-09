
"use client";

import React, { useState, createContext, useContext, useEffect, useRef } from 'react';
import type { Quote } from '@/lib/types';
import { StepIndicator } from './StepIndicator';
import StepUserDetails from './StepUserDetails';
import StepCustomerBoatDetails from './StepCustomerBoatDetails';
import StepOperations from './StepOperations';
import StepQuoteSummary from './StepQuoteSummary';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { getUserProfile, autoSaveQuote, saveQuote } from '@/lib/storage';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';


// --- CONTEXT ---
export interface QuoteFormContextType {
  quoteData: Partial<Quote>;
  setQuoteData: React.Dispatch<React.SetStateAction<Partial<Quote>>>;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  totalSteps: number;
  handleNext: () => void;
  handleBack: () => void;
  isSaving: boolean;
  handleSave: () => Promise<void>;
  isEditMode: boolean;
}

const getInitialQuoteData = (): Partial<Quote> => ({
  id: `QUOTE-${Date.now()}`,
  status: 'Work In Progress',
  user: {
    ref: '', 
    name: '',
    phone: '',
    email: '',
    role: '',
  },
  customer: {
    name: '',
    address: {
      street: '',
      suburb: '',
      state: '',
      postcode: '',
    },
    phone: '',
    email: '',
  },
  boat: {
    make: '',
    model: '',
    registration: '',
    hin: '',
    insuranceRef: '',
  },
  motors: [],
  trailer: {
    make: '',
    model: '',
    registration: '',
    vin: '',
  },
  operations: [],
  createdAt: new Date().toISOString(),
  version: 1,
  history: [],
});

// Corrected createContext call with a valid default value for React 19
const QuoteFormContext = createContext<QuoteFormContextType>({
  quoteData: getInitialQuoteData(),
  setQuoteData: (value: React.SetStateAction<Partial<Quote>>) => {},
  currentStep: 1,
  setCurrentStep: (value: React.SetStateAction<number>) => {},
  totalSteps: 4,
  handleNext: () => {},
  handleBack: () => {},
  isSaving: false,
  handleSave: async () => {},
  isEditMode: false,
});


export const useQuoteForm = () => {
  const context = useContext(QuoteFormContext);
  if (!context) {
    throw new Error('useQuoteForm must be used within a QuoteFormProvider');
  }
  return context;
};

// --- INITIAL DATA ---


interface QuoteCreationFormProps {
    initialData?: Quote;
    isEditMode?: boolean;
}

// --- MAIN COMPONENT ---
export const QuoteCreationForm = ({ initialData, isEditMode = false }: QuoteCreationFormProps) => {
  const [quoteData, setQuoteData] = useState<Partial<Quote>>(() => initialData ? {...initialData, status: 'Work In Progress'} : getInitialQuoteData());
  const [currentStep, setCurrentStep] = useState(isEditMode ? 3 : 1); // Start on operations if editing
  const [isLoading, setIsLoading] = useState(!isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [hasStartedSaving, setHasStartedSaving] = useState(isEditMode);
  const totalSteps = 4;
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  // Ref to hold the latest quote data for the interval callback
  const quoteDataRef = useRef(quoteData);
  quoteDataRef.current = quoteData;


  useEffect(() => {
    // Only pre-fill user data if creating a NEW quote
    const fetchProfileAndInit = async () => {
        if (user && !isEditMode) {
            setIsLoading(true);
            const userProfile = await getUserProfile(user.uid);
            const newQuoteData = getInitialQuoteData();
            if (userProfile) {
                newQuoteData.user = {
                    ref: '', // Ref is set in step 2
                    name: userProfile.name,
                    phone: userProfile.phone || '',
                    email: userProfile.email,
                    role: userProfile.role || '',
                };
            }
            newQuoteData.userId = user.uid;
            setQuoteData(newQuoteData);
            setIsLoading(false);
        } else if (isEditMode && initialData) {
            setQuoteData({...initialData, status: 'Work In Progress'});
            setIsLoading(false);
        }
    };
    fetchProfileAndInit();
  }, [user, isEditMode, initialData]);

  // Autosave interval
  useEffect(() => {
      if(isLoading || !hasStartedSaving) return; // Don't start saving until told to

      const intervalId = setInterval(() => {
        const currentData = quoteDataRef.current;
        if(currentData?.userId && currentData?.id) {
             autoSaveQuote(currentData);
        }
      }, 1000); // 1 second

      // Cleanup on unmount
      return () => {
          clearInterval(intervalId);
      }
  }, [isLoading, hasStartedSaving]);


  const handleNext = () => {
    if (currentStep === 1 && !hasStartedSaving) {
        // This is the first time the user is proceeding.
        // Start the auto-save process.
        setHasStartedSaving(true);
    }
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const handleSave = async () => {
    if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to save a quote." });
        return;
    }
    if (!quoteData.id) {
        toast({ variant: "destructive", title: "Missing ID", description: "A quote ID could not be generated. Please check the reference number or customer name." });
        return;
    }
    setIsSaving(true);
    try {
        // Keep the quote assigned to its existing owner so editing another
        // user's quote doesn't silently transfer it to the editor. Only fall
        // back to the current user for quotes that don't have an owner yet.
        const finalQuoteData: Quote = { ...quoteData, userId: quoteData.userId || user.uid } as Quote;
        await saveQuote(finalQuoteData, true); // Always treat as update now
      
      toast({
        title: `Quote ${isEditMode ? 'Updated' : 'Saved'}`,
        description: `Quote ${finalQuoteData.id} has been saved successfully.`,
      });
      
      router.push(`/quote/${finalQuoteData.id}`);

    } catch (error) {
      console.error("Quote Save Error:", error);
      toast({
        variant: "destructive",
        title: "Error Saving Quote",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const steps = [
    { number: 1, title: "User Details" },
    { number: 2, title: "Customer & Asset" },
    { number: 3, title: "Operations" },
    { number: 4, title: "Summary & Generate" },
  ];
  
  if (isLoading) {
    return (
       <div className="container mx-auto max-w-5xl py-8 px-4">
        <StepIndicator steps={steps} currentStep={1} />
        <Card className="mt-8 shadow-lg">
          <CardContent className="p-6 md:p-8">
             <div className="space-y-4">
                <Skeleton className="h-8 w-1/3 mb-4" />
                <Skeleton className="h-6 w-full" />
                <div className="grid grid-cols-2 gap-4 pt-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <QuoteFormContext.Provider value={{ quoteData, setQuoteData, currentStep, setCurrentStep, totalSteps, handleNext, handleBack, isSaving, handleSave, isEditMode }}>
      <div className="container mx-auto max-w-5xl py-8 px-4">
        <StepIndicator steps={steps} currentStep={currentStep} />
        <Card className="mt-8 shadow-lg">
          <CardContent className="p-6 md:p-8">
            {currentStep === 1 && <StepUserDetails />}
            {currentStep === 2 && <StepCustomerBoatDetails quoteData={quoteData} />}
            {currentStep === 3 && <StepOperations />}
            {currentStep === 4 && <StepQuoteSummary />}
          </CardContent>
        </Card>
      </div>
    </QuoteFormContext.Provider>
  );
};
