
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuoteForm } from './QuoteCreationForm';
import type { UserDetails } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CardTitle, CardDescription, CardHeader } from '@/components/ui/card';

const userDetailsSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").or(z.literal("")).optional(),
  role: z.string().optional(),
});

type FormValues = Omit<UserDetails, 'ref'>;

export default function StepUserDetails() {
  const { quoteData, setQuoteData, handleNext, isEditMode } = useQuoteForm();

  const form = useForm<FormValues>({
    resolver: zodResolver(userDetailsSchema),
    defaultValues: {
      name: quoteData?.user?.name || '',
      phone: quoteData?.user?.phone || '',
      email: quoteData?.user?.email || '',
      role: quoteData?.user?.role || '',
    },
  });
  
  useEffect(() => {
    // Ensure quoteData.user exists before resetting the form
    if (quoteData?.user) {
      form.reset({
        name: quoteData.user.name || '',
        phone: quoteData.user.phone || '',
        email: quoteData.user.email || '',
        role: quoteData.user.role || '',
      });
    }
  }, [quoteData?.user, form]);


  const onSubmit = (data: FormValues) => {
    setQuoteData(prev => ({
        ...prev,
        user: {
            ...(prev.user!),
            ...data
        }
    }));
    handleNext();
  };

  return (
    <>
      <CardHeader className="p-0 mb-6 flex-row justify-between items-start">
        <div>
            <CardTitle className="font-headline text-2xl">User Details</CardTitle>
            <CardDescription>
             {isEditMode ? 'Edit the user details for this quote.' : 'Enter the user details for this quote.'}
            </CardDescription>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Your full name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Role</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Service Manager" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Phone</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Your phone number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Email</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="your.email@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Next</Button>
          </div>
        </form>
      </Form>
    </>
  );
}
