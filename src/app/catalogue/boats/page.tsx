
"use client";

import { useEffect, useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { BoatBrand, BoatRange, BoatModel, UserProfile } from '@/lib/types';
import { getBoatBrands, saveBoatBrand, deleteBoatBrand, getBoatRanges, saveBoatRange, deleteBoatRange, getBoatModels, saveBoatModel, deleteBoatModel, saveBoatModels, deleteBoatModels, getUserProfile, getStaticLogo } from '@/lib/storage';
import { PlusCircle, MoreVertical, Edit, Trash2, ArrowLeft, ChevronDown, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { getAuth, signOut } from 'firebase/auth';
import Image from 'next/image';

const nameSchema = z.object({
  name: z.string().min(1, "Name is required."),
});
type NameFormValues = z.infer<typeof nameSchema>;

const multiModelSchema = z.object({
    models: z.string().min(1, "At least one model name is required."),
});
type MultiModelFormValues = z.infer<typeof multiModelSchema>;

const brandFormSchema = z.object({
  name: z.string().min(1, "Brand name is required."),
  logo: z.string().optional(),
  logoFile: z.instanceof(File).optional(),
});
type BrandFormValues = z.infer<typeof brandFormSchema>;


// Form Dialog for Brand, Range
const EntryFormDialog = ({
    isOpen,
    setIsOpen,
    onSave,
    entryType,
    initialName = ''
} : {
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    onSave: (name: string) => void,
    entryType: 'Brand' | 'Range' | 'Model',
    initialName?: string
}) => {
    const form = useForm<NameFormValues>({
        resolver: zodResolver(nameSchema),
        defaultValues: { name: initialName },
    });

     useEffect(() => {
        if(isOpen) {
          form.reset({ name: initialName });
        }
    }, [initialName, isOpen, form]);

    const onSubmit = (data: NameFormValues) => {
        onSave(data.name);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>{initialName ? 'Edit' : 'Add'} {entryType}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{entryType} Name</FormLabel>
                                    <FormControl><Input {...field} autoFocus /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

// Dialog for adding multiple models
const MultiModelFormDialog = ({
    isOpen,
    setIsOpen,
    onSave,
    rangeName
}: {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onSave: (modelNames: string[]) => void;
    rangeName: string;
}) => {
    const form = useForm<MultiModelFormValues>({
        resolver: zodResolver(multiModelSchema),
        defaultValues: { models: '' }
    });
    
    useEffect(() => {
        if(isOpen) {
          form.reset({ models: '' });
        }
    }, [isOpen, form]);

    const onSubmit = (data: MultiModelFormValues) => {
        const modelNames = data.models.split('\n').map(name => name.trim()).filter(name => name.length > 0);
        onSave(modelNames);
        setIsOpen(false);
    };

    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Add Multiple Models to "{rangeName}"</DialogTitle>
                    <DialogDescription>
                        Enter one model name per line. The range name "{rangeName}" will be automatically added as a suffix to each model.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="models"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Model Names</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            rows={8}
                                            placeholder="e.g.,&#10;Cap Camarat 9.0&#10;Merry Fisher 1095&#10;Sun Odyssey 349"
                                            autoFocus
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit">Save Models</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};


// Form Dialog for Brand (name + logo upload)
const BrandFormDialog = ({ isOpen, setIsOpen, onSave, initialData }: { isOpen: boolean, setIsOpen: (open: boolean) => void, onSave: (data: BrandFormValues) => void, initialData?: BoatBrand | null }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const form = useForm<BrandFormValues>({
        resolver: zodResolver(brandFormSchema),
        defaultValues: { name: initialData?.name || '', logo: initialData?.logo || undefined, logoFile: undefined },
    });

    useEffect(() => {
        if(isOpen) form.reset({ name: initialData?.name || '', logo: initialData?.logo || undefined, logoFile: undefined });
    }, [initialData, isOpen, form]);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            form.setValue('logoFile', file, { shouldDirty: true });
            const reader = new FileReader();
            reader.onloadend = () => form.setValue('logo', reader.result as string, { shouldDirty: true });
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = (data: BrandFormValues) => {
        onSave(data);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader><DialogTitle>{initialData?.id ? 'Edit' : 'Add'} Brand</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Brand Name</FormLabel>
                                <FormControl><Input {...field} autoFocus /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormItem>
                            <FormLabel>Brand Logo</FormLabel>
                             <div className="flex items-center gap-4">
                                {form.watch('logo') && (
                                    <img src={form.watch('logo')} alt="Brand logo preview" className="h-16 w-auto object-contain border rounded-md" />
                                )}
                                 <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/png, image/jpeg, image/svg+xml, image/webp"
                                />
                                <Button type="button" variant="outline" onClick={handleUploadClick}>
                                    <Upload className="mr-2 h-4 w-4"/> Upload Logo
                                </Button>
                             </div>
                        </FormItem>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

function BoatsCataloguePageContent() {
    const [brands, setBrands] = useState<BoatBrand[]>([]);
    const [ranges, setRanges] = useState<BoatRange[]>([]);
    const [models, setModels] = useState<BoatModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const { toast } = useToast();
    
    // State for dialogs
    const [isBrandFormOpen, setIsBrandFormOpen] = useState(false);
    const [isRangeFormOpen, setIsRangeFormOpen] = useState(false);
    const [isMultiModelFormOpen, setIsMultiModelFormOpen] = useState(false);
    const [isModelFormOpen, setIsModelFormOpen] = useState(false);


    // State to hold what is being edited/deleted
    const [editingBrand, setEditingBrand] = useState<BoatBrand | null>(null);
    const [editingRange, setEditingRange] = useState<BoatRange | null>(null);
    const [editingModel, setEditingModel] = useState<BoatModel | null>(null);
    const [parentBrandIdForRange, setParentBrandIdForRange] = useState<string | null>(null);
    const [parentRangeForModel, setParentRangeForModel] = useState<BoatRange | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'brand' | 'range' | 'model', id: string, name: string } | null>(null);

    
    const [openItems, setOpenItems] = useState<string[]>([]);
    const [selectedModels, setSelectedModels] = useState<string[]>([]);

    const fetchData = async () => {
        if (user) {
            setIsLoading(true);
            try {
                const [fetchedBrands, fetchedRanges, fetchedModels] = await Promise.all([
                    getBoatBrands(),
                    getBoatRanges(),
                    getBoatModels()
                ]);
                setBrands(fetchedBrands);
                setRanges(fetchedRanges);
                setModels(fetchedModels);
            } catch (error) {
                console.error("Failed to load kits data:", error);
                toast({ variant: "destructive", title: "Error", description: "Could not load data." });
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleToggleOpen = (itemId: string, isOpen: boolean) => {
        setOpenItems(prev => {
            const newOpenItems = new Set(prev);
            if (isOpen) {
                newOpenItems.add(itemId);
            } else {
                newOpenItems.delete(itemId);
            }
            return Array.from(newOpenItems);
        });
    }

    // --- Brand Handlers ---
    const handleOpenBrandForm = (brand: BoatBrand | null = null) => {
        setEditingBrand(brand);
        setIsBrandFormOpen(true);
    };
    const handleSaveBrand = async (values: { name: string; logo?: string; logoFile?: File }) => {
        try {
            await saveBoatBrand({ id: editingBrand?.id, ...values });
            toast({ title: "Brand Saved", description: `"${values.name}" has been saved.` });
            window.location.reload();
        } catch (error) {
            toast({ variant: "destructive", title: "Save Failed", description: "Could not save the brand." });
        }
    };

    // --- Range Handlers ---
    const handleOpenRangeForm = (brandId: string, range: BoatRange | null = null) => {
        if (!range) { // If adding a new range, expand the parent brand
            handleToggleOpen(brandId, true);
        }
        setParentBrandIdForRange(brandId);
        setEditingRange(range);
        setIsRangeFormOpen(true);
    };
    const handleSaveRange = async (name: string) => {
        if (!parentBrandIdForRange) return;
        try {
            await saveBoatRange({ id: editingRange?.id, name, brandId: parentBrandIdForRange });
            toast({ title: "Range Saved", description: `"${name}" has been saved.` });
            window.location.reload();
        } catch (error) {
            toast({ variant: "destructive", title: "Save Failed", description: "Could not save the range." });
        }
    };

    // --- Model Handlers ---
    const handleOpenModelForm = (range: BoatRange, model: BoatModel | null = null) => {
        if (!model) { // If adding new, expand parents
            const newOpen = new Set(openItems);
            newOpen.add(range.brandId);
            newOpen.add(range.id!);
            setOpenItems(Array.from(newOpen));
        }
        setParentRangeForModel(range);
        setEditingModel(model);
        setIsModelFormOpen(true);
    };
    const handleSaveModel = async (name: string) => {
        if (!parentRangeForModel?.id) return;
        try {
            await saveBoatModel({ id: editingModel?.id, name, rangeId: parentRangeForModel.id });
            toast({ title: "Model Saved", description: `"${name}" has been saved.` });
            window.location.reload();
        } catch (error) {
            toast({ variant: "destructive", title: "Save Failed", description: "Could not save the model." });
        }
    };
    
    // --- Multi Model Handlers ---
    const handleOpenMultiModelForm = (range: BoatRange) => {
        const newOpen = new Set(openItems);
        newOpen.add(range.brandId);
        newOpen.add(range.id!);
        setOpenItems(Array.from(newOpen));

        setParentRangeForModel(range);
        setIsMultiModelFormOpen(true);
    };

    const handleSaveMultiModel = async (modelNames: string[]) => {
        if (!parentRangeForModel?.id) return;
        try {
            await saveBoatModels(parentRangeForModel.id, parentRangeForModel.name, modelNames);
            toast({ title: "Models Saved", description: `${modelNames.length} models have been added.` });
            window.location.reload();
        } catch (error) {
            toast({ variant: "destructive", title: "Save Failed", description: "Could not save the models." });
        }
    };

    // --- Bulk Delete Handlers ---
    const handleToggleModelSelection = (modelId: string) => {
        setSelectedModels(prev =>
            prev.includes(modelId) ? prev.filter(id => id !== modelId) : [...prev, modelId]
        );
    };

    const handleToggleSelectAllInRange = (rangeId: string, shouldSelect: boolean) => {
        const modelsInRange = models.filter(m => m.rangeId === rangeId).map(m => m.id!);
        setSelectedModels(prev => {
            const newSelected = new Set(prev);
            if (shouldSelect) {
                modelsInRange.forEach(id => newSelected.add(id));
            } else {
                const modelsInRangeSet = new Set(modelsInRange);
                return Array.from(newSelected).filter(id => !modelsInRangeSet.has(id));
            }
            return Array.from(newSelected);
        });
    };

    const handleBulkDelete = async () => {
        try {
            await deleteBoatModels(selectedModels);
            toast({
                title: "Models Deleted",
                description: `${selectedModels.length} models have been deleted.`
            });
            window.location.reload();
        } catch (error) {
            toast({ variant: "destructive", title: "Delete Failed", description: "Could not delete selected models." });
        }
    };
    
    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        const { type, id } = itemToDelete;

        try {
            if (type === 'brand') {
                await deleteBoatBrand(id);
            } else if (type === 'range') {
                await deleteBoatRange(id);
            } else {
                await deleteBoatModel(id);
            }
            toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} Deleted` });
            window.location.reload();
        } catch (error) {
             toast({ variant: "destructive", title: "Delete Failed", description: String(error) });
        } finally {
            setItemToDelete(null);
        }
    };

    return (
        <div className="flex flex-col h-screen">
            <Header>
                 <Button asChild variant="outline">
                    <Link href="/catalogue"><ArrowLeft /> Back to Data Modules</Link>
                </Button>
            </Header>
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                 <div className="mb-8 space-y-4">
                     <div className="flex justify-between items-center">
                        <div>
                             <h1 className="text-3xl font-headline font-bold">Boats Catalogue</h1>
                             <p className="text-muted-foreground">Manage boat brands, ranges, and models.</p>
                        </div>
                        <div className="flex items-center gap-2">
                             {selectedModels.length > 0 && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedModels.length})
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete {selectedModels.length} model(s). This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleBulkDelete}>Delete Models</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                            <Button onClick={() => handleOpenBrandForm()}>
                                <PlusCircle /> Add Boat Brand
                            </Button>
                        </div>
                     </div>
                </div>

                {/* Dialogs */}
                <BrandFormDialog isOpen={isBrandFormOpen} setIsOpen={setIsBrandFormOpen} onSave={handleSaveBrand} initialData={editingBrand} />
                <EntryFormDialog isOpen={isRangeFormOpen} setIsOpen={setIsRangeFormOpen} onSave={handleSaveRange} entryType="Range" initialName={editingRange?.name} />
                <EntryFormDialog isOpen={isModelFormOpen} setIsOpen={setIsModelFormOpen} onSave={handleSaveModel} entryType="Model" initialName={editingModel?.name} />
                {parentRangeForModel && (
                    <MultiModelFormDialog
                        isOpen={isMultiModelFormOpen}
                        setIsOpen={setIsMultiModelFormOpen}
                        onSave={handleSaveMultiModel}
                        rangeName={parentRangeForModel.name}
                    />
                )}
                 <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                {itemToDelete?.type === 'brand' && `This will permanently delete the brand "${itemToDelete.name}" and all its associated ranges and models. This cannot be undone.`}
                                {itemToDelete?.type === 'range' && `This will permanently delete the range "${itemToDelete.name}" and all its models.`}
                                {itemToDelete?.type === 'model' && `This will permanently delete the model "${itemToDelete.name}".`}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {isLoading ? (
                     <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
                    </div>
                ) : brands.length === 0 ? (
                    <div className="text-center py-16">
                        <h2 className="text-2xl font-semibold">No boat brands found</h2>
                        <p className="text-muted-foreground mt-2">
                           Click \"Add Boat Brand\" to get started.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {brands.map(brand => (
                            <Collapsible
                                key={brand.id}
                                asChild
                                open={openItems.includes(brand.id!)}
                                onOpenChange={(isOpen) => handleToggleOpen(brand.id!, isOpen)}
                            >
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CollapsibleTrigger className="flex-1 group">
                                            <div className="flex items-center gap-4">
                                                <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-0 group-data-[state=closed]:-rotate-90" />
                                                 {brand.logo ? (
                                                    <Image src={brand.logo} alt={`${brand.name} logo`} width={120} height={32} className="h-8 w-auto object-contain" />
                                                 ) : (
                                                    <CardTitle className="text-xl font-headline">{brand.name}</CardTitle>
                                                 )}
                                            </div>
                                        </CollapsibleTrigger>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline" onClick={() => handleOpenRangeForm(brand.id!)}>
                                                <PlusCircle className="mr-2 h-4 w-4" /> Add Range
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleOpenBrandForm(brand)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onSelect={(e) => {e.preventDefault(); setItemToDelete({ type: 'brand', id: brand.id!, name: brand.name })}}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    <CollapsibleContent asChild>
                                        <CardContent>
                                            {ranges.filter(r => r.brandId === brand.id).map(range => {
                                                const modelsInRange = models.filter(m => m.rangeId === range.id);
                                                const selectedModelsInRangeCount = modelsInRange.filter(m => selectedModels.includes(m.id!)).length;
                                                const isAllSelected = modelsInRange.length > 0 && selectedModelsInRangeCount === modelsInRange.length;
                                                
                                                const isSomeButNotAllSelected = modelsInRange.length > 0 && selectedModelsInRangeCount > 0 && selectedModelsInRangeCount < modelsInRange.length;

                                                return (
                                                <Collapsible
                                                    key={range.id}
                                                    className="border-t py-2"
                                                    open={openItems.includes(range.id!)}
                                                    onOpenChange={(isOpen) => handleToggleOpen(range.id!, isOpen)}
                                                >
                                                    <div className="flex items-center justify-between group">
                                                        <CollapsibleTrigger className="flex-1 text-left flex items-center gap-2 ml-2">
                                                            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-0 group-data-[state=closed]:-rotate-90" />
                                                            <p className="font-semibold">{range.name}</p>
                                                        </CollapsibleTrigger>
                                                        <div className="flex items-center gap-2">
                                                            <Button size="sm" variant="ghost" onClick={(e) => {e.stopPropagation(); handleOpenMultiModelForm(range)}}>Add Models</Button>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => handleOpenRangeForm(brand.id!, range)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                                    <DropdownMenuItem className="text-destructive" onSelect={(e) => {e.preventDefault(); setItemToDelete({ type: 'range', id: range.id!, name: range.name })}}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                    <CollapsibleContent>
                                                        <div className="pl-10 mt-2 space-y-1">
                                                             {modelsInRange.length > 0 && (
                                                                <div className="flex items-center space-x-2 py-1">
                                                                    <Checkbox
                                                                        id={`select-all-${range.id}`}
                                                                        checked={isAllSelected}
                                                                        onCheckedChange={(checked) => handleToggleSelectAllInRange(range.id!, !!checked)}
                                                                        data-state={isSomeButNotAllSelected ? 'indeterminate' : (isAllSelected ? 'checked' : 'unchecked')}
                                                                    />
                                                                    <label
                                                                        htmlFor={`select-all-${range.id}`}
                                                                        className="text-sm font-medium leading-none text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                                    >
                                                                        Select All in Range
                                                                    </label>
                                                                </div>
                                                            )}
                                                            {modelsInRange.map(model => (
                                                                <div key={model.id} className="flex items-center justify-between group/model hover:bg-accent rounded-md px-2 -mx-2">
                                                                     <div className="flex items-center space-x-2">
                                                                        <Checkbox
                                                                            id={model.id}
                                                                            checked={selectedModels.includes(model.id!)}
                                                                            onCheckedChange={() => handleToggleModelSelection(model.id!)}
                                                                        />
                                                                        <label htmlFor={model.id} className="text-sm cursor-pointer py-1.5">{model.name}</label>
                                                                    </div>
                                                                    <div className="opacity-0 group-hover/model:opacity-100 transition-opacity">
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                                            <DropdownMenuContent align="end">
                                                                                <DropdownMenuItem asChild>
                                                                                    <Link href={`/catalogue/boats/${model.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit Details</Link>
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem className="text-destructive" onSelect={(e) => {e.preventDefault(); setItemToDelete({ type: 'model', id: model.id!, name: model.name })}}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {models.filter(m => m.rangeId === range.id).length === 0 && <p className="text-sm text-muted-foreground">No models in this range yet.</p>}
                                                        </div>
                                                    </CollapsibleContent>
                                                </Collapsible>
                                                )})}
                                            {ranges.filter(r => r.brandId === brand.id).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No ranges for this brand yet.</p>}
                                        </CardContent>
                                    </CollapsibleContent>
                                </Card>
                            </Collapsible>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}


export default function BoatsPage() {
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
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        <Skeleton className="h-12 w-1/4 mb-4" />
                        <Skeleton className="h-64 w-full" />
                    </main>
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
            <BoatsCataloguePageContent />
        </SidebarProvider>
    );
}
