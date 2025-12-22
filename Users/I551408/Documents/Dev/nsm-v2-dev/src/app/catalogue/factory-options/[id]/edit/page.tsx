
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { 
    getFactoryOptionCategories, 
    saveCatalogueFactoryOption,
    getBoatBrands,
    getBoatRanges,
    getBoatModels,
    getCatalogueMotors,
    getCatalogueTrailers,
    getUserProfile,
    getStaticLogo,
    getFactoryOptionById
} from '@/lib/storage';
import type { FactoryOption, FactoryOptionCategory, BoatBrand, BoatRange, BoatModel, OptionTag, UserProfile, CatalogueMotor, CatalogueTrailer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save, Upload, ImageIcon, Search, X, Tag } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getAuth, signOut } from 'firebase/auth';
import { UserProfileDialog } from '@/components/UserProfileDialog';

const optionTagSchema = z.enum(['Boat', 'Motor', 'Trailer', 'Misc']);

const factoryOptionSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().optional(),
  name: z.string().min(1, 'Option name is required.'),
  basePrice: z.coerce.number().min(0, 'Price must be non-negative.').optional().default(0),
  sellPrice: z.coerce.number().min(0, 'Price must be non-negative.').optional().default(0),
  gpPercentage: z.coerce.number().min(0).max(100).optional().default(0),
  nsmCode: z.string().optional(),
  factoryCode: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  imageFile: z.instanceof(File).optional(),
  compatibleBoatModelIds: z.array(z.string()).optional(),
  compatibleMotorIds: z.array(z.string()).optional(),
  compatibleTrailerIds: z.array(z.string()).optional(),
  tag: optionTagSchema.optional(),
});
type FactoryOptionFormValues = z.infer<typeof factoryOptionSchema>;


const formatCurrency = (value: number) => {
    if (isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
}

const FactoryOptionFormDialog = ({
    isOpen,
    setIsOpen,
    onSave,
    initialData,
    allCategories,
    allModels,
    allBrands,
    allRanges,
    allMotors,
    allTrailers,
}: {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onSave: (data: FactoryOptionFormValues) => void;
    initialData?: Partial<FactoryOption> | null;
    allCategories: FactoryOptionCategory[];
    allModels: BoatModel[];
    allBrands: BoatBrand[];
    allRanges: BoatRange[];
    allMotors: CatalogueMotor[];
    allTrailers: CatalogueTrailer[];
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [lastEditedField, setLastEditedField] = useState<'gpPercentage' | 'sellPrice' | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const form = useForm<FactoryOptionFormValues>({
        resolver: zodResolver(factoryOptionSchema),
    });
    
    useEffect(() => {
        if (isOpen) {
            const categoryForOption = allCategories.find(c => c.id === initialData?.categoryId);
            
            form.reset({
                ...initialData,
                categoryId: initialData?.categoryId || '__none__',
                nsmCode: initialData?.nsmCode || '',
                factoryCode: initialData?.factoryCode || '',
                tag: (initialData?.id ? initialData.tag : 'Boat') || 'Boat',
            });
        }
    }, [isOpen, initialData, form, allCategories]);

    const { watch, setValue, control } = form;
    const basePrice = watch('basePrice');
    const sellPrice = watch('sellPrice');
    const gpPercentage = watch('gpPercentage');
    const selectedTag = watch('tag');
    const selectedCategoryId = watch('categoryId');

     useEffect(() => {
      if (basePrice && basePrice > 0) {
        if (lastEditedField === 'gpPercentage' && gpPercentage) {
          const newSellPrice = basePrice / (1 - gpPercentage / 100);
          if (!isNaN(newSellPrice) && Math.abs(newSellPrice - (sellPrice || 0)) > 0.01) {
            setValue('sellPrice', parseFloat(newSellPrice.toFixed(2)));
          }
        } else if (lastEditedField === 'sellPrice' && sellPrice) {
          if (sellPrice > 0) {
            const newGp = ((sellPrice - basePrice) / sellPrice) * 100;
            if (!isNaN(newGp) && Math.abs(newGp - (gpPercentage || 0)) > 0.01) {
                setValue('gpPercentage', parseFloat(newGp.toFixed(2)));
            }
          }
        }
      }
    }, [basePrice, sellPrice, gpPercentage, lastEditedField, setValue]);
    
     useEffect(() => {
        const category = allCategories.find(c => c.id === selectedCategoryId);
        if (category?.tag) {
            setValue('tag', category.tag);
        }
        if (category) {
            if (category.tag === 'Boat' && category.compatibleBoatModelIds) {
                setValue('compatibleBoatModelIds', Array.from(new Set([...(form.getValues('compatibleBoatModelIds') || []), ...category.compatibleBoatModelIds])));
            }
        }
    }, [selectedCategoryId, allCategories, setValue, form]);
    
    useEffect(() => {
        // When tag changes, clear other compatibilities
        const currentTag = form.getValues('tag');
        if (currentTag !== 'Boat') form.setValue('compatibleBoatModelIds', []);
        if (currentTag !== 'Motor') form.setValue('compatibleMotorIds', []);
        if (currentTag !== 'Trailer') form.setValue('compatibleTrailerIds', []);
    }, [selectedTag, form]);


    const modelsWithBrandAndRange = useMemo(() => {
        const rangeMap = new Map(allRanges.map(r => [r.id, r]));
        const brandMap = new Map(allBrands.map(b => [b.id, b]));
        return allModels.map(model => ({
            ...model,
            rangeName: rangeMap.get(model.rangeId)?.name || 'N/A',
            brandName: brandMap.get(rangeMap.get(model.rangeId)?.brandId || '')?.name || 'N/A',
        }));
    }, [allModels, allRanges, allBrands]);

    const compatibilityItems = useMemo(() => {
        switch (selectedTag) {
            case 'Boat': return modelsWithBrandAndRange.map(m => ({ id: m.id!, name: `${m.brandName} ${m.name}` }));
            case 'Motor': return allMotors.map(m => ({ id: m.id!, name: m.name }));
            case 'Trailer': return allTrailers.map(t => ({ id: t.id!, name: t.name }));
            default: return [];
        }
    }, [selectedTag, modelsWithBrandAndRange, allMotors, allTrailers]);

    const compatibilityKey = useMemo(() => {
        switch (selectedTag) {
            case 'Boat': return 'compatibleBoatModelIds';
            case 'Motor': return 'compatibleMotorIds';
            case 'Trailer': return 'compatibleTrailerIds';
            default: return null;
        }
    }, [selectedTag]);

    const watchedCompatibleIds = compatibilityKey ? watch(compatibilityKey) || [] : [];

    const { selectedFilteredItems, unselectedFilteredItems } = useMemo(() => {
        if (!compatibilityKey) return { selectedFilteredItems: [], unselectedFilteredItems: [] };
        const selectedIds = new Set(watchedCompatibleIds);
        const filtered = compatibilityItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const selected = filtered.filter(item => selectedIds.has(item.id!));
        const unselected = filtered.filter(item => !selectedIds.has(item.id!));
        return { selectedFilteredItems: selected, unselectedFilteredItems: unselected };
    }, [compatibilityItems, searchTerm, watchedCompatibleIds, compatibilityKey]);
    
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
    
    const onSubmit = (data: FactoryOptionFormValues) => {
        onSave(data);
        setIsOpen(false);
    }

    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-4xl" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>{initialData?.id ? 'Edit' : 'Add'} Factory Option</DialogTitle>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-h-[70vh] overflow-y-auto pr-4">
                             <div className="lg:col-span-2 space-y-8">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Option Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            <div className="lg:col-span-1 space-y-2">
                                                <FormLabel>Image</FormLabel>
                                                <div className="flex flex-col items-center gap-2">
                                                    {form.watch('imageUrl') ? <img src={form.watch('imageUrl')!} alt="Preview" className="h-24 w-full object-contain border rounded-md" /> : <div className="h-24 w-full bg-muted rounded-md flex items-center justify-center"><ImageIcon className="text-muted-foreground"/></div>}
                                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                                    <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleUploadClick}><Upload className="mr-2"/>Upload Image</Button>
                                                </div>
                                            </div>
                                            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="sm:col-span-2">
                                                    <FormField control={control} name="name" render={({ field }) => ( <FormItem><FormLabel>Option Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                                </div>
                                                <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                                                     <FormField control={control} name="categoryId" render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Category</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value || '__none__'}>
                                                            <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="__none__">No Category</SelectItem>
                                                                {allCategories.map(cat => ( <SelectItem key={cat.id} value={cat.id!}>{cat.name}</SelectItem>))}
                                                            </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                        )}
                                                    />
                                                     <FormField control={control} name="tag" render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Tag</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl><SelectTrigger><SelectValue placeholder="Select a tag" /></SelectTrigger></FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="Boat">Boat</SelectItem>
                                                                <SelectItem value="Motor">Motor</SelectItem>
                                                                <SelectItem value="Trailer">Trailer</SelectItem>
                                                                <SelectItem value="Misc">Misc</SelectItem>
                                                            </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />
                                                </div>
                                                <FormField control={control} name="nsmCode" render={({ field }) => ( <FormItem><FormLabel>NSM Code</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                                                <FormField control={control} name="factoryCode" render={({ field }) => ( <FormItem><FormLabel>Factory Code</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                            <FormField control={control} name="basePrice" render={({ field }) => ( <FormItem><FormLabel>Base Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                            <FormField control={control} name="gpPercentage" render={({ field }) => ( <FormItem><FormLabel>GP %</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => { field.onChange(e); setLastEditedField('gpPercentage'); }} /></FormControl><FormMessage /></FormItem> )} />
                                            <FormField control={control} name="sellPrice" render={({ field }) => ( <FormItem><FormLabel>Sell Price</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => { field.onChange(e); setLastEditedField('sellPrice'); }} /></FormControl><FormMessage /></FormItem> )} />
                                            <div>
                                                <Label>Gross Profit ($)</Label>
                                                <Input readOnly disabled value={formatCurrency( (watch('sellPrice') || 0) - (watch('basePrice') || 0) )} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="lg:col-span-1">
                                {compatibilityKey && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Compatible {selectedTag}s</CardTitle>
                                            <div className="relative pt-2">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder={`Search ${selectedTag?.toLowerCase()}s...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
                                                {searchTerm && <Button variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2" onClick={() => setSearchTerm('')}><X className="h-4 w-4" /></Button>}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <FormField control={control} name={compatibilityKey} render={({ field }) => (
                                                    <FormItem>
                                                        <ScrollArea className="h-96">
                                                            <div className="space-y-2 p-1">
                                                                {selectedFilteredItems.length > 0 && selectedFilteredItems.map((item) => ( <FormItem key={item.id} className="flex flex-row items-center space-x-3 space-y-0 p-2 rounded-md bg-muted"><FormControl><Checkbox checked={field.value?.includes(item.id!)} onCheckedChange={(checked) => { return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange((field.value || []).filter(value => value !== item.id))}} /></FormControl><FormLabel className="font-normal cursor-pointer w-full">{item.name}</FormLabel></FormItem>))}
                                                                {selectedFilteredItems.length > 0 && unselectedFilteredItems.length > 0 && ( <Separator className="my-2" />)}
                                                                {unselectedFilteredItems.map((item) => ( <FormItem key={item.id} className="flex flex-row items-center space-x-3 space-y-0 p-2 rounded-md hover:bg-muted/50"><FormControl><Checkbox checked={field.value?.includes(item.id!)} onCheckedChange={(checked) => { return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange((field.value || []).filter(value => value !== item.id)) }} /></FormControl><FormLabel className="font-normal cursor-pointer w-full">{item.name}</FormLabel></FormItem>))}
                                                                {selectedFilteredItems.length === 0 && unselectedFilteredItems.length === 0 && (<p className="text-center text-sm text-muted-foreground py-4">No items found.</p> )}
                                                            </div>
                                                        </ScrollArea>
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                         </div>
                         <DialogFooter className="pt-4">
                             <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                             <Button type="submit"><Save className="mr-2" /> Save Changes</Button>
                         </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};


function EditFactoryOptionPageContent() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const optionId = params.id as string;
    
    const [isLoading, setIsLoading] = useState(true);

    const [option, setOption] = useState<FactoryOption | null>(null);
    const [allCategories, setAllCategories] = useState<FactoryOptionCategory[]>([]);
    const [allModels, setAllModels] = useState<BoatModel[]>([]);
    const [allBrands, setAllBrands] = useState<BoatBrand[]>([]);
    const [allRanges, setAllRanges] = useState<BoatRange[]>([]);
    const [allMotors, setAllMotors] = useState<CatalogueMotor[]>([]);
    const [allTrailers, setAllTrailers] = useState<CatalogueTrailer[]>([]);
    
    useEffect(() => {
        const fetchData = async () => {
            if (!user || !optionId) return;
            setIsLoading(true);
            try {
                const [fetchedOption, fetchedCategories, fetchedModels, fetchedBrands, fetchedRanges, fetchedMotors, fetchedTrailers] = await Promise.all([
                    getFactoryOptionById(optionId),
                    getFactoryOptionCategories(),
                    getBoatModels(),
                    getBoatBrands(),
                    getBoatRanges(),
                    getCatalogueMotors(),
                    getCatalogueTrailers(),
                ]);
                setOption(fetchedOption);
                setAllCategories(fetchedCategories.sort((a,b) => a.name.localeCompare(b.name)));
                setAllModels(fetchedModels);
                setAllBrands(fetchedBrands);
                setAllRanges(fetchedRanges);
                setAllMotors(fetchedMotors);
                setAllTrailers(fetchedTrailers);
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Could not load factory options data." });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user, optionId, toast]);

    const handleSaveOption = async (data: FactoryOptionFormValues) => {
        try {
            await saveCatalogueFactoryOption({ ...option, ...data });
            toast({ title: `Option Updated`, description: `"${data.name}" has been updated.` });
            router.push('/catalogue/factory-options');
        } catch (error) {
             toast({ variant: "destructive", title: "Save Failed", description: String(error) });
        }
    };


    if (isLoading) {
        return (
            <div className="flex flex-col h-screen">
                <Header><Button asChild variant="outline"><Link href="/catalogue/factory-options"><ArrowLeft /> Back to Options</Link></Button></Header>
                <main className="flex-1 p-8"><Skeleton className="h-96 w-full" /></main>
            </div>
        );
    }
    
    if (!option) {
         return (
            <div className="flex flex-col h-screen">
                <Header><Button asChild variant="outline"><Link href="/catalogue/factory-options"><ArrowLeft /> Back to Options</Link></Button></Header>
                <main className="flex-1 flex items-center justify-center"><p>Option not found.</p></main>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
             <FactoryOptionFormDialog isOpen={true} setIsOpen={() => router.push('/catalogue/factory-options')} onSave={handleSaveOption} initialData={option} allCategories={allCategories} allModels={allModels} allBrands={allBrands} allRanges={allRanges} allMotors={allMotors} allTrailers={allTrailers} />
        </div>
    );
}

export default function EditFactoryOptionPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const auth = getAuth();
    const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
    const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
    const [logo, setLogo] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

     useEffect(() => {
        const fetchInitialData = async () => {
            if(user) {
                const [profile, staticLogo] = await Promise.all([
                    getUserProfile(user.uid),
                    getStaticLogo()
                ]);
                setCurrentUserProfile(profile);
                setLogo(staticLogo);
            }
        }
        fetchInitialData();
    }, [user]);

    const handleSignOut = async () => {
        await signOut(auth);
        router.push('/login');
    };

    if (authLoading || !user) {
        return (
            <SidebarProvider>
                <div className="flex flex-col h-screen">
                    <Header/>
                    <main className="flex-1 p-8"><Skeleton className="h-96 w-full" /></main>
                </div>
            </SidebarProvider>
        );
    }
    
    return (
        <SidebarProvider 
            logo={logo} 
            onSignOut={handleSignOut} 
            onProfileClick={() => setIsProfileDialogOpen(true)}
            currentUserProfile={currentUserProfile}
        >
            {currentUserProfile && (
                <UserProfileDialog 
                    isOpen={isProfileDialogOpen}
                    setIsOpen={setIsProfileDialogOpen}
                    userProfile={currentUserProfile}
                    onSave={() => {}}
                />
            )}
            <EditFactoryOptionPageContent />
        </SidebarProvider>
    );
}
