"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="text-lg font-semibold text-primary">{title}</h3>
);

const Req = () => <span className="text-destructive" aria-hidden="true"> *</span>;

const inputClass = "h-11 text-base md:h-10 md:text-sm";

export default function StepCustomer() {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
        <SectionHeader title="Customer Details" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={control} name="customerName" render={({ field }) => ( <FormItem><FormLabel>Full Name<Req /></FormLabel><FormControl><Input className={inputClass} autoComplete="name" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={control} name="customerMobileNumber" render={({ field }) => ( <FormItem><FormLabel>Mobile Number<Req /></FormLabel><FormControl><Input className={inputClass} type="tel" autoComplete="tel" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
        </div>
        <FormField control={control} name="customerAddress" render={({ field }) => ( <FormItem><FormLabel>Address (Optional)</FormLabel><FormControl><Input className={inputClass} autoComplete="street-address" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
        <FormField control={control} name="customerEmail" render={({ field }) => ( <FormItem><FormLabel>Email Address<Req /></FormLabel><FormControl><Input className={inputClass} type="email" autoComplete="email" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
    </div>
  );
}
