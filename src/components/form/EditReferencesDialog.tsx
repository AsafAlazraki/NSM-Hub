
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const referencesSchema = z.object({
  ourRef: z.string().min(1, "Our Reference is required."),
  insuranceRef: z.string().optional(),
});

export type ReferencesData = z.infer<typeof referencesSchema>;

interface EditReferencesDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (data: ReferencesData) => void;
  initialData?: ReferencesData;
}

export const EditReferencesDialog = ({ isOpen, setIsOpen, onSave, initialData }: EditReferencesDialogProps) => {
  const form = useForm<ReferencesData>({
    resolver: zodResolver(referencesSchema),
    defaultValues: {
      ourRef: initialData?.ourRef || '',
      insuranceRef: initialData?.insuranceRef || '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ourRef: initialData.ourRef || '',
        insuranceRef: initialData.insuranceRef || '',
      });
    }
  }, [initialData, form, isOpen]);

  const onSubmit = (data: ReferencesData) => {
    onSave(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Edit References</DialogTitle>
          <DialogDescription>
            Update the reference numbers for this quote.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="ourRef"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Card #</FormLabel>
                   <FormControl>
                    <div className="flex items-center">
                       <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted/50 text-muted-foreground sm:text-sm">JC</span>
                       <Input 
                        placeholder="123456" 
                        {...field} 
                        // Strip "JC" before showing in input
                        value={field.value?.replace('JC', '') || ''}
                        // Add "JC" back on change
                        onChange={(e) => field.onChange(`JC${e.target.value}`)}
                        className="rounded-l-none" 
                       />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="insuranceRef"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Insurance Reference # (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="INS-98765" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

    