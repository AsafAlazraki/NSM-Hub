
"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { 
    getDealerFitCategories, 
    saveDealerFitCategory, 
    deleteDealerFitCategory, 
    getDealerFitParts, 
    saveDealerFitPart, 
    deleteDealerFitPart,
    getDealerFitBrands,
    saveDealerFitBrand,
    deleteDealerFitBrand,
    deleteDealerFitParts,
    getStaticLogo,
    getUserProfile,
    getDealerFitKits,
    saveDealerFitKit,
    deleteDealerFitKit
} from '@/lib/storage';
import type { DealerFitPart, DealerFitCategory, DealerFitBrand, UserProfile, DealerFitKit } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, PlusCircle, MoreVertical, Edit, Trash2, ImageIcon, ChevronDown, Upload, Save, X, Search, Package, PackagePlus } from 'lucide-react';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getAuth, signOut } from 'firebase/auth';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { v4 as uuidv4 } from 'uuid';
import { DealerFitPartFormDialog, type DealerFitPartFormValues } from '@/components/form/DealerFitPartFormDialog';


// --- Schemas ---
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required."),
});
type CategoryFormValues = z.infer<typeof categorySchema>;

const brandFormSchema = z.object({
  name: z.string().min(1, "Brand name is required."),
  logo: z.string().optional(),
  logoFile: z.instanceof(File).optional(),
});
type BrandFormValues = z.infer<typeof brandFormSchema>;

const kitFormSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Kit name is required."),
    partIds: z.array(z.string()).min(1, "A kit must contain at least one part."),
});
type KitFormValues = z.infer<typeof kitFormSchema>;


// --- Components ---
const CategoryFormDialog = ({ isOpen, setIsOpen, onSave, initialName = '' }: { isOpen: boolean, setIsOpen: (open: boolean) => void, onSave: (name: string) => void, initialName?: string }) => {
    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: initialName },
    });

     useEffect(() => {
        if(isOpen) form.reset({ name: initialName });
    }, [initialName, isOpen, form]);

    const onSubmit = (data: CategoryFormValues) => {
        onSave(data.name);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader><DialogTitle>{initialName ? 'Edit' : 'Add'} Category</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category Name</FormLabel>
                                <FormControl><Input {...field} autoFocus /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
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

const BrandFormDialog = ({ isOpen, setIsOpen, onSave, initialData }: { isOpen: boolean, setIsOpen: (open: boolean) => void, onSave: (data: BrandFormValues) => void, initialData?: DealerFitBrand | null }) => {
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

const formatCurrency = (value: number) => {
    if (isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
}

const KitFormDialog = ({
    isOpen,
    setIsOpen,
    onSave,
    initialData,
    allParts,
}: {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onSave: (data: KitFormValues) => void;
    initialData: Partial<DealerFitKit> | null;
    allParts: DealerFitPart[];
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const form = useForm<KitFormValues>({
        resolver: zodResolver(kitFormSchema),
        defaultValues: initialData || { name: '', partIds: [] },
    });

    useEffect(() => {
        form.reset(initialData || { name: '', partIds: [] });
    }, [initialData, form, isOpen]);

    const selectedPartIds = form.watch('partIds') || [];

    const handlePartToggle = (partId: string, isSelected: boolean) => {
        const currentIds = form.getValues('partIds') || [];
        if (isSelected) {
            form.setValue('partIds', [...currentIds, partId]);
        } else {
            form.setValue('partIds', currentIds.filter(id => id !== partId));
        }
    };

    const filteredParts = useMemo(() => {
        return allParts.filter(part => part.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [allParts, searchTerm]);

    const onSubmit = (data: KitFormValues) => {
        onSave(data);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-3xl" onOpenAutoFocus={e => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>{initialData?.id ? 'Edit Kit' : 'Create New Kit'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Kit Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Available Parts</Label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Search parts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8" />
                                </div>
                                <ScrollArea className="h-72 rounded-md border">
                                    <div className="p-2 space-y-1">
                                        {filteredParts.map(part => (
                                            !selectedPartIds.includes(part.id!) && (
                                                <div key={part.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer" onClick={() => handlePartToggle(part.id!, true)}>
                                                    <p>{part.name}</p>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                            <div className="space-y-2">
                                <Label>Parts in Kit ({selectedPartIds.length})</Label>
                                <ScrollArea className="h-[20.5rem] rounded-md border">
                                     <div className="p-2 space-y-1">
                                        {selectedPartIds.map(partId => {
                                            const part = allParts.find(p => p.id === partId);
                                            return part ? (
                                                <div key={part.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                                    <p>{part.name}</p>
                                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handlePartToggle(part.id!, false)}>
                                                        <X className="h-4 w-4 text-destructive"/>
                                                    </Button>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                         <FormField control={form.control} name="partIds" render={({ field }) => (<FormItem><FormMessage /></FormItem>)} />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit">Save Kit</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};


function PartsTabView({ allCategories, allParts, allBrands, onOpenPartForm, onOpenCategoryForm, onConfirmDeleteCategory, onConfirmDeletePart, selectedParts, onTogglePartSelection, onToggleSelectAllInCategory }: {
    allCategories: DealerFitCategory[];
    allParts: DealerFitPart[];
    allBrands: DealerFitBrand[];
    onOpenPartForm: (part: DealerFitPart | null, categoryId: string) => void;
    onOpenCategoryForm: (category: DealerFitCategory) => void;
    onConfirmDeleteCategory: (categoryId: string) => void;
    onConfirmDeletePart: (partId: string) => void;
    selectedParts: string[];
    onTogglePartSelection: (partId: string) => void;
    onToggleSelectAllInCategory: (categoryId: string, shouldSelect: boolean) => void;
}) {
    
    const uncategorizedOptions = allParts.filter(opt => opt && (!opt.categoryId || opt.categoryId === '__none__'));

    return (
        <div className="space-y-4">
            {allCategories.length === 0 && uncategorizedOptions.length === 0 ? (
                <div className="text-center py-16">
                    <h2 className="text-2xl font-semibold">No options or categories found</h2>
                    <p className="text-muted-foreground mt-2">Click "Add" to get started.</p>
                </div>
            ) : (
                <>
                {allCategories.map((category: DealerFitCategory) => {
                    if (!category || !category.id) return null;
                    const partsInCategory = allParts.filter((p: DealerFitPart) => p && p.categoryId === category.id);
                    const selectedCount = partsInCategory.filter((p: DealerFitPart) => p && p.id && selectedParts.includes(p.id)).length;
                    const isAllSelected = partsInCategory.length > 0 && selectedCount === partsInCategory.length;
                    const isSomeButNotAllSelected = partsInCategory.length > 0 && selectedCount > 0 && selectedCount < partsInCategory.length;
                    return (
                    <Collapsible key={category.id} defaultOpen asChild>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CollapsibleTrigger className="flex-1 group">
                                    <div className="flex items-center gap-2">
                                        <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-0 group-data-[state=closed]:-rotate-90" />
                                        <CardTitle className="text-xl font-headline">{category.name}</CardTitle>
                                    </div>
                                </CollapsibleTrigger>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" onClick={() => onOpenPartForm(null, category.id!)}><PlusCircle className="mr-2 h-4 w-4" /> Add Part</Button>
                                    <AlertDialog>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={()={() => onOpenCategoryForm(category)}}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}><Trash2 className="mr-2 h-4 w-4" /> Delete Category</DropdownMenuItem></AlertDialogTrigger>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will delete the category "{category.name}" and all options within it.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onConfirmDeleteCategory(category.id!)}>Delete</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </CardHeader>
                            <CollapsibleContent>
                                <CardContent>
                                    <div className="flex items-center space-x-2 py-1 border-b mb-2">
                                        <Checkbox
                                            id={`select-all-${category.id}`}
                                            checked={isAllSelected}
                                            onCheckedChange={(checked) => onToggleSelectAllInCategory(category.id!, !!checked)}
                                            data-state={isSomeButNotAllSelected ? 'indeterminate' : (isAllSelected ? 'checked' : 'unchecked')}
                                        />
                                        <label htmlFor={`select-all-${category.id}`} className="text-sm font-medium leading-none text-muted-foreground">Select All</label>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12"></TableHead>
                                                <TableHead className="w-20">Image</TableHead>
                                                <TableHead>Option Name</TableHead>
                                                <TableHead>Brand</TableHead>
                                                <TableHead className="text-right">Sell Price (ex. GST)</TableHead>
                                                <TableHead className="w-12"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {partsInCategory.map((opt: DealerFitPart) => {
                                                if (!opt || !opt.id) return null;
                                                const brand = allBrands.find(b => b?.id && opt?.brandId && b.id === opt.brandId);
                                                return (
                                                <TableRow key={opt.id} onClick={() => onOpenPartForm(opt, category.id!)} className="cursor-pointer">
                                                    <TableCell onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedParts.includes(opt.id)} onCheckedChange={() => onTogglePartSelection(opt.id!)} /></TableCell>
                                                    <TableCell>
                                                        {opt.imageUrl ? <img src={opt.imageUrl} alt={opt.name} className="h-12 w-12 object-contain" /> : <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center"><ImageIcon className="text-muted-foreground"/></div>}
                                                    </TableCell>
                                                    <TableCell className="font-medium">{opt.name}</TableCell>
                                                    <TableCell>{brand?.name || '-'}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(opt.sellPrice)}</TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <AlertDialog>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon"><MoreVertical /></Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => onOpenPartForm(opt, category.id!)}><Edit className="mr-2" />Edit</DropdownMenuItem>
                                                                    <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive" onSelect={e => e.preventDefault()}><Trash2 className="mr-2" />Delete</DropdownMenuItem></AlertDialogTrigger>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{opt.name}".</AlertDialogDescription></AlertDialogHeader>
                                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onConfirmDeletePart(opt.id!)}>Delete</AlertDialogAction></AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </TableCell>
                                                </TableRow>
                                            )})}
                                            {partsInCategory.length === 0 && (
                                                <TableRow><TableCell colSpan={6} className="h-24 text-center">No options in this category.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </CollapsibleContent>
                        </Card>
                    </Collapsible>
                )})}
                {uncategorizedOptions.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle>Uncategorized Options</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                     <TableRow>
                                        <TableHead className="w-12"></TableHead>
                                        <TableHead className="w-20">Image</TableHead>
                                        <TableHead>Option Name</TableHead>
                                         <TableHead>Brand</TableHead>
                                        <TableHead className="text-right">Sell Price (ex. GST)</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {uncategorizedOptions.map((opt: DealerFitPart) => {
                                        if (!opt || !opt.id) return null;
                                        const brand = allBrands.find(b => b?.id && opt?.brandId && b.id === opt.brandId);
                                        return (
                                        <TableRow key={opt.id} onClick={() => onOpenPartForm(opt, opt.categoryId ?? '__none__')} className="cursor-pointer">
                                            <TableCell onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedParts.includes(opt.id!)} onCheckedChange={()={() => onTogglePartSelection(opt.id!)}} /></TableCell>
                                            <TableCell>
                                                {opt.imageUrl ? <img src={opt.imageUrl} alt={opt.name} className="h-12 w-12 object-contain" /> : <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center"><ImageIcon className="text-muted-foreground"/></div>}
                                            </TableCell>
                                            <TableCell className="font-medium">{opt.name}</TableCell>
                                            <TableCell>{brand?.name || '-'}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(opt.sellPrice)}</TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                 <AlertDialog>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon"><MoreVertical /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => onOpenPartForm(opt, opt.categoryId ?? '__none__')}><Edit className="mr-2" />Edit</DropdownMenuItem>
                                                            <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive" onSelect={e => e.preventDefault()}><Trash2 className="mr-2" />Delete</DropdownMenuItem></AlertDialogTrigger>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{opt.name}".</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onConfirmDeletePart(opt.id!)}>Delete</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    )})}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
                </>
            )}
        </div>
    )
}

function KitsTabView({ allKits, allParts, onSaveKit, onDeleteKit, onOpenKitForm }: {
    allKits: DealerFitKit[];
    allParts: DealerFitPart[];
    onSaveKit: (data: KitFormValues) => void;
    onDeleteKit: (kitId: string) => void;
    onOpenKitForm: (kit: DealerFitKit | null) => void;
}) {
    const totalKitCost = (kit: DealerFitKit) => {
        return kit.partIds.reduce((sum, partId) => {
            const part = allParts.find((p: DealerFitPart) => p.id === partId);
            return sum + (part?.sellPrice || 0);
        }, 0);
    };

    return (
        <div>
            {allKits.length === 0 ? (
                <div className="text-center py-16">
                    <h2 className="text-2xl font-semibold">No Kits Found</h2>
                    <p className="text-muted-foreground mt-2">Click "Add Kit" to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {allKits.map((kit: DealerFitKit) => {
                        if (!kit || !kit.id) return null;
                        return (
                        <Card key={kit.id} className="flex flex-col">
                            <CardHeader className="flex-row items-start justify-between">
                                <CardTitle className="text-lg">{kit.name}</CardTitle>
                                <AlertDialog>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onOpenKitForm(kit)}><Edit className="mr-2" />Edit</DropdownMenuItem>
                                            <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}><Trash2 className="mr-2" />Delete</DropdownMenuItem></AlertDialogTrigger>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the kit "{kit.name}".</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDeleteKit(kit.id!)}>Delete</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-2">
                                <p className="text-sm font-medium">{kit.partIds.length} Parts</p>
                                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                                    {kit.partIds.slice(0, 5).map(partId => {
                                        const part = allParts.find((p: DealerFitPart) => p.id === partId);
                                        return <li key={partId} className="truncate">{part?.name || 'Unknown Part'}</li>
                                    })}
                                    {kit.partIds.length > 5 && <li>...and {kit.partIds.length - 5} more.</li>}
                                </ul>
                            </CardContent>
                             <CardFooter>
                                <p className="font-semibold text-primary">{formatCurrency(totalKitCost(kit))}</p>
                            </CardFooter>
                        </Card>
                    )})}
                </div>
            )}
        </div>
    )
}

function DealerFitOptionsPageContent() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("parts");

    const [categories, setCategories] = useState<DealerFitCategory[]>([]);
    const [parts, setParts] = useState<DealerFitPart[]>([]);
    const [brands, setBrands] = useState<DealerFitBrand[]>([]);
    const [kits, setKits] = useState<DealerFitKit[]>([]);
    
    // Dialog states
    const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<DealerFitCategory | null>(null);
    const [isBrandFormOpen, setIsBrandFormOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<DealerFitBrand | null>(null);
    const [isOptionFormOpen, setIsOptionFormOpen] = useState(false);
    const [editingOption, setEditingOption] = useState<Partial<DealerFitPart> | null>(null);
    const [selectedParts, setSelectedParts] = useState<string[]>([]);
    const [isKitFormOpen, setIsKitFormOpen] = useState(false);
    const [editingKit, setEditingKit] = useState<DealerFitKit | null>(null);

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [fetchedCategories, fetchedParts, fetchedBrands, fetchedKits] = await Promise.all([
                getDealerFitCategories(),
                getDealerFitParts(),
                getDealerFitBrands(),
                getDealerFitKits(),
            ]);
            setCategories(fetchedCategories.sort((a,b) => a.name.localeCompare(b.name)));
            setParts(fetchedParts);
            setBrands(fetchedBrands.sort((a,b) => a.name.localeCompare(b.name)));
            setKits(fetchedKits);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not load data." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleSaveCategory = async (name: string) => {
        try {
            await saveDealerFitCategory({ id: editingCategory?.id, name });
            toast({ title: "Category Saved" });
            window.location.reload();
        } catch (error) {
            toast({ variant: "destructive", title: "Save Failed", description: String(error) });
        }
    };

    const handleSaveBrand = async (data: BrandFormValues) => {
        try {
            await saveDealerFitBrand({ id: editingBrand?.id, ...data });
            toast({ title: "Brand Saved" });
            window.location.reload();
        } catch (error) {
            toast({ variant: "destructive", title: "Save Failed", description: String(error) });
        }
    }
    
    const handleDeleteCategory = async (categoryId: string) => {
        try {
            await deleteDealerFitCategory(categoryId);
            toast({ title: 'Category Deleted' });
            window.location.reload();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: String(error) });
        }
    };

     const handleDeleteBrand = async (brandId: string) => {
        try {
            await deleteDealerFitBrand(brandId);
            toast({ title: 'Brand Deleted' });
            window.location.reload();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: String(error) });
        }
    };


    const handleOpenOptionForm = (option: Partial<DealerFitPart> | null, categoryId?: string) => {
        const data = option ? { ...option } : { categoryId: categoryId || '__none__' };
        setEditingOption(data);
        setIsOptionFormOpen(true);
    };

    const handleSaveOption = async (data: DealerFitPartFormValues) => {
        try {
            await saveDealerFitPart({ ...editingOption, ...data });
            toast({ title: `Option ${editingOption?.id ? 'Updated' : 'Created'}` });
            window.location.reload();
        } catch (error) {
             toast({ variant: "destructive", title: "Save Failed", description: String(error) });
        }
    };

    const handleDeleteOption = async (optionId: string) => {
        try {
            await deleteDealerFitPart(optionId);
            toast({ title: 'Option Deleted' });
            window.location.reload();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: String(error) });
        }
    };
    
    const handleSaveKit = async (data: KitFormValues) => {
        try {
            await saveDealerFitKit({ ...editingKit, ...data });
            toast({ title: `Kit ${editingKit?.id ? 'Updated' : 'Created'}` });
            window.location.reload();
        } catch (error) {
            toast({ variant: "destructive", title: "Save Failed", description: String(error) });
        }
    };
    
    const handleDeleteKit = async (kitId: string) => {
        try {
            await deleteDealerFitKit(kitId);
            toast({ title: "Kit Deleted" });
            window.location.reload();
        } catch (error) {
            toast({ variant: "destructive", title: "Delete Failed", description: String(error) });
        }
    };

    const handleOpenKitForm = (kit: DealerFitKit | null) => {
        setEditingKit(kit);
        setIsKitFormOpen(true);
    };
    
    const handleOpenCategoryForm = (category: DealerFitCategory | null) => {
        setEditingCategory(category);
        setIsCategoryFormOpen(true);
    };

    const handleTogglePartSelection = (partId: string) => {
        setSelectedParts(prev =>
            prev.includes(partId) ? prev.filter(id => id !== partId) : [...prev, partId]
        );
    };

    const handleToggleSelectAllInCategory = (categoryId: string, shouldSelect: boolean) => {
        const partsInCategory = parts.filter(p => p.categoryId === categoryId).map(p => p.id!);
        setSelectedParts(prev => {
            const newSelected = new Set(prev);
            if (shouldSelect) {
                partsInCategory.forEach(id => newSelected.add(id));
            } else {
                 const partsInCategorySet = new Set(partsInCategory);
                 return Array.from(newSelected).filter(id => !partsInCategorySet.has(id));
            }
            return Array.from(newSelected);
        });
    };

    const handleBulkDelete = async () => {
        try {
            await deleteDealerFitParts(selectedParts);
            toast({
                title: "Parts Deleted",
                description: `${selectedParts.length} parts have been deleted.`
            });
            window.location.reload();
        } catch (error) {
            toast({ variant: "destructive", title: "Delete Failed", description: "Could not delete selected parts." });
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col h-screen">
                <Header><Button asChild variant="outline"><Link href="/catalogue"><ArrowLeft /> Back to Data Modules</Link></Button></Header>
                <main className="flex-1 p-8"><Skeleton className="h-96 w-full" /></main>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            <Header>
                <Button asChild variant="outline"><Link href="/catalogue"><ArrowLeft /> Back to Data Modules</Link></Button>
            </Header>
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <div className="flex justify-between items-center mb-8">
                        <div>
                             <TabsList>
                                <TabsTrigger value="parts">Parts</TabsTrigger>
                                <TabsTrigger value="kits">Kits</TabsTrigger>
                            </TabsList>
                        </div>
                        <div className="flex gap-2">
                             {selectedParts.length > 0 && activeTab === 'parts' && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedParts.length})
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete {selectedParts.length} part(s). This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleBulkDelete}>Delete Parts</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button><PlusCircle className="mr-2" /> Add</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {activeTab === 'parts' && <DropdownMenuItem onSelect={() => handleOpenOptionForm(null)}>Option</DropdownMenuItem>}
                                    {activeTab === 'parts' && <DropdownMenuItem onSelect={() => handleOpenCategoryForm(null)}>Category</DropdownMenuItem>}
                                    {activeTab === 'parts' && <DropdownMenuItem onSelect={() => { setEditingBrand(null); setIsBrandFormOpen(true); }}>Brand</DropdownMenuItem>}
                                    {activeTab === 'kits' && <DropdownMenuItem onSelect={() => handleOpenKitForm(null)}>Kit</DropdownMenuItem>}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                     <CategoryFormDialog isOpen={isCategoryFormOpen} setIsOpen={setIsCategoryFormOpen} onSave={handleSaveCategory} initialName={editingCategory?.name} />
                     <BrandFormDialog isOpen={isBrandFormOpen} setIsOpen={setIsBrandFormOpen} onSave={handleSaveBrand} initialData={editingBrand} />
                     <DealerFitPartFormDialog isOpen={isOptionFormOpen} setIsOpen={setIsOptionFormOpen} onSave={handleSaveOption} initialData={editingOption} allCategories={categories} allBrands={brands} />
                     <KitFormDialog isOpen={isKitFormOpen} setIsOpen={setIsKitFormOpen} onSave={handleSaveKit} initialData={editingKit} allParts={parts} />

                    <TabsContent value="parts">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                            <div className="lg:col-span-1">
                                <Card>
                                    <CardHeader><CardTitle>Brands</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {brands.map(brand => (
                                                <div key={brand.id} className="flex justify-between items-center p-2 rounded-md hover:bg-muted">
                                                    {brand.logo ? (
                                                        <img src={brand.logo} alt={`${brand.name} logo`} className="h-8 object-contain" />
                                                    ) : (
                                                        <span className="font-medium">{brand.name}</span>
                                                    )}
                                                    <AlertDialog>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical /></Button></DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                <DropdownMenuItem onClick={()={() => {setEditingBrand(brand); setIsBrandFormOpen(true);}}><Edit className="mr-2"/>Edit</DropdownMenuItem>
                                                                <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2"/>Delete</DropdownMenuItem></AlertDialogTrigger>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader><AlertDialogTitle>Delete Brand?</AlertDialogTitle><AlertDialogDescription>This will delete "{brand.name}" and disassociate it from all parts. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteBrand(brand.id!)}>Delete</AlertDialogAction></AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            ))}
                                            {brands.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No brands created.</p>}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="lg:col-span-3">
                                 <PartsTabView
                                    allBrands={brands}
                                    allCategories={categories}
                                    allParts={parts}
                                    onOpenPartForm={handleOpenOptionForm}
                                    onOpenCategoryForm={handleOpenCategoryForm}
                                    onConfirmDeleteCategory={handleDeleteCategory}
                                    onConfirmDeletePart={handleDeleteOption}
                                    selectedParts={selectedParts}
                                    onTogglePartSelection={handleTogglePartSelection}
                                    onToggleSelectAllInCategory={handleToggleSelectAllInCategory}
                                />
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="kits">
                         <KitsTabView allKits={kits} allParts={parts} onSaveKit={handleSaveKit} onDeleteKit={handleDeleteKit} onOpenKitForm={handleOpenKitForm} />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

export default function DealerFitOptionsPage() {
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
            <DealerFitOptionsPageContent />
        </SidebarProvider>
    );
}

    