
"use client";

import React, { useState, createContext, useContext, useEffect, ReactNode } from 'react';
import type { DiagnosticReport, UserDetails, SourceFile, EngineDetails as ParsedEngineDetails } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { getUserProfile, saveDiagnosticReport } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { analyzeDiagnosticReport } from '@/ai/flows/analyze-diagnostic-report';
import { extractTextFromPdfs } from '@/lib/pdf';
import { Skeleton } from '@/components/ui/skeleton';


// --- CONTEXT ---
export interface ReportFormContextType {
  reportData: Partial<DiagnosticReport>;
  setReportData: React.Dispatch<React.SetStateAction<Partial<DiagnosticReport>>>;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  totalSteps: number;
  handleNext: () => void;
  handleBack: () => void;
  isSaving: boolean;
  handleSave: () => Promise<void>;
  extractedText: string;
  setExtractedText: React.Dispatch<React.SetStateAction<string>>;
}

const getInitialReportData = (): Partial<DiagnosticReport> => ({
  id: `DIAG-${Date.now()}`,
  customer: {
    name: '',
  },
  sourceFiles: [],
  reportContent: '',
  engines: [],
  status: 'Processing',
  createdAt: new Date().toISOString(),
});

const ReportFormContext = createContext<ReportFormContextType | null>(null);

export const useReportForm = () => {
  const context = useContext(ReportFormContext);
  if (!context) {
    throw new Error('useReportForm must be used within a ReportFormProvider');
  }
  return context;
};

export const ReportFormProvider = ({ children }: { children: ReactNode }) => {
  const [reportData, setReportData] = useState<Partial<DiagnosticReport>>(getInitialReportData());
  const [extractedText, setExtractedText] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const totalSteps = 2; // 1. Details, 2. Upload & Generate
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && !reportData.userId) {
        const userProfile = await getUserProfile(user.uid);
        setReportData(prev => ({
          ...prev,
          userId: user.uid,
          user: {
            name: userProfile?.name || '',
            email: userProfile?.email || '',
            phone: userProfile?.phone || '',
            role: userProfile?.role || '',
            ref: ''
          } as UserDetails
        }));
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, [user, reportData.userId]);

  const handleNext = async () => {
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
     if (!reportData.sourceFiles || reportData.sourceFiles.length === 0) {
        toast({ variant: "destructive", title: "No File", description: "Please upload at least one PDF file." });
        return;
    }
    setIsSaving(true);
    try {
      const reportText = await extractTextFromPdfs(reportData.sourceFiles);

      const analysisResult = await analyzeDiagnosticReport({ reportText });
      
      const finalReport = { 
        ...reportData,
        engines: analysisResult.engines, 
        reportContent: reportData.sourceFiles[0].content, // Store first PDF for iframe
        status: 'Processed'
      } as DiagnosticReport;

      await saveDiagnosticReport(finalReport);
      
      toast({
        title: `Report Saved`,
        description: `Report "${finalReport.id}" has been created.`,
      });
      
      router.push(`/service-hub/yamaha-diagnostics/${finalReport.id}`);

    } catch (error) {
      console.error("Report Generation Error:", error);
      toast({
        variant: "destructive",
        title: "Error Saving Report",
        description: error instanceof Error ? error.message : "Could not analyze the report text.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-screen w-full"/>
  }

  return (
    <ReportFormContext.Provider value={{ reportData, setReportData, currentStep, setCurrentStep, totalSteps, handleNext, handleBack, isSaving, handleSave, extractedText, setExtractedText }}>
        {children}
    </ReportFormContext.Provider>
  )
}
