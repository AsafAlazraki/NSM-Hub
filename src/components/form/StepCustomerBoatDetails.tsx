
"use client";

import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuoteForm } from './QuoteCreationForm';
import type { Customer, Boat, Motor, Trailer, UserDetails, Quote, EstimateType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { CardTitle, CardDescription, CardHeader } from '@/components/ui/card';
import { Trash2, PlusCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const motorSchema = z.object({
  id: z.string(),
  make: z.string().optional(),
  model: z.string().optional(),
  serial: z.string().optional(),
});

const customerBoatSchema = z.object({
  user: z.object({
    ref: z.string().optional(),
  }),
  customer: z.object({
    name: z.string().min(1, "Customer Name is required."),
    address: z.object({
        street: z.string().optional(),
        suburb: z.string().optional(),
        state: z.string().optional(),
        postcode: z.string().optional(),
    }),
    phone: z.string().optional(),
    email: z.string().email("Invalid email address").or(z.literal("")).optional(),
  }),
  boat: z.object({
    make: z.string().optional(),
    model: z.string().optional(),
    registration: z.string().optional(),
    hin: z.string().optional(),
    insuranceRef: z.string().optional(),
  }),
  motors: z.array(motorSchema).optional(),
  trailer: z.object({
    make: z.string().optional(),
    model: z.string().optional(),
    registration: z.string().optional(),
    vin: z.string().optional(),
  }),
  estimateType: z.string().min(1, "Please select an estimate type."),
});


type FormValues = {
  user: Pick<UserDetails, 'ref'>;
  customer: Customer;
  boat: Boat;
  motors: Motor[];
  trailer: Trailer;
  estimateType: EstimateType;
}

interface StepCustomerBoatDetailsProps {
    quoteData: Partial<Quote>;
}

export default function StepCustomerBoatDetails({ quoteData }: StepCustomerBoatDetailsProps) {
  const { setQuoteData, handleNext, handleBack, isEditMode } = useQuoteForm();

  const form = useForm<FormValues>({
    resolver: zodResolver(customerBoatSchema),
    defaultValues: {
      user: {
        ref: quoteData.user?.ref?.replace('JC', '') || '',
      },
      customer: {
        name: quoteData.customer?.name || '',
        phone: quoteData.customer?.phone || '',
        email: quoteData.customer?.email || '',
        address: {
          street: quoteData.customer?.address?.street || '',
          suburb: quoteData.customer?.address?.suburb || '',
          state: quoteData.customer?.address?.state || '',
          postcode: quoteData.customer?.address?.postcode || '',
        }
      },
      boat: {
        make: quoteData.boat?.make || '',
        model: quoteData.boat?.model || '',
        registration: quoteData.boat?.registration || '',
        hin: quoteData.boat?.hin || '',
        insuranceRef: quoteData.boat?.insuranceRef || '',
      },
      motors: quoteData.motors || [],
      trailer: {
        make: quoteData.trailer?.make || '',
        model: quoteData.trailer?.model || '',
        registration: quoteData.trailer?.registration || '',
        vin: quoteData.trailer?.vin || '',
      },
      estimateType: quoteData.estimateType || undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "motors",
  });


  const onSubmit = (data: FormValues) => {
    const jobCardNumber = data.user.ref;
    let quoteId = quoteData.id; 
    let fullRef = '';

    if (jobCardNumber) {
        fullRef = `JC${jobCardNumber}`;
        if (!isEditMode) {
             quoteId = `QT${jobCardNumber}`;
        }
    } else {
        // If no job card number, ensure we keep the temporary ID
        quoteId = quoteData.id?.startsWith('QUOTE-') ? quoteData.id : `QUOTE-${Date.now()}`;
    }
    
    setQuoteData(prev => ({
      ...prev,
      id: quoteId,
      user: {
        ...prev.user!,
        ref: fullRef,
      },
      customer: data.customer,
      boat: data.boat,
      motors: data.motors,
      trailer: data.trailer,
      estimateType: data.estimateType,
    }));
    handleNext();
  };
  
  const handleAddEngine = () => {
    append({ id: `motor-${Date.now()}`, make: '', model: '', serial: '' });
  };


  return (
    <>
      <CardHeader className="p-0 mb-6">
        <CardTitle className="font-headline text-2xl">Customer & Asset Details</CardTitle>
        <CardDescription>
          Enter reference numbers, customer's information, and details about their boat, motor, and trailer.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
         {/* Estimate Type Section */}
          <div>
            <h3 className="text-lg font-medium font-headline">Estimate Type</h3>
            <Separator className="my-2" />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField
                    control={form.control}
                    name="estimateType"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Estimate Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select an estimate type" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Installation">Installation</SelectItem>
                            <SelectItem value="Insurance">Insurance</SelectItem>
                            <SelectItem value="Mechanical Estimate">Mechanical Estimate</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
          </div>

         {/* References Section */}
          <div>
            <h3 className="text-lg font-medium font-headline">References</h3>
            <Separator className="my-2" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
               <FormField control={form.control} name="user.ref" render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Card # (Optional)</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                       <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted/50 text-muted-foreground sm:text-sm">JC</span>
                       <Input placeholder="12345" {...field} disabled={isEditMode} className="rounded-l-none" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="boat.insuranceRef" render={({ field }) => (
                <FormItem><FormLabel>Insurance Ref # (Optional)</FormLabel><FormControl><Input placeholder="INS-98765" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          </div>

          {/* Customer Details */}
          <div>
            <h3 className="text-lg font-medium font-headline">Customer</h3>
            <Separator className="my-2" />
            <div className="space-y-4 mt-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="customer.name" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="customer.phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="0412 345 678" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="customer.email" render={({ field }) => (
                <FormItem><FormLabel>Email (Optional)</FormLabel><FormControl><Input placeholder="john.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
               <FormField control={form.control} name="customer.address.street" render={({ field }) => (
                  <FormItem><FormLabel>Street Address (Optional)</FormLabel><FormControl><Input placeholder="123 Main St" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <FormField control={form.control} name="customer.address.suburb" render={({ field }) => (
                  <FormItem><FormLabel>Suburb (Optional)</FormLabel><FormControl><Input placeholder="Boondall" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="customer.address.state" render={({ field }) => (
                  <FormItem><FormLabel>State (Optional)</FormLabel><FormControl><Input placeholder="QLD" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="customer.address.postcode" render={({ field }) => (
                  <FormItem><FormLabel>Postcode (Optional)</FormLabel><FormControl><Input placeholder="2294" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </div>
          </div>

          {/* Boat Details */}
          <div>
            <h3 className="text-lg font-medium font-headline">Boat (Optional)</h3>
            <Separator className="my-2" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField control={form.control} name="boat.make" render={({ field }) => (
                  <FormItem><FormLabel>Make</FormLabel><FormControl><Input placeholder="Jeanneau" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="boat.model" render={({ field }) => (
                  <FormItem><FormLabel>Model</FormLabel><FormControl><Input placeholder="Merry Fisher 695" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="boat.registration" render={({ field }) => (
                  <FormItem><FormLabel>Registration</FormLabel><FormControl><Input placeholder="AB123Q" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="boat.hin" render={({ field }) => (
                  <FormItem><FormLabel>HIN (Optional)</FormLabel><FormControl><Input placeholder="ABC12345D678" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          </div>
          
          {/* Optional Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Motor Details */}
            <div>
              <div className="flex items-center justify-between">
                 <h3 className="text-lg font-medium font-headline">Motor(s) (Optional)</h3>
                 <Button type="button" variant="outline" size="sm" onClick={handleAddEngine}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Engine
                </Button>
              </div>
              <Separator className="my-2" />
              <div className="space-y-4 mt-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                         <div className="flex justify-between items-center">
                            <Label className="font-semibold">Engine {index + 1}</Label>
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-destructive"/>
                            </Button>
                        </div>
                        <FormField control={form.control} name={`motors.${index}.make`} render={({ field }) => (<FormItem><FormLabel>Make</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name={`motors.${index}.model`} render={({ field }) => (<FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name={`motors.${index}.serial`} render={({ field }) => (<FormItem><FormLabel>Serial #</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>
                ))}
                {fields.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No engines added.</p>
                )}
              </div>
            </div>


            {/* Trailer Details */}
            <div>
              <h3 className="text-lg font-medium font-headline">Trailer (Optional)</h3>
              <Separator className="my-2" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <FormField control={form.control} name="trailer.make" render={({ field }) => (<FormItem><FormLabel>Make</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="trailer.model" render={({ field }) => (<FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="trailer.registration" render={({ field }) => (<FormItem><FormLabel>Registration</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="trailer.vin" render={({ field }) => (<FormItem><FormLabel>VIN</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
            <Button type="submit">Next</Button>
          </div>
        </form>
      </Form>
    </>
  );
}

    