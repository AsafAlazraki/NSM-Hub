





"use client";

import React, { useState, createContext, useContext, useEffect, useRef } from 'react';
import type { Kit, UserProfile, KitStatusHistoryItem } from '@/lib/types';
import { StepIndicator } from '@/components/form/StepIndicator';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { saveKit, getUserProfile } from '@/lib/storage';
import StepKitDetails from './StepKitDetails';
import StepKitFitment from './StepKitFitment';
import StepKitParts from './StepKitParts';

// --- CONTEXT ---
export interface KitFormContextType {
  kitData: Partial<Kit>;
  setKitData: React.Dispatch<React.SetStateAction<Partial<Kit>>>;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  totalSteps: number;
  handleNext: () => void;
  handleBack: () => void;
  isSaving: boolean;
  handleSave: () => Promise<void>;
}

const getInitialKitData = (): Partial<Kit> => {
    const initialStatus = 'Created by Sales';
    return {
        id: `KIT-${Date.now()}`,
        name: '',
        fitment: {
            brands: [],
            ranges: [],
            models: [],
        },
        parts: [],
        createdAt: new Date().toISOString(),
        status: initialStatus,
        user: { name: '', email: '', phone: '', ref: ''},
        statusHistory: [{ status: initialStatus, date: new Date().toISOString() }],
    };
};

const KitFormContext = createContext<KitFormContextType | null>(null);


export const useKitForm = () => {
  const context = useContext(KitFormContext);
  if (!context) {
    throw new Error('useKitForm must be used within a KitFormProvider');
  }
  return context;
};

interface KitCreationFormProps {
    initialData?: Kit;
}

// --- MAIN COMPONENT ---
export const KitCreationForm = ({ initialData }: KitCreationFormProps) => {
  const [kitData, setKitData] = useState<Partial<Kit>>(() => initialData || getInitialKitData());
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const totalSteps = 3; 
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  useEffect(() => {
    const fetchProfileAndInit = async () => {
        if (user && !kitData.userId) { // only on initial creation
            const userProfile = await getUserProfile(user.uid);
            setKitData(prev => ({
                ...prev,
                userId: user.uid,
                user: {
                    name: userProfile?.name || '',
                    email: userProfile?.email || '',
                    phone: userProfile?.phone || '',
                    role: userProfile?.role || '',
                    ref: ''
                }
            }));
        }
        setIsLoading(false);
    }
    fetchProfileAndInit();
  }, [user, kitData.userId]);

  const handleNext = async () => {
    if (user) {
        try {
            await saveKit({ ...kitData, userId: user.uid } as Kit);
        } catch (e) {
            console.error("Failed to save kit draft", e);
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: 'Could not save a draft of your kit.'
            });
            // We might not want to block navigation even if save fails.
        }
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
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in." });
        return;
    }
    setIsSaving(true);
    try {
      const finalKitData: Kit = {
          ...kitData,
          userId: user.uid,
          status: 'Created by Sales',
       } as Kit;
       
      await saveKit(finalKitData);
      
      toast({
        title: `Kit Saved`,
        description: `Kit "${kitData.name}" has been saved.`,
      });
      
      router.push(`/kits`);

    } catch (error) {
      console.error("Kit Save Error:", error);
      toast({
        variant: "destructive",
        title: "Error Saving Kit",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const steps = [
    { number: 1, title: "Name" },
    { number: 2, title: "Parts" },
    { number: 3, title: "Fitment" },
  ];
  
  if (isLoading) {
    return (
       <div className="container mx-auto max-w-5xl py-8 px-4">
        <StepIndicator steps={steps} currentStep={1} />
        <Card className="mt-8 shadow-lg">
          <CardContent className="p-6 md:p-8">
             <div className="space-y-4">
                <Skeleton className="h-8 w-1/3 mb-4" />
                <Skeleton className="h-10 w-full" />
             </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <KitFormContext.Provider value={{ kitData, setKitData, currentStep, setCurrentStep, totalSteps, handleNext, handleBack, isSaving, handleSave }}>
      <div className="container mx-auto max-w-7xl py-8 px-4">
        <StepIndicator steps={steps} currentStep={currentStep} />
        <Card className="mt-8 shadow-lg">
          <CardContent className="p-6 md:p-8">
            {currentStep === 1 && <StepKitDetails />}
            {currentStep === 2 && <StepKitParts />}
            {currentStep === 3 && <StepKitFitment kitData={kitData} />}
          </CardContent>
        </Card>
      </div>
    </KitFormContext.Provider>
  );
};
