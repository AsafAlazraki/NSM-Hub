"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="text-lg font-semibold text-primary">{title}</h3>
);

const Req = () => <span className="text-destructive" aria-hidden="true"> *</span>;

const inputClass = "h-11 text-base md:h-10 md:text-sm";

export default function StepVessel() {
  const { control } = useFormContext();

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader title="Boat Details" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <FormField control={control} name="boatMake" render={({ field }) => ( <FormItem><FormLabel>Make<Req /></FormLabel><FormControl><Input className={inputClass} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={control} name="boatModel" render={({ field }) => ( <FormItem><FormLabel>Model<Req /></FormLabel><FormControl><Input className={inputClass} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={control} name="boatHin" render={({ field }) => ( <FormItem><FormLabel>HIN (Optional)</FormLabel><FormControl><Input className={inputClass} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={control} name="boatRegistrationNumber" render={({ field }) => ( <FormItem><FormLabel>Registration Number<Req /></FormLabel><FormControl><Input className={inputClass} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
        </div>
      </div>

      <Separator />

       <div>
        <SectionHeader title="Engine Details" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <FormField control={control} name="engineMake" render={({ field }) => ( <FormItem><FormLabel>Make<Req /></FormLabel><FormControl><Input className={inputClass} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={control} name="engineModel" render={({ field }) => ( <FormItem><FormLabel>Model<Req /></FormLabel><FormControl><Input className={inputClass} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={control} name="engineSerialNumber" render={({ field }) => ( <FormItem><FormLabel>Serial Number (Optional)</FormLabel><FormControl><Input className={inputClass} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
        </div>
      </div>

       <Separator />

      <div>
        <SectionHeader title="Trailer Details" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <FormField control={control} name="trailerMake" render={({ field }) => ( <FormItem><FormLabel>Make<Req /></FormLabel><FormControl><Input className={inputClass} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={control} name="trailerModel" render={({ field }) => ( <FormItem><FormLabel>Model<Req /></FormLabel><FormControl><Input className={inputClass} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={control} name="trailerVin" render={({ field }) => ( <FormItem><FormLabel>VIN (Optional)</FormLabel><FormControl><Input className={inputClass} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={control} name="trailerRegistration" render={({ field }) => ( <FormItem><FormLabel>Registration<Req /></FormLabel><FormControl><Input className={inputClass} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
        </div>
      </div>
    </div>
  );
}
