
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useKitForm } from './KitCreationForm';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CardTitle, CardDescription, CardHeader } from '@/components/ui/card';

const kitDetailsSchema = z.object({
  name: z.string().min(1, "Kit name is required."),
});

type FormValues = z.infer<typeof kitDetailsSchema>;

export default function StepKitDetails() {
  const { kitData, setKitData, handleNext } = useKitForm();

  const form = useForm<FormValues>({
    resolver: zodResolver(kitDetailsSchema),
    defaultValues: {
      name: kitData?.name || '',
    },
  });
  
  const onSubmit = (data: FormValues) => {
    setKitData(prev => ({
        ...prev,
        ...data
    }));
    handleNext();
  };

  return (
    <>
      <CardHeader className="p-0 mb-6">
        <CardTitle className="font-headline text-2xl">Kit Name</CardTitle>
        <CardDescription>
         Give your new kit a descriptive name.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Kit Name</FormLabel>
                <FormControl>
                    <Input {...field} placeholder="e.g., Jeanneau 695 Antifoul & Service Kit" />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
          <div className="flex justify-end">
            <Button type="submit">Next</Button>
          </div>
        </form>
      </Form>
    </>
  );
}
