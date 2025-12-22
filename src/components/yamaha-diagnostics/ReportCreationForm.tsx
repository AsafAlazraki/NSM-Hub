
"use client";

import React, { useState, createContext, useContext, ReactNode } from 'react';
import { ReportFormProvider, useReportForm } from './ReportFormProvider';
import { StepIndicator } from '@/components/form/StepIndicator';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import StepCustomerDetails from './StepCustomerDetails';
import StepGenerateReport from './StepGenerateReport';


const ReportCreationFormContent = () => {
  const { currentStep } = useReportForm();
  
  const steps = [
    { number: 1, title: "Customer" },
    { number: 2, title: "Generate Report" },
  ];
  
  return (
      <div className="container mx-auto max-w-7xl py-8 px-4">
        <StepIndicator steps={steps} currentStep={currentStep} />
        <Card className="mt-8 shadow-lg">
          <CardContent className="p-6 md:p-8">
            {currentStep === 1 && <StepCustomerDetails />}
            {currentStep === 2 && <StepGenerateReport />}
          </CardContent>
        </Card>
      </div>
  )
}

// --- MAIN COMPONENT ---
export const ReportCreationForm = () => {
    
  return (
    <ReportFormProvider>
        <ReportCreationFormContent/>
    </ReportFormProvider>
  );
};
