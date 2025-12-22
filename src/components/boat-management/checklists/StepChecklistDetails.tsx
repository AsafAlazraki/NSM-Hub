"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useChecklistForm } from './ChecklistCreationForm';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CardTitle, CardDescription, CardHeader } from '@/components/ui/card';
import { getChecklistTypes } from '@/lib/storage';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const checklistDetailsSchema = z.object({
  name: z.string().min(1, "Checklist name is required."),
  type: z.string().min(1, "Checklist type is required."),
});

type FormValues = z.infer<typeof checklistDetailsSchema>;

const TypeSelectionDialog = ({
  isOpen,
  setIsOpen,
  types,
  onSelect,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  types: string[];
  onSelect: (type: string) => void;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select an Existing Checklist Type</DialogTitle>
          <DialogDescription>
            Click a type to use it for your new checklist.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72 w-full rounded-md border">
            <div className="p-4">
                {types.length > 0 ? (
                    <div className="space-y-2">
                    {types.map((type) => (
                        <div
                            key={type}
                            onClick={() => onSelect(type)}
                            className="p-2 rounded-md hover:bg-accent cursor-pointer"
                        >
                            <p className="font-medium">{type}</p>
                        </div>
                    ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-4">
                        No existing types found.
                    </div>
                )}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};


export default function StepChecklistDetails() {
  const { checklistData, setChecklistData, handleNext } = useChecklistForm();
  const [types, setTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);

  useEffect(() => {
    getChecklistTypes()
      .then(setTypes)
      .finally(() => setIsLoading(false));
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(checklistDetailsSchema),
    defaultValues: {
      name: checklistData?.name || '',
      type: checklistData?.type || '',
    },
  });
  
  const onSubmit = (data: FormValues) => {
    setChecklistData(prev => ({
        ...prev,
        ...data
    }));
    handleNext();
  };
  
  const handleTypeSelect = (type: string) => {
    form.setValue('type', type, { shouldValidate: true });
    setIsTypeDialogOpen(false);
  };

  return (
    <>
      <TypeSelectionDialog 
        isOpen={isTypeDialogOpen}
        setIsOpen={setIsTypeDialogOpen}
        types={types}
        onSelect={handleTypeSelect}
      />
      <CardHeader className="p-0 mb-6 flex-row justify-between items-start">
        <div>
            <CardTitle className="font-headline text-2xl">Checklist Details</CardTitle>
            <CardDescription>
             Enter the name and type for this new checklist.
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
                  <FormLabel>Checklist Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Pre-delivery Inspection" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Checklist Type</FormLabel>
                        <div className="flex gap-2">
                           <FormControl>
                                <Input {...field} placeholder="Enter a new or existing type" />
                           </FormControl>
                            <Button type="button" variant="outline" onClick={() => setIsTypeDialogOpen(true)} disabled={isLoading}>
                                {isLoading ? 'Loading...' : 'Browse'}
                            </Button>
                        </div>
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
