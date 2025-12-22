
"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="text-lg font-semibold text-primary">{title}</h3>
);

export default function StepVessel() {
  const { control } = useFormContext();

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader title="Boat Details (Optional)" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <FormField control={control} name="boatMake" render={({ field }) => ( <FormItem><FormLabel>Make</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem> )} />
            <FormField control={control} name="boatModel" render={({ field }) => ( <FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem> )} />
            <FormField control={control} name="boatHin" render={({ field }) => ( <FormItem><FormLabel>HIN</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem> )} />
            <FormField control={control} name="boatRegistrationNumber" render={({ field }) => ( <FormItem><FormLabel>Registration Number</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem> )} />
        </div>
      </div>

      <Separator />

       <div>
        <SectionHeader title="Engine Details (Optional)" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <FormField control={control} name="engineMake" render={({ field }) => ( <FormItem><FormLabel>Make</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem> )} />
            <FormField control={control} name="engineModel" render={({ field }) => ( <FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem> )} />
            <FormField control={control} name="engineSerialNumber" render={({ field }) => ( <FormItem><FormLabel>Serial Number</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem> )} />
        </div>
      </div>
      
       <Separator />
      
      <div>
        <SectionHeader title="Trailer Details (Optional)" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <FormField control={control} name="trailerMake" render={({ field }) => ( <FormItem><FormLabel>Make</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem> )} />
            <FormField control={control} name="trailerModel" render={({ field }) => ( <FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem> )} />
            <FormField control={control} name="trailerVin" render={({ field }) => ( <FormItem><FormLabel>VIN</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem> )} />
            <FormField control={control} name="trailerRegistration" render={({ field }) => ( <FormItem><FormLabel>Registration</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem> )} />
        </div>
      </div>
    </div>
  );
}
