
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import type { InsuranceCompany } from '@/lib/types';

const referencesSchema = z.object({
  ourRef: z.string().min(1, "Our Reference is required."),
  insuranceRef: z.string().optional(),
  insurerName: z.string().optional(),
  insurerEmail: z.string().optional(),
  insurerPhone: z.string().optional(),
  insurerAbn: z.string().optional(),
});

type FormValues = z.infer<typeof referencesSchema>;

export interface ReferencesData {
  ourRef: string;
  insuranceRef?: string;
  insuranceCompany: InsuranceCompany | null;
}

// Known insurers with their claims contact details (sourced from existing quotes).
const INSURER_PRESETS: InsuranceCompany[] = [
  { name: 'Club Marine Limited', email: 'claims@clubmarine.com.au', phone: '1300002582', abn: '12 007 588 347' },
  { name: 'NRMA', email: 'pliclaims@iag.com.au', phone: '1800634686', abn: '60 090 739 923' },
  { name: 'RACQ', email: 'racqiclaims@racq.com.au', phone: '131905', abn: '50 009 704 152' },
];

interface EditReferencesDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (data: ReferencesData) => void;
  initialData?: {
    ourRef?: string;
    insuranceRef?: string;
    insuranceCompany?: InsuranceCompany | null;
  };
}

export const EditReferencesDialog = ({ isOpen, setIsOpen, onSave, initialData }: EditReferencesDialogProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(referencesSchema),
    defaultValues: {
      ourRef: initialData?.ourRef || '',
      insuranceRef: initialData?.insuranceRef || '',
      insurerName: initialData?.insuranceCompany?.name || '',
      insurerEmail: initialData?.insuranceCompany?.email || '',
      insurerPhone: initialData?.insuranceCompany?.phone || '',
      insurerAbn: initialData?.insuranceCompany?.abn || '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ourRef: initialData.ourRef || '',
        insuranceRef: initialData.insuranceRef || '',
        insurerName: initialData.insuranceCompany?.name || '',
        insurerEmail: initialData.insuranceCompany?.email || '',
        insurerPhone: initialData.insuranceCompany?.phone || '',
        insurerAbn: initialData.insuranceCompany?.abn || '',
      });
    }
  }, [initialData, form, isOpen]);

  const applyPreset = (presetName: string) => {
    if (presetName === '__none__') {
      form.setValue('insurerName', '');
      form.setValue('insurerEmail', '');
      form.setValue('insurerPhone', '');
      form.setValue('insurerAbn', '');
      return;
    }
    const preset = INSURER_PRESETS.find(p => p.name === presetName);
    if (preset) {
      form.setValue('insurerName', preset.name);
      form.setValue('insurerEmail', preset.email || '');
      form.setValue('insurerPhone', preset.phone || '');
      form.setValue('insurerAbn', preset.abn || '');
    }
  };

  const onSubmit = (data: FormValues) => {
    onSave({
      ourRef: data.ourRef,
      insuranceRef: data.insuranceRef,
      insuranceCompany: data.insurerName?.trim()
        ? {
            name: data.insurerName.trim(),
            email: data.insurerEmail?.trim() || '',
            phone: data.insurerPhone?.trim() || '',
            abn: data.insurerAbn?.trim() || '',
          }
        : null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit References</DialogTitle>
          <DialogDescription>
            Update the reference numbers and insurance company for this quote.
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

            <Separator />

            <div>
              <Label className="text-sm font-medium">Insurance Company (Optional)</Label>
              <Select onValueChange={applyPreset} value="">
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose an insurer to pre-fill details..." />
                </SelectTrigger>
                <SelectContent>
                  {INSURER_PRESETS.map(p => (
                    <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                  ))}
                  <SelectItem value="__none__">None / clear insurer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="insurerName"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Insurer Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Club Marine Limited" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="insurerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Claims Email</FormLabel>
                    <FormControl><Input placeholder="claims@insurer.com.au" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="insurerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input placeholder="1300 000 000" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="insurerAbn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ABN</FormLabel>
                    <FormControl><Input placeholder="00 000 000 000" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
