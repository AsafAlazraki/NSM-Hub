"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="text-lg font-semibold text-primary">{title}</h3>
);

const Req = () => <span className="text-destructive" aria-hidden="true"> *</span>;

const inputClass = "h-11 text-base md:h-10 md:text-sm";

const NSM_BRANCHES = ['Boondall', 'Coomera'] as const;

export default function StepCustomer() {
  const { control } = useFormContext();

  return (
    <div className="space-y-6">
        <div className="space-y-3">
            <SectionHeader title="NSM Location" />
            <FormField control={control} name="location" render={({ field }) => (
                <FormItem>
                    <FormLabel>Which NSM location would you like to bring your boat to?<Req /></FormLabel>
                    <FormControl>
                        <RadioGroup
                            value={field.value || ''}
                            onValueChange={field.onChange}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                        >
                            {NSM_BRANCHES.map(branch => (
                                <label
                                    key={branch}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors',
                                        field.value === branch
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary/40'
                                    )}
                                >
                                    <RadioGroupItem value={branch} />
                                    <MapPin className={cn('h-5 w-5', field.value === branch ? 'text-primary' : 'text-muted-foreground')} />
                                    <span className="font-semibold text-base">{branch}</span>
                                </label>
                            ))}
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        </div>

        <div className="space-y-4">
        <SectionHeader title="Customer Details" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={control} name="customerName" render={({ field }) => ( <FormItem><FormLabel>Full Name<Req /></FormLabel><FormControl><Input className={inputClass} autoComplete="name" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={control} name="customerMobileNumber" render={({ field }) => ( <FormItem><FormLabel>Mobile Number<Req /></FormLabel><FormControl><Input className={inputClass} type="tel" autoComplete="tel" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
        </div>
        <FormField control={control} name="customerAddress" render={({ field }) => ( <FormItem><FormLabel>Address<Req /></FormLabel><FormControl><Input className={inputClass} autoComplete="street-address" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
        <FormField control={control} name="customerEmail" render={({ field }) => ( <FormItem><FormLabel>Email Address<Req /></FormLabel><FormControl><Input className={inputClass} type="email" autoComplete="email" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
        </div>
    </div>
  );
}
