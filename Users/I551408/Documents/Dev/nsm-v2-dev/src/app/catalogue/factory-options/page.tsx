
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { 
    getFactoryOptionCategories, 
    saveFactoryOptionCategory, 
    deleteFactoryOptionCategory, 
    getCatalogueFactoryOptions,
    deleteCatalogueFactoryOption,
    getBoatBrands,
    getBoatRanges,
    getBoatModels,
    getCatalogueMotors,
    getCatalogueTrailers,
    getUserProfile,
    getStaticLogo
} from '@/lib/storage';
import type { FactoryOption, FactoryOptionCategory, BoatBrand, BoatRange, BoatModel, OptionTag, UserProfile, CatalogueMotor, CatalogueTrailer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, PlusCircle, MoreVertical, Edit, Trash2, ImageIcon, ChevronDown, Search, X, Tag } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getAuth, signOut } from 'firebase/auth';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { Checkbox } from '@/components/ui/checkbox';

const optionTagSchema = z.enum(['Boat', 'Motor', 'Trailer', 'Misc']);

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required."),
  compatibleBoatModelIds: z.array(z.string()).optional(),
  compatibleMotorIds: z.array(z.string()).optional(),
  compatibleTrailerIds: z.array(z.string()).optional(),
  tag: optionTagSchema.optional(),
});
type CategoryFormValues = z.infer<typeof categorySchema>;


const CategoryFormDialog = ({ 
    isOpen, 
    setIsOpen, 
    onSave, 
    initialData,
    allModels,
    allBrands,
    allRanges,
    allMotors,
    allTrailers,
}: { 
    isOpen: boolean, 
    setIsOpen: (isOpen: boolean) => void, 
    onSave: (data: CategoryFormValues) => void, 
    initialData?: Partial<FactoryOptionCategory> | null,
    allModels: BoatModel[],
    allBrands: BoatBrand[],
    allRanges: BoatRange[],
    allMotors: CatalogueMotor[],
    allTrailers: CatalogueTrailer[],
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
    });

     useEffect(() => {
        if(isOpen) {
            form.reset({ 
                name: initialData?.name || '', 
                compatibleBoatModelIds: initialData?.compatibleBoatModelIds || [],
                compatibleMotorIds: initialData?.compatibleMotorIds || [],
                compatibleTrailerIds: initialData?.compatibleTrailerIds || [],
                tag: (initialData?.tag || 'Boat'),
            });
            setSearchTerm(''); 
        }
    }, [initialData, isOpen, form]);

    const onSubmit = (data: CategoryFormValues) => {
        onSave(data);
        setIsOpen(false);
    };
    
    const modelsWithBrandAndRange = useMemo(() => {
        const rangeMap = new Map(allRanges.map(r => [r.id, r]));
        const brandMap = new Map(allBrands.map(b => [b.id, b]));
        return allModels.map(model => ({
            ...model,
            rangeName: rangeMap.get(model.rangeId)?.name || 'N/A',
            brandName: brandMap.get(rangeMap.get(model.rangeId)?.brandId || '')?.name || 'N/A',
        }));
    }, [allModels, allRanges, allBrands]);
    
    const watchedTag = form.watch('tag');

    const compatibilityItems = useMemo(() => {
        switch (watchedTag) {
            case 'Boat': return modelsWithBrandAndRange.map(m => ({ id: m.id!, name: `${m.brandName} ${m.name}` }));
            case 'Motor': return allMotors.map(m => ({ id: m.id!, name: m.name }));
            case 'Trailer': return allTrailers.map(t => ({ id: t.id!, name: t.name }));
            default: return [];
        }
    }, [watchedTag, modelsWithBrandAndRange, allMotors, allTrailers]);

    const compatibilityKey = useMemo(() => {
        switch (watchedTag) {
            case 'Boat': return 'compatibleBoatModelIds';
            case 'Motor': return 'compatibleMotorIds';
            case 'Trailer': return 'compatibleTrailerIds';
            default: return null;
        }
    }, [watchedTag]);

    const watchedCompatibleIds = compatibilityKey ? form.watch(compatibilityKey) || [] : [];
    
    useEffect(() => {
        const currentTag = form.getValues('tag');
        if (currentTag !== 'Boat') form.setValue('compatibleBoatModelIds', []);
        if (currentTag !== 'Motor') form.setValue('compatibleMotorIds', []);
        if (currentTag !== 'Trailer') form.setValue('compatibleTrailerIds', []);
    }, [watchedTag, form]);


    const filteredItems = useMemo(() => {
        if (!compatibilityItems) return [];
        const filtered = compatibilityItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const selectedSet = new Set(watchedCompatibleIds);
        const selectedInList = compatibilityItems.filter(i => selectedSet.has(i.id!));
        const combined = new Map([...filtered, ...selectedInList].map(i => [i.id, i]));
        return Array.from(combined.values());
    }, [compatibilityItems, searchTerm, watchedCompatibleIds]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader><DialogTitle>{initialData?.id ? 'Edit' : 'Add'} Category</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category Name</FormLabel>
                                    <FormControl><Input {...field} autoFocus /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="tag" render={({ field }) => (
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
                        
                        {compatibilityKey && (
                            <div className="space-y-2">
                                <FormLabel>Compatible {watchedTag}s</FormLabel>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder={`Search ${watchedTag?.toLowerCase()}s...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
                                    {searchTerm && <Button variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2" onClick={() => setSearchTerm('')}><X className="h-4 w-4" /></Button>}
                                </div>
                                <FormField
                                    control={form.control}
                                    name={compatibilityKey}
                                    render={({ field }) => (
                                        <FormItem>
                                            <ScrollArea className="h-64 border rounded-md">
                                                <div className="p-4 space-y-2">
                                                    {filteredItems.map((item) => (
                                                        <FormItem key={item.id} className="flex flex-row items-center space-x-3 space-y-0 p-2 rounded-md hover:bg-muted/50">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(item.id!)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                        ? field.onChange([...(field.value || []), item.id])
                                                                        : field.onChange((field.value || []).filter(value => value !== item.id))
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal cursor-pointer w-full">
                                                                {item.name}
                                                            </FormLabel>
                                                        </FormItem>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

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

const tagColors: Record<OptionTag, string> = {
  Boat: 'bg-blue-100 text-blue-800',
  Motor: 'bg-green-100 text-green-800',
  Trailer: 'bg-orange-100 text-orange-800',
  Misc: 'bg-gray-100 text-gray-800',
};

export default function FactoryOptionsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const auth = getAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    const [categories, setCategories] = useState<FactoryOptionCategory[]>([]);
    const [parts, setParts] = useState<FactoryOption[]>([]);
    const [allModels, setAllModels] = useState<BoatModel[]>([]);
    const [allBrands, setAllBrands] = useState<BoatBrand[]>([]);
    const [allRanges, setAllRanges] = useState<BoatRange[]>([]);
    const [allMotors, setAllMotors] = useState<CatalogueMotor[]>([]);
    const [allTrailers, setAllTrailers] = useState<CatalogueTrailer[]>([]);
    
    // Dialog states
    const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Partial<FactoryOptionCategory> | null>(null);
    
    const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
    const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
    const [logo, setLogo] = useState<string | null>(null);

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [fetchedCategories, fetchedOptions, fetchedModels, fetchedBrands, fetchedRanges, fetchedMotors, fetchedTrailers] = await Promise.all([
                getFactoryOptionCategories(),
                getCatalogueFactoryOptions(),
                getBoatModels(),
                getBoatBrands(),
                getBoatRanges(),
                getCatalogueMotors(),
                getCatalogueTrailers(),
            ]);
            setCategories(fetchedCategories.sort((a,b) => a.name.localeCompare(b.name)));
            setParts(fetchedOptions);
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
    
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

     useEffect(() => {
        const fetchUserData = async () => {
            if(user) {
                const [profile, staticLogo] = await Promise.all([
                    getUserProfile(user.uid),
                    getStaticLogo()
                ]);
                setCurrentUserProfile(profile);
                setLogo(staticLogo);
            }
        }
        fetchUserData();
        fetchData();
    }, [user]);

    const handleSaveCategory = async (data: CategoryFormValues) => {
        try {
            await saveFactoryOptionCategory({ ...editingCategory, ...data });
            toast({ title: "Category Saved" });
            fetchData();
        } catch (error) {
            toast({ variant: "destructive", title: "Save Failed", description: String(error) });
        }
    };
    
    const handleDeleteCategory = async (categoryId: string) => {
        try {
            await deleteFactoryOptionCategory(categoryId);
            toast({ title: 'Category Deleted' });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: String(error) });
        }
    };
    
    const handleOpenCategoryForm = (category: Partial<FactoryOptionCategory> | null) => {
        setEditingCategory(category);
        setIsCategoryFormOpen(true);
    }

    const handleDeleteOption = async (optionId: string) => {
        try {
            await deleteCatalogueFactoryOption(optionId);
            toast({ title: 'Option Deleted' });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: String(error) });
        }
    };
    
    const handleSignOut = async () => {
        await signOut(getAuth());
        router.push('/login');
    };

    const uncategorizedOptions = parts.filter(opt => !opt.categoryId || opt.categoryId === '__none__');

    if (authLoading || isLoading || !user) {
        return (
            <SidebarProvider>
                <div className="flex flex-col h-screen">
                    <Header><Button asChild variant="outline"><Link href="/catalogue"><ArrowLeft /> Back to Data Modules</Link></Button></Header>
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
            <div className="flex flex-col h-screen">
                <Header>
                    <Button asChild variant="outline"><Link href="/catalogue"><ArrowLeft /> Back to Data Modules</Link></Button>
                </Header>
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-headline font-bold">Factory Options Catalogue</h1>
                            <p className="text-muted-foreground">Manage factory-fit options, categories, and prices.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => router.push('/catalogue/factory-options/new')}><PlusCircle /> Add Option</Button>
                            <Button variant="outline" onClick={() => handleOpenCategoryForm(null)}><PlusCircle /> Add Category</Button>
                        </div>
                    </div>

                    <CategoryFormDialog isOpen={isCategoryFormOpen} setIsOpen={setIsCategoryFormOpen} onSave={handleSaveCategory} initialData={editingCategory} allModels={allModels} allBrands={allBrands} allRanges={allRanges} allMotors={allMotors} allTrailers={allTrailers} />
                    <div className="space-y-4">
                        {categories.length === 0 && uncategorizedOptions.length === 0 ? (
                            <div className="text-center py-16">
                                <h2 className="text-2xl font-semibold">No options or categories found</h2>
                                <p className="text-muted-foreground mt-2">Click "Add Option" or "Add Category" to get started.</p>
                            </div>
                        ) : (
                            <>
                            {categories.map(category => (
                                <Collapsible key={category.id} defaultOpen={true} asChild>
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <CollapsibleTrigger className="flex-1 group">
                                                <div className="flex items-center gap-2">
                                                    <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-0 group-data-[state=closed]:-rotate-90" />
                                                    <CardTitle className="text-xl font-headline">{category.name}</CardTitle>
                                                    {category.tag && <Badge className={cn("text-xs", tagColors[category.tag])}>{category.tag}</Badge>}
                                                </div>
                                            </CollapsibleTrigger>
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" variant="outline" onClick={() => router.push(`/catalogue/factory-options/new?categoryId=${category.id}`)}><PlusCircle className="mr-2 h-4 w-4" /> Add Option</Button>
                                                <AlertDialog>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleOpenCategoryForm(category)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                            <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}><Trash2 className="mr-2 h-4 w-4" /> Delete Category</DropdownMenuItem></AlertDialogTrigger>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will delete the category "{category.name}". Any options within it will become uncategorized.</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCategory(category.id!)}>Delete</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </CardHeader>
                                        <CollapsibleContent>
                                            <CardContent>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-20">Image</TableHead>
                                                            <TableHead>Option Name</TableHead>
                                                            <TableHead>NSM Code</TableHead>
                                                            <TableHead>Factory Code</TableHead>
                                                            <TableHead className="text-right">Sell Price</TableHead>
                                                            <TableHead className="w-12"></TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {parts.filter(opt => opt.categoryId === category.id).map(opt => (
                                                                <TableRow key={opt.id} className="cursor-pointer" onClick={() => router.push(`/catalogue/factory-options/${opt.id}/edit`)}>
                                                                    <TableCell>
                                                                        {opt.imageUrl ? <img src={opt.imageUrl} alt={opt.name} className="h-12 w-12 object-contain" /> : <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center"><ImageIcon className="text-muted-foreground"/></div>}
                                                                    </TableCell>
                                                                    <TableCell className="font-medium">{opt.name}</TableCell>
                                                                    <TableCell>{opt.nsmCode || '-'}</TableCell>
                                                                    <TableCell>{opt.factoryCode || '-'}</TableCell>
                                                                    <TableCell className="text-right">{formatCurrency(opt.sellPrice)}</TableCell>
                                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                                        <AlertDialog>
                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger asChild>
                                                                                    <Button variant="ghost" size="icon"><MoreVertical /></Button>
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent align="end">
                                                                                    <DropdownMenuItem onClick={() => router.push(`/catalogue/factory-options/${opt.id}/edit`)}><Edit className="mr-2" />Edit</DropdownMenuItem>
                                                                                    <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive" onSelect={e => e.preventDefault()}><Trash2 className="mr-2" />Delete</DropdownMenuItem></AlertDialogTrigger>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                            <AlertDialogContent>
                                                                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the option "{opt.name}".</AlertDialogDescription></AlertDialogHeader>
                                                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteOption(opt.id!)}>Delete</AlertDialogAction></AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        {parts.filter(opt => opt.categoryId === category.id).length === 0 && (
                                                            <TableRow><TableCell colSpan={6} className="h-24 text-center">No options in this category.</TableCell></TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </CardContent>
                                        </CollapsibleContent>
                                    </Card>
                                </Collapsible>
                            ))}

                            {uncategorizedOptions.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Uncategorized Options</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-20">Image</TableHead>
                                                    <TableHead>Option Name</TableHead>
                                                    <TableHead>Tag</TableHead>
                                                    <TableHead>NSM Code</TableHead>
                                                    <TableHead>Factory Code</TableHead>
                                                    <TableHead className="text-right">Sell Price</TableHead>
                                                    <TableHead className="w-12"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {uncategorizedOptions.map(opt => (
                                                    <TableRow key={opt.id} className="cursor-pointer" onClick={() => router.push(`/catalogue/factory-options/${opt.id}/edit`)}>
                                                        <TableCell>
                                                            {opt.imageUrl ? <img src={opt.imageUrl} alt={opt.name} className="h-12 w-12 object-contain" /> : <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center"><ImageIcon className="text-muted-foreground"/></div>}
                                                        </TableCell>
                                                        <TableCell className="font-medium">{opt.name}</TableCell>
                                                        <TableCell>
                                                            {opt.tag && <Badge variant="outline" className={cn(tagColors[opt.tag])}>{opt.tag}</Badge>}
                                                        </TableCell>
                                                        <TableCell>{opt.nsmCode || '-'}</TableCell>
                                                        <TableCell>{opt.factoryCode || '-'}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(opt.sellPrice)}</TableCell>
                                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                                            <AlertDialog>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon"><MoreVertical /></Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => router.push(`/catalogue/factory-options/${opt.id}/edit`)}><Edit className="mr-2" />Edit</DropdownMenuItem>
                                                                        <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive" onSelect={e => e.preventDefault()}><Trash2 className="mr-2" />Delete</DropdownMenuItem></AlertDialogTrigger>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the option "{opt.name}".</AlertDialogDescription></AlertDialogHeader>
                                                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteOption(opt.id!)}>Delete</AlertDialogAction></AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            )}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
