"use client";

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Logo } from '../Logo';
import { useToast } from '@/hooks/use-toast';
import { createBookingApplication } from '@/lib/booking-application-storage';
import { useRouter } from 'next/navigation';

import { ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

import StepCustomer from './form-steps/StepCustomer';
import StepVessel from './form-steps/StepVessel';
import StepWork from './form-steps/StepWork';
import StepDates from './form-steps/StepDates';
import StepReview from './form-steps/StepReview';

// Schemas for each step
const customerSchema = z.object({
  customerName: z.string().min(1, 'Full name is required.'),
  customerAddress: z.string().optional(),
  customerMobileNumber: z.string().min(1, 'Mobile number is required.'),
  customerEmail: z.string().email('Invalid email address.').min(1, 'Email address is required.'),
});
const vesselSchema = z.object({
  boatMake: z.string().optional(),
  boatModel: z.string().optional(),
  boatHin: z.string().optional(),
  boatRegistrationNumber: z.string().optional(),
  engineMake: z.string().optional(),
  engineModel: z.string().optional(),
  engineSerialNumber: z.string().optional(),
  trailerMake: z.string().optional(),
  trailerModel: z.string().optional(),
  trailerVin: z.string().optional(),
  trailerRegistration: z.string().optional(),
});
const workSchema = z.object({
  workToBePerformed: z.string().min(1, 'Please describe the work to be performed.'),
});
const datesSchema = z.object({
  bookingDateRequested: z.string().optional(),
  dateRequiredForCollection: z.string().optional(),
});

// The main schema now correctly merges all parts
const bookingFormSchema = customerSchema
    .merge(vesselSchema)
    .merge(workSchema)
    .merge(datesSchema);

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  formId: string; // The accessKey or 'new'
  logo: string | null;
}

const TOTAL_STEPS = 5;

export function BookingForm({ formId, logo }: BookingFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    mode: 'onChange',
  });

  const { trigger } = methods;

  const handleNext = async () => {
    let fieldsToValidate: (keyof BookingFormValues)[] = [];
    switch (currentStep) {
        case 1:
            fieldsToValidate = ['customerName', 'customerMobileNumber', 'customerEmail'];
            break;
        case 2: // Vessel details are optional
            break;
        case 3:
            fieldsToValidate = ['workToBePerformed'];
            break;
        case 4: // Dates are optional
            break;
    }

    const isValid = fieldsToValidate.length > 0 ? await trigger(fieldsToValidate) : true;
    
    if (isValid && currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const onSubmit = async (data: BookingFormValues) => {
    setIsSubmitting(true);
    try {
        const newApplication = await createBookingApplication(data);
        if (newApplication) {
            toast({
                title: "Booking Submitted",
                description: "Thank you! We have received your booking application.",
            });
            router.push(`/booking-application/${newApplication.id}`);
        } else {
            throw new Error("Failed to create application in database.");
        }
    } catch (error) {
        console.error("Failed to create booking application:", error);
        toast({
            variant: "destructive",
            title: "Submission Error",
            description: "Could not submit your booking. Please try again later.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch(currentStep) {
        case 1: return <StepCustomer />;
        case 2: return <StepVessel />;
        case 3: return <StepWork />;
        case 4: return <StepDates />;
        case 5: return <StepReview setStep={setCurrentStep} />;
        default: return <StepCustomer />;
    }
  }
  
  const progressValue = (currentStep / TOTAL_STEPS) * 100;

  return (
    <Card className="sm:rounded-xl sm:shadow-lg">
      <CardHeader className="bg-muted/30 p-4 sm:p-6 sm:rounded-t-xl text-center space-y-4">
         <div className="mx-auto max-w-[200px]">
          <Logo logo={logo} />
        </div>
        <CardTitle className="text-2xl font-headline">
            Booking Application
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <Progress value={progressValue} className="mb-6 h-2" />
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            {renderStep()}
             <div className="flex justify-between mt-8">
                {currentStep > 1 ? (
                    <Button type="button" variant="outline" onClick={handleBack}>
                        <ArrowLeft /> Back
                    </Button>
                ) : <div />}

                {currentStep < TOTAL_STEPS ? (
                     <Button type="button" onClick={handleNext}>
                        Next <ArrowRight />
                    </Button>
                ) : (
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Application'} <Send />
                    </Button>
                )}
            </div>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
