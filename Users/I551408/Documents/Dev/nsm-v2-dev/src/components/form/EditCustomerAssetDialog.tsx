
"use client";

import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Customer, Boat, Motor, Trailer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PlusCircle, Trash2 } from 'lucide-react';

const motorSchema = z.object({
  id: z.string(),
  make: z.string().optional(),
  model: z.string().optional(),
  serial: z.string().optional(),
});

const customerAssetSchema = z.object({
  customer: z.object({
    name: z.string().optional(),
    address: z.object({
        street: z.string().optional(),
        suburb: z.string().optional(),
        state: z.string().optional(),
        postcode: z.string().optional(),
    }).optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email address").or(z.literal("")).optional(),
  }).optional(),
  boat: z.object({
    make: z.string().optional(),
    model: z.string().optional(),
    registration: z.string().optional(),
    hin: z.string().optional(),
    insuranceRef: z.string().optional(), // This is on boat, but shown in refs section. Keep it here for data structure.
  }).optional(),
  motors: z.array(motorSchema).optional(),
  trailer: z.object({
    make: z.string().optional(),
    model: z.string().optional(),
    registration: z.string().optional(),
    vin: z.string().optional(),
  }).optional(),
});

export type CustomerAssetData = z.infer<typeof customerAssetSchema>;

interface EditCustomerAssetDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (data: CustomerAssetData) => void;
  initialData?: Partial<CustomerAssetData>;
}

export const EditCustomerAssetDialog = ({ isOpen, setIsOpen, onSave, initialData }: EditCustomerAssetDialogProps) => {
  const form = useForm<CustomerAssetData>({
    resolver: zodResolver(customerAssetSchema),
    defaultValues: {
      customer: {
        name: initialData?.customer?.name || '',
        phone: initialData?.customer?.phone || '',
        email: initialData?.customer?.email || '',
        address: {
          street: initialData?.customer?.address?.street || '',
          suburb: initialData?.customer?.address?.suburb || '',
          state: initialData?.customer?.address?.state || '',
          postcode: initialData?.customer?.address?.postcode || '',
        }
      },
      boat: initialData?.boat || {},
      motors: initialData?.motors || [],
      trailer: initialData?.trailer || {},
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "motors",
  });
  
  const handleAddEngine = () => {
    append({ id: `motor-${Date.now()}`, make: '', model: '', serial: '' });
  };

  useEffect(() => {
    if (initialData && isOpen) {
      form.reset({
        customer: {
            name: initialData.customer?.name || '',
            phone: initialData.customer?.phone || '',
            email: initialData.customer?.email || '',
            address: {
                street: initialData.customer?.address?.street || '',
                suburb: initialData.customer?.address?.suburb || '',
                state: initialData.customer?.address?.state || '',
                postcode: initialData.customer?.address?.postcode || '',
            }
        },
        boat: {
            make: initialData.boat?.make || '',
            model: initialData.boat?.model || '',
            registration: initialData.boat?.registration || '',
            hin: initialData.boat?.hin || '',
            insuranceRef: initialData.boat?.insuranceRef || '',
        },
        motors: initialData.motors?.map(m => {
            if (!m) return { id: `motor-${Date.now()}`, make: '', model: '', serial: '' };
            return {
                id: m.id || `motor-${Date.now()}`,
                make: m.make || '',
                model: m.model || '',
                serial: m.serial || ''
            };
        }) || [],
        trailer: {
            make: initialData.trailer?.make || '',
            model: initialData.trailer?.model || '',
            registration: initialData.trailer?.registration || '',
            vin: initialData.trailer?.vin || '',
        },
      });
    }
  }, [initialData, form, isOpen]);

  const onSubmit = (data: CustomerAssetData) => {
    onSave(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Edit Customer & Asset Details</DialogTitle>
          <DialogDescription>
            Update the details for the customer and their assets.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
            
            {/* Customer Details */}
            <div>
              <h3 className="text-lg font-medium font-headline">Customer</h3>
              <Separator className="my-2" />
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="customer.name" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="customer.phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="0412 345 678" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="customer.email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="john.doe@example.com" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="customer.address.street" render={({ field }) => (
                    <FormItem><FormLabel>Street Address</FormLabel><FormControl><Input placeholder="123 Main St" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                  )} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="customer.address.suburb" render={({ field }) => (
                    <FormItem><FormLabel>Suburb</FormLabel><FormControl><Input placeholder="Boondall" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="customer.address.state" render={({ field }) => (
                    <FormItem><FormLabel>State</FormLabel><FormControl><Input placeholder="QLD" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="customer.address.postcode" render={({ field }) => (
                    <FormItem><FormLabel>Postcode</FormLabel><FormControl><Input placeholder="2294" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>
            </div>

            {/* Boat Details */}
            <div>
              <h3 className="text-lg font-medium font-headline">Boat</h3>
              <Separator className="my-2" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField control={form.control} name="boat.make" render={({ field }) => (
                    <FormItem><FormLabel>Make</FormLabel><FormControl><Input placeholder="Jeanneau" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="boat.model" render={({ field }) => (
                    <FormItem><FormLabel>Model</FormLabel><FormControl><Input placeholder="Merry Fisher 695" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="boat.registration" render={({ field }) => (
                    <FormItem><FormLabel>Registration</FormLabel><FormControl><Input placeholder="AB123Q" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="boat.hin" render={({ field }) => (
                    <FormItem><FormLabel>HIN</FormLabel><FormControl><Input placeholder="ABC12345D678" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </div>
            
            {/* Optional Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Motor Details */}
              <div>
                 <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium font-headline">Motor(s)</h3>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddEngine}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Engine
                    </Button>
                </div>
                <Separator className="my-2" />
                <div className="space-y-4 mt-4">
                   {fields.map((field, index) => {
                      if (!field) return null;
                      return (
                        <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                            <div className="flex justify-between items-center">
                                <FormLabel className="font-semibold">Engine {index + 1}</FormLabel>
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>
                            </div>
                            <FormField control={form.control} name={`motors.${index}.make`} render={({ field }) => (<FormItem><FormLabel>Make</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name={`motors.${index}.model`} render={({ field }) => (<FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name={`motors.${index}.serial`} render={({ field }) => (<FormItem><FormLabel>Serial #</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>)} />
                        </div>
                      );
                   })}
                  {fields.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No engines added.</p>
                  )}
                </div>
              </div>

              {/* Trailer Details */}
              <div>
                <h3 className="text-lg font-medium font-headline">Trailer</h3>
                <Separator className="my-2" />
                <div className="space-y-4 mt-4">
                  <FormField control={form.control} name="trailer.make" render={({ field }) => (<FormItem><FormLabel>Make</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>)} />
                  <FormField control={form.control} name="trailer.model" render={({ field }) => (<FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>)} />
                  <FormField control={form.control} name="trailer.registration" render={({ field }) => (<FormItem><FormLabel>Registration</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>)} />
                  <FormField control={form.control} name="trailer.vin" render={({ field }) => (<FormItem><FormLabel>VIN</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>)} />
                </div>
              </div>
            </div>
            
            <DialogFooter className="sticky bottom-0 bg-background/95 pt-4 -mx-4 px-4 pb-0">
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
