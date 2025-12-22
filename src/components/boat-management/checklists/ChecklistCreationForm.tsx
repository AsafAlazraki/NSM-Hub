"use client";

import React, { useState, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Checklist } from '@/lib/types';
import { saveChecklist } from '@/lib/storage';
import { useAuth } from '@/hooks/use-auth';
import { v4 as uuidv4 } from 'uuid';

interface ChecklistFormContextType {
  checklistData: Partial<Checklist>;
  setChecklistData: React.Dispatch<React.SetStateAction<Partial<Checklist>>>;
  handleNext: () => void;
  handleBack: () => void;
  handleSave: () => void;
  isSaving: boolean;
}

const ChecklistFormContext = createContext<ChecklistFormContextType | undefined>(undefined);

export const useChecklistForm = () => {
  const context = useContext(ChecklistFormContext);
  if (context === undefined) {
    throw new Error('useChecklistForm must be used within a ChecklistFormProvider');
  }
  return context;
};

interface ChecklistFormProviderProps {
  children: ReactNode;
}

export const ChecklistFormProvider = ({ children }: ChecklistFormProviderProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [checklistData, setChecklistData] = useState<Partial<Checklist>>(() => ({
    id: uuidv4(),
    name: '',
    type: '',
    items: [],
    createdAt: new Date().toISOString(),
    userId: user?.uid, // Initialize with current user ID
  }));
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSave = async () => {
    if (!user || !checklistData.name || !checklistData.type || !checklistData.items) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Please fill in all required fields.",
      });
      return;
    }

    setIsSaving(true);
    try {
        // Ensure the userId is set
        const finalChecklistData: Checklist = {
            ...checklistData,
            userId: user.uid,
            id: checklistData.id || uuidv4(), // Ensure ID is set
            createdAt: checklistData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            items: checklistData.items.map(item => ({
                ...item,
                id: item.id || uuidv4(), // Ensure nested item IDs are set
                children: item.children ? item.children.map(child => ({...child, id: child.id || uuidv4()})) : [],
            })),
        } as Checklist; // Cast to Checklist for type safety after ensuring all required fields

        await saveChecklist(finalChecklistData);
        toast({
            title: "Checklist Saved",
            description: `Checklist "${finalChecklistData.name}" has been saved.`, 
        });
        router.push('/boat-management/checklists');
    } catch (error) {
        console.error("Error saving checklist:", error);
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: "Could not save the checklist. Please try again.",
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <ChecklistFormContext.Provider
      value={{
        checklistData,
        setChecklistData,
        handleNext,
        handleBack,
        handleSave,
        isSaving,
      }}
    >
      {children}
    </ChecklistFormContext.Provider>
  );
};
