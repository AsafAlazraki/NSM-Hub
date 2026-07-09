"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="text-lg font-semibold text-primary">{title}</h3>
);

const Req = () => <span className="text-destructive" aria-hidden="true"> *</span>;

export default function StepWork() {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
        <SectionHeader title="Work to be Performed" />
        <FormField control={control} name="workToBePerformed" render={({ field }) => (
            <FormItem>
                <FormLabel>Please describe the work you would like to have performed.<Req /></FormLabel>
                <FormControl><Textarea className="text-base md:text-sm" {...field} value={field.value || ''} rows={8} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />
    </div>
  );
}
