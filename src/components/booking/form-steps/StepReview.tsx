
"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

const SummaryItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  value ? (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  ) : null
);

const Section = ({ title, onEdit, children }: { title: string, onEdit: () => void, children: React.ReactNode }) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <h4 className="text-lg font-semibold">{title}</h4>
      <Button variant="ghost" size="sm" onClick={onEdit}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
    </div>
    <div className="space-y-2 rounded-md border p-4 bg-muted/20">
      {children}
    </div>
  </div>
);

export default function StepReview({ setStep }: { setStep: (step: number) => void }) {
  const { getValues } = useFormContext();
  const data = getValues();

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold font-headline text-center">Review Your Application</h3>

      <Section title="Customer Details" onEdit={() => setStep(1)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SummaryItem label="Full Name" value={data.customerName} />
          <SummaryItem label="Mobile Number" value={data.customerMobileNumber} />
          <SummaryItem label="Email Address" value={data.customerEmail} />
          <SummaryItem label="Address" value={data.customerAddress} />
        </div>
      </Section>

      <Section title="Vessel Details" onEdit={() => setStep(2)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SummaryItem label="Boat Make" value={data.boatMake} />
          <SummaryItem label="Boat Model" value={data.boatModel} />
          <SummaryItem label="Boat HIN" value={data.boatHin} />
          <SummaryItem label="Boat Registration" value={data.boatRegistrationNumber} />
          <Separator className="sm:col-span-2" />
          <SummaryItem label="Engine Make" value={data.engineMake} />
          <SummaryItem label="Engine Model" value={data.engineModel} />
          <SummaryItem label="Engine Serial" value={data.engineSerialNumber} />
           <Separator className="sm:col-span-2" />
          <SummaryItem label="Trailer Make" value={data.trailerMake} />
          <SummaryItem label="Trailer Model" value={data.trailerModel} />
          <SummaryItem label="Trailer VIN" value={data.trailerVin} />
          <SummaryItem label="Trailer Registration" value={data.trailerRegistration} />
        </div>
      </Section>

      <Section title="Work to be Performed" onEdit={() => setStep(3)}>
        <p className="whitespace-pre-wrap">{data.workToBePerformed}</p>
      </Section>

      <Section title="Booking Dates" onEdit={() => setStep(4)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SummaryItem label="Booking Date Requested" value={data.bookingDateRequested || 'N/A'} />
            <SummaryItem label="Date Required for Collection" value={data.dateRequiredForCollection || 'N/A'} />
        </div>
      </Section>
    </div>
  );
}
