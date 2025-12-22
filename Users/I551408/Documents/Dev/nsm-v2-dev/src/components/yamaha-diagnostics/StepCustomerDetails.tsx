
"use client";

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useReportForm } from './ReportFormProvider';
import type { Customer, Quote } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CardTitle, CardDescription, CardHeader } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { getQuotes } from '@/lib/storage';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const customerSchema = z.object({
  name: z.string().min(1, "Customer Name is required."),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").or(z.literal("")).optional(),
  address: z.object({
      street: z.string().optional(),
      suburb: z.string().optional(),
      state: z.string().optional(),
      postcode: z.string().optional(),
  }).optional(),
});

type FormValues = {
  customer: Omit<Customer, 'id'>;
}

const aggregateCustomers = (quotes: Quote[]): Customer[] => {
    const customerMap = new Map<string, Customer>();
    quotes.forEach(quote => {
        if (quote?.customer?.name) {
            const sanitizedName = quote.customer.name.toLowerCase().trim().replace(/\//g, '-');
            const key = `${sanitizedName}|${quote.customer.phone || ''}`;
            if (!customerMap.has(key)) {
                customerMap.set(key, { ...quote.customer, id: key });
            }
        }
    });
    return Array.from(customerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};

export default function StepCustomerDetails() {
  const { reportData, setReportData, handleNext } = useReportForm();
  const [existingCustomers, setExistingCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    getQuotes().then(quotes => {
        const aggregated = aggregateCustomers(quotes);
        setExistingCustomers(aggregated);
        setIsLoadingCustomers(false);
    });
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(
        z.object({ customer: customerSchema })
    ),
    defaultValues: {
      customer: {
        name: reportData.customer?.name || '',
        phone: reportData.customer?.phone || '',
        email: reportData.customer?.email || '',
        address: {
          street: reportData.customer?.address?.street || '',
          suburb: reportData.customer?.address?.suburb || '',
          state: reportData.customer?.address?.state || '',
          postcode: reportData.customer?.address?.postcode || '',
        }
      },
    },
  });

  const onSubmit = (data: FormValues) => {
    setReportData(prev => ({
      ...prev,
      customer: data.customer,
    }));
    handleNext();
  };
  
  const handleCustomerSelect = (customer: Customer) => {
      form.setValue('customer.name', customer.name);
      form.setValue('customer.phone', customer.phone || '');
      form.setValue('customer.email', customer.email || '');
      form.setValue('customer.address.street', customer.address?.street || '');
      form.setValue('customer.address.suburb', customer.address?.suburb || '');
      form.setValue('customer.address.state', customer.address?.state || '');
      form.setValue('customer.address.postcode', customer.address?.postcode || '');
      setPopoverOpen(false);
  }

  return (
    <>
      <CardHeader className="p-0 mb-6">
        <CardTitle className="font-headline text-2xl">Customer Details</CardTitle>
        <CardDescription>
          Select an existing customer or enter details for a new one.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <FormLabel>Existing Customer</FormLabel>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={popoverOpen}
                    className="w-full justify-between"
                  >
                    {form.watch('customer.name')
                      ? existingCustomers.find((c) => c.name === form.watch('customer.name'))?.name
                      : 'Select customer...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search customers..." />
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        {existingCustomers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={customer.name}
                            onSelect={() => handleCustomerSelect(customer)}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                form.watch('customer.name') === customer.name ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {customer.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center">
                <Separator className="flex-1" />
                <span className="px-4 text-sm text-muted-foreground">OR</span>
                <Separator className="flex-1" />
            </div>

            <FormField
              control={form.control}
              name="customer.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Customer Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="John Doe" value={field.value || ''}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="customer.phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="customer.email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="customer.address.street" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />

          <div className="flex justify-end">
            <Button type="submit">Next</Button>
          </div>
        </form>
      </Form>
    </>
  );
}
