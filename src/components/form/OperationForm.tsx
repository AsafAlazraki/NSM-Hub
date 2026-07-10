
"use client";

import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Operation, Part, CataloguePart } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Trash2, PlusCircle, Sparkles, Loader2, Save, XCircle, BookMarked } from 'lucide-react';
import { generateOperationDescription } from '@/ai/flows/generate-operation-description';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { PartsCatalogueDialog } from './PartsCatalogueDialog';


const partSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Part name is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  cost: z.coerce.number().min(0, "Cost cannot be negative."),
  costIncGst: z.coerce.number().min(0, "Cost cannot be negative.").optional(),
});

const operationSchema = z.object({
  id: z.string(),
  heading: z.string().min(1, "Operation heading is required."),
  customerNotes: z.string().optional(),
  description: z.string().optional(),
  laborRate: z.coerce.number().min(0),
  laborHours: z.coerce.number().min(0),
  parts: z.array(partSchema).optional(),
});

type OperationFormValues = z.infer<typeof operationSchema>;

interface OperationFormProps {
  onSave: (operation: Operation) => void;
  onCancel: () => void;
  initialData?: Partial<Operation> | null; 
}

export const OperationForm = ({ onSave, onCancel, initialData }: OperationFormProps) => {
  const isEditMode = !!initialData?.id;
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPartsCatalogueOpen, setIsPartsCatalogueOpen] = useState(false);

  const form = useForm<OperationFormValues>({
    resolver: zodResolver(operationSchema),
    defaultValues: {
      id: initialData?.id || `op-id-${Date.now()}-${Math.random()}`,
      heading: initialData?.heading || '',
      customerNotes: initialData?.customerNotes || '',
      description: initialData?.description || '',
      laborRate: initialData?.laborRate ?? 144.54,
      laborHours: initialData?.laborHours ?? 0,
      parts: initialData?.parts?.map(p => ({...p})) || [],
    },
  });

  // Effect to reset form if the specific instance of the form changes
  useEffect(() => {
    const newId = initialData?.id || `op-id-${Date.now()}-${Math.random()}`;
    form.reset({
      id: newId,
      heading: initialData?.heading || '',
      customerNotes: initialData?.customerNotes || '',
      description: initialData?.description || '',
      laborRate: initialData?.laborRate ?? 144.54,
      laborHours: initialData?.laborHours ?? 0,
      parts: initialData?.parts?.map(p => ({...p, id: p.id || `part-${Date.now()}-${Math.random()}`})) || [],
    });
  }, [initialData, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "parts",
  });

  const onSubmit = (data: OperationFormValues) => {
    // Re-type to Operation as `id` is guaranteed by the form logic.
    onSave(data as Operation);
    form.reset(); 
  };

  const handleGenerateDescription = async () => {
    const heading = form.getValues('heading');
    if (!heading) {
        toast({
            variant: "destructive",
            title: "Heading Required",
            description: "Please enter an operation heading first.",
        });
        return;
    }
    setIsGenerating(true);
    try {
        const result = await generateOperationDescription({ heading });
        form.setValue('description', result.description, { shouldValidate: true });
        toast({
            title: "Description Generated",
            description: "The AI-powered description has been added.",
        });
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Generation Failed",
            description: "Could not generate a description. Please try again.",
        });
    } finally {
        setIsGenerating(false);
    }
  };
  
  const laborRate = form.watch('laborRate');
  const laborHours = form.watch('laborHours');
  const laborTotal = (laborRate || 0) * (laborHours || 0);

  const parts = form.watch('parts');
  const partsTotal = (parts || []).reduce((sum, part) => sum + ((part.cost || 0) * (part.quantity || 1)), 0);

  const handleAddPart = () => {
    append({ id: `part-${Date.now()}-${Math.random()}`, name: '', cost: 0, quantity: 1, costIncGst: 0 });
  };
  
  const handleAddFromCatalogue = (part: CataloguePart) => {
    append({
        id: `part-${Date.now()}-${Math.random()}`,
        name: part.name,
        cost: part.cost,
        quantity: 1,
        costIncGst: part.costIncGst ?? Number((part.cost * 1.1).toFixed(2)),
    })
  }

  const handleCostChange = (index: number, value: number, field: 'cost' | 'costIncGst') => {
    if (isNaN(value)) return;
    if (field === 'cost') {
        const costIncGst = value * 1.1;
        form.setValue(`parts.${index}.cost`, value, { shouldValidate: true });
        form.setValue(`parts.${index}.costIncGst`, Number(costIncGst.toFixed(2)), { shouldValidate: true });
    } else {
        const costExGst = value / 1.1;
        form.setValue(`parts.${index}.costIncGst`, value, { shouldValidate: true });
        form.setValue(`parts.${index}.cost`, Number(costExGst.toFixed(2)), { shouldValidate: true });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, index: number, fieldName: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const formElement = e.currentTarget.form;
      if (!formElement) return;

      const fieldOrder = ['name', 'quantity', 'cost', 'costIncGst'];
      const currentFieldIndex = fieldOrder.indexOf(fieldName);
      
      if (currentFieldIndex > -1 && currentFieldIndex < fieldOrder.length - 1) {
        const nextFieldName = fieldOrder[currentFieldIndex + 1];
        const nextInput = formElement.querySelector(`[name="parts.${index}.${nextFieldName}"]`) as HTMLInputElement;
        nextInput?.focus();
      } else if (currentFieldIndex === fieldOrder.length - 1) {
          // If at the last field of a row, move to the first field of the next row if it exists
          const nextRowIndex = index + 1;
          if (nextRowIndex < fields.length) {
               const nextInput = formElement.querySelector(`[name="parts.${nextRowIndex}.name"]`) as HTMLInputElement;
               nextInput?.focus();
          } else {
              // Or add a new part if at the end
              handleAddPart();
          }
      }
    }
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  return (
    <>
    <PartsCatalogueDialog 
        isOpen={isPartsCatalogueOpen}
        setIsOpen={setIsPartsCatalogueOpen}
        onAdd={handleAddFromCatalogue}
    />
    <Card className="border-primary border-2">
        <CardHeader>
            <CardTitle>{isEditMode ? 'Edit Operation' : 'Add New Operation'}</CardTitle>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                {/* Labor Section */}
                <div>
                    <Label className="font-semibold text-base">Labor</Label>
                    <div className="mt-2 space-y-4">
                    <FormField
                        control={form.control}
                        name="heading"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Heading</FormLabel>
                            <FormControl><Input placeholder="e.g., Annual Engine Service" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="customerNotes"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Customer Notes (Internal)</FormLabel>
                            <FormControl><Textarea placeholder="Notes about customer interaction..." {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                        <FormItem>
                            <div className="flex justify-between items-center">
                            <FormLabel>Description (Visible to Customer)</FormLabel>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={handleGenerateDescription}
                                disabled={isGenerating}
                            >
                                {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                                Generate with AI
                            </Button>
                            </div>
                            <FormControl><Textarea placeholder="Describe the work performed or generate one with AI..." {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-3 gap-4">
                        <FormField
                        control={form.control}
                        name="laborRate"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Rate ($/hr)</FormLabel>
                            <FormControl><Input type="number" step="any" {...field} onFocus={handleFocus} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="laborHours"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Hours</FormLabel>
                            <FormControl><Input type="number" step="any" {...field} onFocus={handleFocus} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <div>
                            <Label>Total</Label>
                            <Input type="number" value={laborTotal.toFixed(2)} readOnly className="bg-muted" />
                        </div>
                    </div>
                    </div>
                </div>

                <Separator />

                {/* Parts Section */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                    <Label className="font-semibold text-base">Parts</Label>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsPartsCatalogueOpen(true)}
                            >
                            <BookMarked className="h-4 w-4 mr-2" /> Add from Catalogue
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddPart}
                            >
                            <PlusCircle className="h-4 w-4 mr-2" /> Add Part
                        </Button>
                    </div>
                    </div>
                    <div className="space-y-2">
                    {fields.length > 0 && (
                        <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground">
                            <div className="col-span-5 pl-2">Name</div>
                            <div className="col-span-1 pl-2">Qty</div>
                            <div className="col-span-2 pl-2">Cost (ex. GST)</div>
                            <div className="col-span-2 pl-2">Cost (inc. GST)</div>
                            <div className="col-span-2 pl-2"></div>
                        </div>
                    )}
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                            <FormField
                                control={form.control}
                                name={`parts.${index}.name`}
                                render={({ field }) => (
                                    <FormItem className="col-span-5">
                                        <FormControl>
                                            <Input 
                                                placeholder="Part Name/SKU" 
                                                {...field} 
                                                onKeyDown={(e) => handleKeyDown(e, index, 'name')}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`parts.${index}.quantity`}
                                render={({ field }) => (
                                    <FormItem className="col-span-1">
                                        <FormControl>
                                            <Input 
                                                type="number"
                                                step="any"
                                                onFocus={handleFocus}
                                                {...field}
                                                onKeyDown={(e) => handleKeyDown(e, index, 'quantity')}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name={`parts.${index}.cost`}
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                step="any"
                                                onFocus={handleFocus}
                                                {...field}
                                                onChange={(e) => handleCostChange(index, e.target.valueAsNumber, 'cost')}
                                                onKeyDown={(e) => handleKeyDown(e, index, 'cost')}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name={`parts.${index}.costIncGst`}
                                render={({ field }) => (
                                     <FormItem className="col-span-2">
                                        <FormControl>
                                            <Input 
                                                type="number"
                                                step="any"
                                                onFocus={handleFocus}
                                                {...field}
                                                onChange={(e) => handleCostChange(index, e.target.valueAsNumber, 'costIncGst')}
                                                onKeyDown={(e) => handleKeyDown(e, index, 'costIncGst')}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        <div className="col-span-2 flex justify-end">
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </div>
                        </div>
                    ))}
                    {partsTotal > 0 && (
                        <div className="flex justify-end pt-2 pr-10">
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm text-muted-foreground">Parts Total (ex. GST):</span>
                                <span className="font-semibold">${partsTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                    </div>
                </div>
                </div>
                 <div className="flex justify-end gap-2 mt-4">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        <XCircle className="h-4 w-4 mr-2"/>
                        Cancel
                    </Button>
                    <Button type="submit">
                        <Save className="h-4 w-4 mr-2"/>
                        Save Operation
                    </Button>
                </div>
            </form>
            </Form>
        </CardContent>
    </Card>
    </>
  );
};
