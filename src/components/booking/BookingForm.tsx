"use client";

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '../Logo';
import { useToast } from '@/hooks/use-toast';
import { createBookingApplication, updateBookingApplication } from '@/lib/booking-application-storage';
import type { BookingApplication } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, ClipboardCheck, Send, Ship, User, Wrench } from 'lucide-react';

import StepCustomer from './form-steps/StepCustomer';
import StepVessel from './form-steps/StepVessel';
import StepWork from './form-steps/StepWork';
import StepDates from './form-steps/StepDates';
import StepReview from './form-steps/StepReview';

// Schemas for each step
const customerSchema = z.object({
  location: z.enum(['Boondall', 'Coomera'], {
    required_error: 'Please choose an NSM location.',
    invalid_type_error: 'Please choose an NSM location.',
  }),
  customerName: z.string().min(1, 'Full name is required.'),
  customerAddress: z.string().optional(),
  customerMobileNumber: z.string().min(1, 'Mobile number is required.'),
  customerEmail: z.string().email('Invalid email address.').min(1, 'Email address is required.'),
});
const vesselSchema = z.object({
  boatMake: z.string().min(1, 'Boat make is required.'),
  boatModel: z.string().min(1, 'Boat model is required.'),
  boatHin: z.string().optional(),
  boatRegistrationNumber: z.string().min(1, 'Boat registration number is required.'),
  engineMake: z.string().min(1, 'Engine make is required.'),
  engineModel: z.string().min(1, 'Engine model is required.'),
  engineSerialNumber: z.string().optional(),
  trailerMake: z.string().min(1, 'Trailer make is required.'),
  trailerModel: z.string().min(1, 'Trailer model is required.'),
  trailerVin: z.string().optional(),
  trailerRegistration: z.string().min(1, 'Trailer registration is required.'),
});
const workSchema = z.object({
  workToBePerformed: z.string().min(1, 'Please describe the work to be performed.'),
});
const datesSchema = z.object({
  bookingDateRequested: z.string().min(1, 'Please select your requested booking date.'),
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
  initialData?: BookingApplication; // When set, the form edits this application instead of creating one
}

const STEPS = [
    { number: 1, title: 'Customer', icon: User },
    { number: 2, title: 'Vessel', icon: Ship },
    { number: 3, title: 'Work', icon: Wrench },
    { number: 4, title: 'Dates', icon: CalendarDays },
    { number: 5, title: 'Review', icon: ClipboardCheck },
];

const TOTAL_STEPS = STEPS.length;

const StepIndicator = ({ currentStep }: { currentStep: number }) => (
    <nav aria-label="Progress" className="mb-8">
        <ol role="list" className="flex items-start">
            {STEPS.map((step, stepIdx) => {
                const isComplete = step.number < currentStep;
                const isCurrent = step.number === currentStep;
                const Icon = step.icon;
                return (
                    <li key={step.title} className={cn('flex items-start', stepIdx !== STEPS.length - 1 && 'flex-1')}>
                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                            <div
                                className={cn(
                                    'flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 transition-colors',
                                    isComplete && 'bg-primary border-primary text-primary-foreground',
                                    isCurrent && 'border-primary bg-primary/10 text-primary',
                                    !isComplete && !isCurrent && 'border-border bg-muted text-muted-foreground'
                                )}
                                aria-current={isCurrent ? 'step' : undefined}
                            >
                                {isComplete ? <Check className="h-5 w-5" /> : <Icon className="h-4 w-4 sm:h-5 sm:w-5" />}
                            </div>
                            <span className={cn(
                                'text-[10px] sm:text-xs font-medium',
                                isCurrent ? 'text-primary' : 'text-muted-foreground',
                                !isCurrent && 'hidden xs:block sm:block'
                            )}>
                                {step.title}
                            </span>
                        </div>
                        {stepIdx !== STEPS.length - 1 && (
                            <div className={cn('mx-1 sm:mx-2 mt-[18px] sm:mt-5 h-0.5 flex-1 rounded', isComplete ? 'bg-primary' : 'bg-border')} />
                        )}
                    </li>
                );
            })}
        </ol>
    </nav>
);

export function BookingForm({ formId, logo, initialData }: BookingFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const isEditMode = !!initialData?.id;

  const methods = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    mode: 'onChange',
    defaultValues: initialData ? {
      location: initialData.location,
      customerName: initialData.customerName || '',
      customerAddress: initialData.customerAddress || '',
      customerMobileNumber: initialData.customerMobileNumber || '',
      customerEmail: initialData.customerEmail || '',
      boatMake: initialData.boatMake || '',
      boatModel: initialData.boatModel || '',
      boatHin: initialData.boatHin || '',
      boatRegistrationNumber: initialData.boatRegistrationNumber || '',
      engineMake: initialData.engineMake || '',
      engineModel: initialData.engineModel || '',
      engineSerialNumber: initialData.engineSerialNumber || '',
      trailerMake: initialData.trailerMake || '',
      trailerModel: initialData.trailerModel || '',
      trailerVin: initialData.trailerVin || '',
      trailerRegistration: initialData.trailerRegistration || '',
      workToBePerformed: initialData.workToBePerformed || '',
      bookingDateRequested: initialData.bookingDateRequested || '',
      dateRequiredForCollection: initialData.dateRequiredForCollection || '',
    } : undefined,
  });

  const { trigger } = methods;

  const handleNext = async () => {
    let fieldsToValidate: (keyof BookingFormValues)[] = [];
    switch (currentStep) {
        case 1:
            fieldsToValidate = ['location', 'customerName', 'customerMobileNumber', 'customerEmail'];
            break;
        case 2:
            fieldsToValidate = [
                'boatMake', 'boatModel', 'boatRegistrationNumber',
                'engineMake', 'engineModel',
                'trailerMake', 'trailerModel', 'trailerRegistration',
            ];
            break;
        case 3:
            fieldsToValidate = ['workToBePerformed'];
            break;
        case 4:
            fieldsToValidate = ['bookingDateRequested'];
            break;
    }

    const isValid = fieldsToValidate.length > 0 ? await trigger(fieldsToValidate) : true;

    if (isValid && currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const sendNotificationEmail = (data: BookingFormValues, id: string) => {
    // Fire-and-forget: a failed notification must never break the customer's
    // submission experience. The server route no-ops unless
    // BOOKING_NOTIFICATIONS_ENABLED is set to "true" (feature currently parked).
    fetch('/api/booking-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id, origin: window.location.origin }),
    }).catch((error) => {
        console.error('Failed to send booking notification email:', error);
    });
  };

  const onSubmit = async (data: BookingFormValues) => {
    setIsSubmitting(true);
    try {
        if (isEditMode) {
            const success = await updateBookingApplication(initialData!.id!, data);
            if (!success) throw new Error("Failed to update application in database.");
            toast({
                title: "Application Updated",
                description: "The booking application has been saved.",
            });
            router.push(`/booking-application/${initialData!.id}`);
        } else {
            const newApplication = await createBookingApplication(data);
            if (newApplication) {
                sendNotificationEmail(data, newApplication.id!);
                setSubmittedName(data.customerName.split(' ')[0]);
                setIsSubmitted(true);
                if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                throw new Error("Failed to create application in database.");
            }
        }
    } catch (error) {
        console.error("Failed to save booking application:", error);
        toast({
            variant: "destructive",
            title: isEditMode ? "Save Error" : "Submission Error",
            description: isEditMode
                ? "Could not save the application. Please try again later."
                : "Could not submit your booking. Please try again later.",
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

  if (isSubmitted) {
    return (
        <Card className="border-0 shadow-none sm:border sm:rounded-2xl sm:shadow-lg overflow-hidden">
            <CardContent className="p-8 sm:p-14 text-center space-y-5">
                <div className="mx-auto max-w-[180px]">
                    <Logo logo={logo} />
                </div>
                <CheckCircle2 className="h-16 w-16 sm:h-20 sm:w-20 text-green-500 mx-auto" />
                <h2 className="text-2xl sm:text-3xl font-headline font-bold">Application Received!</h2>
                <p className="text-muted-foreground max-w-md mx-auto text-base">
                    Thanks{submittedName ? `, ${submittedName}` : ''}! We&apos;ve received your booking application.
                    Our service team will review it and be in touch shortly to confirm your booking.
                </p>
                <p className="text-sm text-muted-foreground">
                    A copy of your details has been sent to our service department.
                </p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="border-0 shadow-none sm:border sm:rounded-2xl sm:shadow-lg overflow-hidden">
      <CardHeader className="bg-primary/5 border-b p-5 sm:p-8 text-center space-y-3">
         <div className="mx-auto max-w-[160px] sm:max-w-[200px]">
          <Logo logo={logo} />
        </div>
        <CardTitle className="text-xl sm:text-2xl font-headline">
            {isEditMode ? 'Edit Booking Application' : 'Booking Application'}
        </CardTitle>
        {!isEditMode && (
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Tell us about your boat and the work you need — our service team will confirm your booking.
            </p>
        )}
      </CardHeader>
      <CardContent className="p-4 sm:p-8">
        <StepIndicator currentStep={currentStep} />
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            {renderStep()}
             <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 mt-8">
                {currentStep > 1 ? (
                    <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto" onClick={handleBack}>
                        <ArrowLeft /> Back
                    </Button>
                ) : <div className="hidden sm:block" />}

                {currentStep < TOTAL_STEPS ? (
                     <Button type="button" size="lg" className="w-full sm:w-auto" onClick={handleNext}>
                        Next <ArrowRight />
                    </Button>
                ) : (
                    <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
                        {isSubmitting
                            ? (isEditMode ? 'Saving...' : 'Submitting...')
                            : (isEditMode ? 'Save Changes' : 'Submit Application')} <Send />
                    </Button>
                )}
            </div>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
