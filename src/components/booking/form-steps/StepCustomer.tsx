
"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="text-lg font-semibold text-primary">{title}</h3>
);

export default function StepCustomer() {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
        <SectionHeader title="Customer Details" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={control} name="customerName" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={control} name="customerMobileNumber" render={({ field }) => ( <FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
        </div>
        <FormField control={control} name="customerAddress" render={({ field }) => ( <FormItem><FormLabel>Address (Optional)</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
        <FormField control={control} name="customerEmail" render={({ field }) => ( <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input {...field} type="email" value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
    </div>
  );
}
