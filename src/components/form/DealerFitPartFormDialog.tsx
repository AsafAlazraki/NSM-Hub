
"use client";

import React from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageIcon, Upload, Save } from 'lucide-react';
import type { DealerFitPart, DealerFitCategory, DealerFitBrand } from '@/lib/types';

const dealerFitPartSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  name: z.string().min(1, 'Option name is required.'),
  supplier: z.string().optional(),
  code: z.string().optional(),
  partNumber: z.string().optional(),
  basePrice: z.coerce.number().min(0, 'Price must be non-negative.').optional().default(0),
  basePriceIncGst: z.coerce.number().min(0, 'Price must be non-negative.').optional().default(0),
  sellPrice: z.coerce.number().min(0, 'Price must be non-negative.').optional().default(0),
  sellPriceIncGst: z.coerce.number().min(0, 'Price must be non-negative.').optional().default(0),
  gpPercentage: z.coerce.number().min(0).max(100).optional().default(0),
  nsmCode: z.string().optional(),
  factoryCode: z.string().optional(),
  imageUrl: z.string().optional(),
  imageFile: z.instanceof(File).optional(),
});
export type DealerFitPartFormValues = z.infer<typeof dealerFitPartSchema>;

const formatCurrency = (value: number) => {
    if (isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
}

export const DealerFitPartFormDialog = ({
    isOpen,
    setIsOpen,
    onSave,
    initialData,
    allCategories,
    allBrands,
}: {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onSave: (data: DealerFitPartFormValues) => void;
    initialData?: Partial<DealerFitPart> | null;
    allCategories: DealerFitCategory[];
    allBrands: DealerFitBrand[];
}) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const form = useForm<DealerFitPartFormValues>({
        // The schema's `.coerce`/`.default()` fields make zod's input type wider
        // than its output type, but the shared FormField component requires a
        // single form-values type; cast the resolver to the output type here.
        resolver: zodResolver(dealerFitPartSchema) as Resolver<DealerFitPartFormValues>,
    });
    
    React.useEffect(() => {
        if (isOpen) {
            form.reset({
                ...initialData,
                basePrice: initialData?.basePrice || 0,
                basePriceIncGst: initialData?.basePriceIncGst || 0,
                sellPrice: initialData?.sellPrice || 0,
                sellPriceIncGst: initialData?.sellPriceIncGst || 0,
                gpPercentage: initialData?.gpPercentage || 0,
                categoryId: initialData?.categoryId || '__none__',
                brandId: initialData?.brandId || '__none__',
                nsmCode: initialData?.nsmCode || '',
                factoryCode: initialData?.factoryCode || '',
                imageUrl: initialData?.imageUrl || undefined,
                imageFile: undefined,
            });
        }
    }, [isOpen, initialData, form]);

    const { watch, setValue } = form;

    const handlePriceChange = (value: number, field: 'basePrice' | 'basePriceIncGst' | 'sellPrice' | 'sellPriceIncGst') => {
        if (isNaN(value)) return;
        
        switch (field) {
            case 'basePrice':
                setValue('basePrice', value);
                setValue('basePriceIncGst', parseFloat((value * 1.1).toFixed(2)));
                break;
            case 'basePriceIncGst':
                setValue('basePriceIncGst', value);
                setValue('basePrice', parseFloat((value / 1.1).toFixed(2)));
                break;
            case 'sellPrice':
                 setValue('sellPrice', value);
                setValue('sellPriceIncGst', parseFloat((value * 1.1).toFixed(2)));
                break;
            case 'sellPriceIncGst':
                setValue('sellPriceIncGst', value);
                setValue('sellPrice', parseFloat((value / 1.1).toFixed(2)));
                break;
        }
    };
    
    const basePrice = watch('basePrice');
    const sellPrice = watch('sellPrice');

    React.useEffect(() => {
        if (sellPrice > 0 && basePrice > 0) {
            const newGp = ((sellPrice - basePrice) / sellPrice) * 100;
            if (!isNaN(newGp)) {
                setValue('gpPercentage', parseFloat(newGp.toFixed(2)));
            }
        } else {
            setValue('gpPercentage', 0);
        }
    }, [basePrice, sellPrice, setValue]);
    
    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            form.setValue('imageFile', file, { shouldDirty: true });
            const reader = new FileReader();
            reader.onloadend = () => form.setValue('imageUrl', reader.result as string, { shouldDirty: true });
            reader.readAsDataURL(file);
        }
    };
    
    const onSubmit = (data: DealerFitPartFormValues) => {
        onSave(data);
        setIsOpen(false);
    }

    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-xl" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>{initialData?.id ? 'Edit' : 'Add'} Dealer Fit Option</DialogTitle>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                            <Card>
                                <CardHeader><CardTitle>Option Details</CardTitle></CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        <div className="lg:col-span-1 space-y-2">
                                            <FormLabel>Image</FormLabel>
                                            <div className="flex flex-col items-center gap-2">
                                                {form.watch('imageUrl') ? <img src={form.watch('imageUrl')} alt="Preview" className="h-24 w-full object-contain border rounded-md" /> : <div className="h-24 w-full bg-muted rounded-md flex items-center justify-center"><ImageIcon className="text-muted-foreground"/></div>}
                                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                                <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleUploadClick}><Upload className="mr-2"/>Upload Image</Button>
                                            </div>
                                        </div>
                                        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="sm:col-span-2">
                                                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Option Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                            </div>
                                             <div className="sm:col-span-2">
                                                <FormField control={form.control} name="brandId" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Brand</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value ?? '__none__'}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a brand" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="__none__">No Brand</SelectItem>
                                                        {allBrands.map(brand => ( <SelectItem key={brand.id} value={brand.id!}>{brand.name}</SelectItem>))}
                                                    </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <FormField control={form.control} name="categoryId" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Category</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value ?? '__none__'}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="__none__">No Category</SelectItem>
                                                        {allCategories.map(cat => (cat.id ? <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem> : null))}
                                                    </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                                />
                                            </div>
                                            <FormField control={form.control} name="nsmCode" render={({ field }) => ( <FormItem><FormLabel>NSM Code</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                                            <FormField control={form.control} name="factoryCode" render={({ field }) => ( <FormItem><FormLabel>Factory Code</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4 items-end">
                                        <FormField control={form.control} name="basePrice" render={({ field }) => ( <FormItem><FormLabel>Base Price (ex. GST)</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => handlePriceChange(e.target.valueAsNumber, 'basePrice')} /></FormControl><FormMessage /></FormItem> )} />
                                        <FormField control={form.control} name="basePriceIncGst" render={({ field }) => ( <FormItem><FormLabel>Base Price (inc. GST)</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => handlePriceChange(e.target.valueAsNumber, 'basePriceIncGst')} /></FormControl><FormMessage /></FormItem> )} />
                                        <FormField control={form.control} name="sellPrice" render={({ field }) => ( <FormItem><FormLabel>Sell Price (ex. GST)</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => handlePriceChange(e.target.valueAsNumber, 'sellPrice')} /></FormControl><FormMessage /></FormItem> )} />
                                        <FormField control={form.control} name="sellPriceIncGst" render={({ field }) => ( <FormItem><FormLabel>Sell Price (inc. GST)</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => handlePriceChange(e.target.valueAsNumber, 'sellPriceIncGst')} /></FormControl><FormMessage /></FormItem> )} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-4 items-end">
                                         <div>
                                            <Label>GP %</Label>
                                            <Input readOnly disabled value={`${watch('gpPercentage') || 0}%`} />
                                        </div>
                                        <div>
                                            <Label>Gross Profit ($)</Label>
                                            <Input readOnly disabled value={formatCurrency( (watch('sellPrice') || 0) - (watch('basePrice') || 0) )} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                         <DialogFooter className="pt-4 border-t">
                             <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                             <Button type="submit"><Save className="mr-2" /> Save Changes</Button>
                         </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
