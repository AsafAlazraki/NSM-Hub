
"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="text-lg font-semibold text-primary">{title}</h3>
);

export default function StepDates() {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
        <SectionHeader title="Booking Dates" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={control} name="bookingDateRequested" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Booking Date Requested</FormLabel>
                   <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                   </FormControl>
                <FormMessage />
                </FormItem>
            )} />
            <FormField control={control} name="dateRequiredForCollection" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Date Required for Collection</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                   </FormControl>
                <FormMessage />
                </FormItem>
            )} />
        </div>
    </div>
  );
}
