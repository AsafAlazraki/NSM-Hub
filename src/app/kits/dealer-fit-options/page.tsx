

"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { DealerFitCategory, DealerFitPart } from '@/lib/types';
import { getDealerFitCategories, saveDealerFitCategory, deleteDealerFitCategory, getDealerFitParts, saveDealerFitPart, deleteDealerFitPart, saveDealerFitParts, deleteDealerFitParts } from '@/lib/storage';
import { PlusCircle, MoreVertical, Edit, Trash2, ArrowLeft, ChevronDown, Upload, Search, List, LayoutGrid, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


// --- Schemas ---
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required."),
});
type CategoryFormValues = z.infer<typeof categorySchema>;

const partSchema = z.object({
  name: z.string().min(1, "Part name is required."),
  supplier: z.string().optional(),
  code: z.string().optional(),
  partNumber: z.string().optional(),
  pa: z.coerce.number().min(0).default(0),
  cost: z.coerce.number().min(0).default(0),
  mu: z.coerce.number().min(0).default(0),
  gp: z.coerce.number().min(0).default(0),
  sellPrice: z.coerce.number().min(0).default(0),
});
type PartFormValues = z.infer<typeof partSchema>;

const bulkPartsSchema = z.object({
    pastedData: z.string().min(1, "Please paste data from your spreadsheet."),
});
type BulkPartsFormValues = z.infer<typeof bulkPartsSchema>;


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

const PartFormDialog = ({ isOpen, setIsOpen, onSave, categoryId, initialData }: { isOpen: boolean, setIsOpen: (open: boolean) => void, onSave: (part: PartFormValues) => void, categoryId: string, initialData?: DealerFitPart | null }) => {
     const form = useForm<PartFormValues>({
        resolver: zodResolver(partSchema),
        defaultValues: initialData || { name: '', supplier: '', code: '', partNumber: '', pa: 0, cost: 0, mu: 0, gp: 0, sellPrice: 0},
    });

     useEffect(() => {
        if(isOpen) form.reset(initialData || { name: '', supplier: '', code: '', partNumber: '', pa: 0, cost: 0, mu: 0, gp: 0, sellPrice: 0});
    }, [initialData, isOpen, form]);

    const onSubmit = (data: PartFormValues) => {
        onSave(data);
        setIsOpen(false);
    };
    
    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
        event.target.select();
    };


    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-2xl">
                <DialogHeader><DialogTitle>{initialData ? 'Edit' : 'Add'} Part</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Part Name</FormLabel><FormControl><Input {...field} autoFocus /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-3 gap-4">
                            <FormField control={form.control} name="supplier" render={({ field }) => (<FormItem><FormLabel>Supplier</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="code" render={({ field }) => (<FormItem><FormLabel>Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="partNumber" render={({ field }) => (<FormItem><FormLabel>Part Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <div className="grid grid-cols-5 gap-4">
                            <FormField control={form.control} name="pa" render={({ field }) => (<FormItem><FormLabel>P&amp;A</FormLabel><FormControl><Input type="number" step="any" {...field} onFocus={handleFocus} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="cost" render={({ field }) => (<FormItem><FormLabel>Cost (ex. GST)</FormLabel><FormControl><Input type="number" step="any" {...field} onFocus={handleFocus} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="mu" render={({ field }) => (<FormItem><FormLabel>MU %</FormLabel><FormControl><Input type="number" step="any" {...field} onFocus={handleFocus} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="gp" render={({ field }) => (<FormItem><FormLabel>GP %</FormLabel><FormControl><Input type="number" step="any" {...field} onFocus={handleFocus} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="sellPrice" render={({ field }) => (<FormItem><FormLabel>Sell (ex. GST)</FormLabel><FormControl><Input type="number" step="any" {...field} onFocus={handleFocus} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
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

const BulkAddDialog = ({ isOpen, setIsOpen, onSave, categoryName }: { isOpen: boolean, setIsOpen: (open: boolean) => void, onSave: (pastedData: string) => void, categoryName: string }) => {
    const form = useForm<BulkPartsFormValues>({
        resolver: zodResolver(bulkPartsSchema),
        defaultValues: { pastedData: '' },
    });

    const onSubmit = (data: BulkPartsFormValues) => {
        onSave(data.pastedData);
        setIsOpen(false);
        form.reset();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-3xl" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Bulk Add Parts to "{categoryName}"</DialogTitle>
                    <DialogDescription>
                        Paste data below. Each part should be on a new line, and columns should be separated by a double slash <code className="bg-muted text-muted-foreground p-1 rounded-sm text-xs">//</code>.
                        <br/>
                        The required column order is:
                        <br/>
                        <code className="bg-muted text-muted-foreground p-1 rounded-sm text-xs">Name//Supplier//Code//P&amp;A//Cost//MU%//GP%//Sell</code>
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="pastedData"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Pasted Data</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            rows={10}
                                            placeholder="Example: Part A//Supplier X//PX-01//10//20//50//33.3//30"
                                            autoFocus
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit">Add Parts</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
}

const TableView = ({ currentParts, categories, onSave, onAddNewPart, selectedParts, onPartSelect }: { currentParts: DealerFitPart[], categories: DealerFitCategory[], onSave: (part: DealerFitPart) => Promise<void>, onAddNewPart: () => void, selectedParts: string[], onPartSelect: (partId: string) => void }) => {
    const [localParts, setLocalParts] = useState(currentParts);
    const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
    const { toast } = useToast();
    
    useEffect(() => {
        setLocalParts(currentParts);
    }, [currentParts]);

    const handleInputChange = (partId: string, field: keyof DealerFitPart, value: string | number) => {
        setLocalParts(prevParts => 
            prevParts.map(p => p.id === partId ? {...p, [field]: value} : p)
        );
    }
    
    const handleSave = async (partId: string) => {
        const partToSave = localParts.find(p => p.id === partId);
        if (!partToSave) return;

        setIsSaving(prev => ({...prev, [partId]: true}));
        try {
            await onSave(partToSave);
            toast({ title: "Part Saved", description: `"${partToSave.name}" has been updated.`});
        } catch (e) {
            toast({ variant: 'destructive', title: "Save Failed", description: "Could not save the part."});
        } finally {
            setIsSaving(prev => ({...prev, [partId]: false}));
        }
    }

    return (
        <div>
            <div className="flex justify-end mb-4 gap-2">
                 <Button onClick={onAddNewPart} variant="outline">
                    <PlusCircle className="mr-2" /> Add New Part
                </Button>
            </div>
             <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Part Number</TableHead>
                            <TableHead className="text-right">Sell (ex. GST)</TableHead>
                            <TableHead className="w-24"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {localParts.map(part => (
                            <TableRow key={part.id}>
                                 <TableCell>
                                    <Checkbox
                                        checked={selectedParts.includes(part.id!)}
                                        onCheckedChange={() => onPartSelect(part.id!)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        value={part.name || ''} 
                                        onChange={e => handleInputChange(part.id!, 'name', e.target.value)} 
                                        className="min-w-[200px]" 
                                    />
                                </TableCell>
                                <TableCell>
                                    <Select value={part.categoryId} onValueChange={(value) => handleInputChange(part.id!, 'categoryId', value)}>
                                        <SelectTrigger className="min-w-[150px]">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id!}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        value={part.supplier || ''} 
                                        onChange={e => handleInputChange(part.id!, 'supplier', e.target.value)} 
                                        className="min-w-[150px]" 
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        value={part.code || ''} 
                                        onChange={e => handleInputChange(part.id!, 'code', e.target.value)} 
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        value={part.partNumber || ''} 
                                        onChange={e => handleInputChange(part.id!, 'partNumber', e.target.value)} 
                                        className="min-w-[150px]" 
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        type="number" 
                                        step="any"
                                        value={part.sellPrice || 0} 
                                        onChange={e => handleInputChange(part.id!, 'sellPrice', Number(e.target.value))} 
                                        className="text-right" 
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button size="sm" onClick={() => handleSave(part.id!)} disabled={isSaving[part.id!]}>
                                        {isSaving[part.id!] ? '...' : 'Save'}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                         {localParts.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No parts found for the current filter and page.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export default function DealerFitOptionsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'category' | 'table'>('category');

    const [categories, setCategories] = useState<DealerFitCategory[]>([]);
    const [parts, setParts] = useState<DealerFitPart[]>([]);
    const [openCategories, setOpenCategories] = useState<string[]>([]);
    
    // Dialog states
    const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<DealerFitCategory | null>(null);
    const [isPartFormOpen, setIsPartFormOpen] = useState(false);
    const [editingPart, setEditingPart] = useState<DealerFitPart | null>(null);
    const [parentCategoryId, setParentCategoryId] = useState<string | null>(null);
    const [isBulkAddDialogOpen, setIsBulkAddDialogOpen] = useState(false);
    const [bulkAddCategory, setBulkAddCategory] = useState<DealerFitCategory | null>(null);

    // Bulk Delete
    const [selectedParts, setSelectedParts] = useState<string[]>([]);

    // Search and Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;


    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [fetchedCategories, fetchedParts] = await Promise.all([getDealerFitCategories(), getDealerFitParts()]);
            
            const withTimestamp = fetchedCategories.filter(c => c.createdAt);
            const withoutTimestamp = fetchedCategories.filter(c => !c.createdAt);

            withTimestamp.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
            withoutTimestamp.sort((a, b) => a.name.localeCompare(b.name));

            setCategories([...withTimestamp, ...withoutTimestamp]);
            setParts(fetchedParts);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not load data." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    // --- Search, Filter, & Pagination Logic ---
    const filteredAndSearchedParts = useMemo(() => {
        if (!searchTerm) return parts;
        const lowerSearch = searchTerm.toLowerCase();
        return parts.filter(part =>
            part.name.toLowerCase().includes(lowerSearch) ||
            (part.supplier && part.supplier.toLowerCase().includes(lowerSearch)) ||
            (part.code && part.code.toLowerCase().includes(lowerSearch)) ||
            (part.partNumber && part.partNumber.toLowerCase().includes(lowerSearch))
        );
    }, [searchTerm, parts]);

    const paginatedParts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredAndSearchedParts.slice(startIndex, endIndex);
    }, [filteredAndSearchedParts, currentPage]);
    
    const totalPages = Math.ceil(filteredAndSearchedParts.length / ITEMS_PER_PAGE);

    const filteredCategories = useMemo(() => {
        if (!searchTerm) return categories;
        const lowerSearch = searchTerm.toLowerCase();
        const visiblePartCategoryIds = new Set(filteredAndSearchedParts.map(p => p.categoryId));
        
        return categories.filter(category => 
            category.name.toLowerCase().includes(lowerSearch) ||
            visiblePartCategoryIds.has(category.id)
        );
    }, [searchTerm, categories, filteredAndSearchedParts]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        // Automatically open categories that have search results in category view
        if (searchTerm && viewMode === 'category') {
            setOpenCategories(filteredCategories.map(c => c.id!));
        }
    }, [searchTerm, filteredCategories, viewMode]);


    // --- Handlers ---
    const handleToggleCategory = (categoryId: string) => {
        setOpenCategories(prev => prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]);
    }

    const handleSaveCategory = async (name: string) => {
        try {
            await saveDealerFitCategory({ id: editingCategory?.id, name });
            toast({ title: "Category Saved" });
            fetchData();
        } catch (error) {
            toast({ variant: "destructive", title: "Save Failed", description: String(error) });
        }
    }
    
    const handleDeleteCategory = async (categoryId: string) => {
        try {
            await deleteDealerFitCategory(categoryId);
            toast({ title: "Category Deleted" });
            window.location.reload();
        } catch (error) {
            toast({ variant: "destructive", title: "Delete Failed", description: String(error) });
        }
    }

    const handleOpenPartForm = (part: DealerFitPart | null, categoryId: string) => {
        setEditingPart(part);
        setParentCategoryId(categoryId);
        setIsPartFormOpen(true);
    };

    const handleSavePart = async (partData: PartFormValues) => {
        if (!parentCategoryId) return;
        try {
            const partToSave = { 
                ...editingPart, 
                ...partData, 
                id: editingPart?.id, 
                categoryId: parentCategoryId 
            }
            await saveDealerFitPart(partToSave);
            toast({ title: "Part Saved" });
            fetchData();
        } catch (error) {
            toast({ variant: "destructive", title: "Save Failed", description: String(error) });
        }
    }
    
    const handleSavePartFromTable = async (updatedPart: DealerFitPart) => {
        await saveDealerFitPart(updatedPart);
        // Optimistically update the local state to avoid a full refetch
        setParts(prev => prev.map(p => p.id === updatedPart.id ? updatedPart : p));
    };


    const handleDeletePart = async (partId: string) => {
        try {
            await deleteDealerFitPart(partId);
            toast({ title: "Part Deleted" });
            window.location.reload();
        } catch (error) {
            toast({ variant: "destructive", title: "Delete Failed", description: String(error) });
        }
    }

    const handleBulkAdd = async (pastedData: string) => {
        if (!bulkAddCategory?.id) return;
        try {
            const count = await saveDealerFitParts(bulkAddCategory.id, pastedData);
            toast({ title: "Bulk Add Successful", description: `${count} parts were added.` });
            fetchData();
        } catch (error) {
            toast({ variant: "destructive", title: "Bulk Add Failed", description: String(error) });
        }
    };
    
    const handleOpenNewPartFromTable = () => {
        const lastCategory = categories[categories.length - 1];
        if(!lastCategory) {
            toast({variant: 'destructive', title: "No Categories", description: "Please create a category before adding a part."});
            return;
        }
        handleOpenPartForm(null, lastCategory.id!);
    }
    
    // --- Bulk Delete Handlers ---
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
                partsInCategory.forEach(id => newSelected.delete(id));
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

    if (authLoading || isLoading) {
         return (
             <div className="flex flex-col h-screen">
                <Header>
                    <Button asChild variant="outline"><Link href="/catalogue"><ArrowLeft /> Back to Data Modules</Link></Button>
                </Header>
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="flex justify-between items-center mb-8">
                        <Skeleton className="h-12 w-1/3" />
                        <Skeleton className="h-10 w-36" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            <Header>
                <Button asChild variant="outline"><Link href="/catalogue"><ArrowLeft /> Back to Data Modules</Link></Button>
            </Header>
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <div className="flex items-baseline gap-4">
                            <h1 className="text-3xl font-headline font-bold">Dealer Fit Options</h1>
                            <span className="text-lg font-semibold text-muted-foreground">({parts.length} parts)</span>
                        </div>
                        <p className="text-muted-foreground">Manage part categories and individual parts.</p>
                    </div>
                     <div className="flex items-center gap-2">
                        {selectedParts.length > 0 && (
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
                        <Button
                            variant="outline"
                            onClick={() => setViewMode(viewMode === 'category' ? 'table' : 'category')}
                        >
                            {viewMode === 'category' ? <List className="mr-2" /> : <LayoutGrid className="mr-2" />}
                            {viewMode === 'category' ? 'Table View' : 'Category View'}
                        </Button>
                        <Button onClick={() => { setEditingCategory(null); setIsCategoryFormOpen(true); }}><PlusCircle /> Add Category</Button>
                     </div>
                </div>
                
                 <div className="mb-8 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search categories or parts..."
                        className="pl-10 h-12 w-full max-w-lg text-base md:text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>


                {/* Dialogs */}
                <CategoryFormDialog isOpen={isCategoryFormOpen} setIsOpen={setIsCategoryFormOpen} onSave={handleSaveCategory} initialName={editingCategory?.name} />
                <PartFormDialog isOpen={isPartFormOpen} setIsOpen={setIsPartFormOpen} onSave={handleSavePart} categoryId={parentCategoryId!} initialData={editingPart} />
                {bulkAddCategory && (
                    <BulkAddDialog isOpen={isBulkAddDialogOpen} setIsOpen={setIsBulkAddDialogOpen} onSave={handleBulkAdd} categoryName={bulkAddCategory.name} />
                )}

                {viewMode === 'table' ? (
                    <>
                     <TableView currentParts={paginatedParts} categories={categories} onSave={handleSavePartFromTable} onAddNewPart={handleOpenNewPartFromTable} selectedParts={selectedParts} onPartSelect={handleTogglePartSelection} />
                     <div className="flex items-center justify-center space-x-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <span>
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                   </>
                ) : (
                    <>
                        {filteredCategories.length === 0 ? (
                            <div className="text-center py-16">
                                <h2 className="text-2xl font-semibold">No Results Found</h2>
                                <p className="text-muted-foreground mt-2">{searchTerm ? 'Try adjusting your search.' : 'Click "Add Category" to get started.'}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredCategories.map(category => {
                                    const partsInCategory = filteredAndSearchedParts.filter(p => p.categoryId === category.id);
                                    if (searchTerm && partsInCategory.length === 0 && !category.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                                        return null;
                                    }
                                    
                                    const selectedPartsInCategoryCount = partsInCategory.filter(p => selectedParts.includes(p.id!)).length;
                                    const isAllSelected = partsInCategory.length > 0 && selectedPartsInCategoryCount === partsInCategory.length;
                                    const isSomeButNotAllSelected = partsInCategory.length > 0 && selectedPartsInCategoryCount > 0 && selectedPartsInCategoryCount < partsInCategory.length;

                                    return (
                                    <Collapsible key={category.id} asChild open={openCategories.includes(category.id!)} onOpenChange={() => handleToggleCategory(category.id!)}>
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <CollapsibleTrigger className="flex-1 group">
                                                    <div className="flex items-center gap-2">
                                                        <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-0 group-data-[state=closed]:-rotate-90" />
                                                        <CardTitle className="text-xl font-headline">{category.name}</CardTitle>
                                                    </div>
                                                </CollapsibleTrigger>
                                                <div className="flex items-center gap-2">
                                                    <Button size="sm" variant="secondary" onClick={() => { setBulkAddCategory(category); setIsBulkAddDialogOpen(true); }}><Upload className="mr-2 h-4 w-4" /> Bulk Add</Button>
                                                    <Button size="sm" variant="outline" onClick={() => handleOpenPartForm(null, category.id!)}><PlusCircle className="mr-2 h-4 w-4" /> Add Part</Button>
                                                    <AlertDialog>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => { setEditingCategory(category); setIsCategoryFormOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Edit Name</DropdownMenuItem>
                                                                <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}><Trash2 className="mr-2 h-4 w-4" /> Delete Category</DropdownMenuItem></AlertDialogTrigger>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will delete the category "{category.name}" and all parts within it.</AlertDialogDescription></AlertDialogHeader>
                                                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCategory(category.id!)}>Delete</AlertDialogAction></AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </CardHeader>
                                            <CollapsibleContent asChild>
                                                <CardContent>
                                                    {partsInCategory.length > 0 && (
                                                        <div className="flex items-center space-x-2 py-1 border-b mb-2">
                                                            <Checkbox
                                                                id={`select-all-${category.id}`}
                                                                checked={isAllSelected}
                                                                onCheckedChange={(checked) => handleToggleSelectAllInCategory(category.id!, !!checked)}
                                                                data-state={isSomeButNotAllSelected ? 'indeterminate' : (isAllSelected ? 'checked' : 'unchecked')}
                                                            />
                                                            <label
                                                                htmlFor={`select-all-${category.id}`}
                                                                className="text-sm font-medium leading-none text-muted-foreground"
                                                            >
                                                                Select All in Category
                                                            </label>
                                                        </div>
                                                    )}
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="w-12"></TableHead>
                                                                <TableHead>Name</TableHead>
                                                                <TableHead>Part Number</TableHead>
                                                                <TableHead>Supplier</TableHead>
                                                                <TableHead>Code</TableHead>
                                                                <TableHead className="text-right">P&amp;A</TableHead>
                                                                <TableHead className="text-right">Cost (ex. GST)</TableHead>
                                                                <TableHead className="text-right">MU %</TableHead>
                                                                <TableHead className="text-right">GP %</TableHead>
                                                                <TableHead className="text-right">Sell (ex. GST)</TableHead>
                                                                <TableHead className="w-12"></TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {partsInCategory.map(part => (
                                                                <TableRow 
                                                                    key={part.id} 
                                                                    className="cursor-pointer"
                                                                >
                                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                                         <Checkbox
                                                                            checked={selectedParts.includes(part.id!)}
                                                                            onCheckedChange={() => handleTogglePartSelection(part.id!)}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell onClick={() => handleOpenPartForm(part, category.id!)} className="font-medium">{part.name}</TableCell>
                                                                    <TableCell onClick={() => handleOpenPartForm(part, category.id!)}>{part.partNumber}</TableCell>
                                                                    <TableCell onClick={() => handleOpenPartForm(part, category.id!)}>{part.supplier}</TableCell>
                                                                    <TableCell onClick={() => handleOpenPartForm(part, category.id!)}>{part.code}</TableCell>
                                                                    <TableCell onClick={() => handleOpenPartForm(part, category.id!)} className="text-right">{formatCurrency(part.pa || 0)}</TableCell>
                                                                    <TableCell onClick={() => handleOpenPartForm(part, category.id!)} className="text-right">{formatCurrency(part.cost || 0)}</TableCell>
                                                                    <TableCell onClick={() => handleOpenPartForm(part, category.id!)} className="text-right">{(part.mu || 0).toFixed(2)}%</TableCell>
                                                                    <TableCell onClick={() => handleOpenPartForm(part, category.id!)} className="text-right">{(part.gp || 0).toFixed(2)}%</TableCell>
                                                                    <TableCell onClick={() => handleOpenPartForm(part, category.id!)} className="text-right">{formatCurrency(part.sellPrice || 0)}</TableCell>
                                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                                        <AlertDialog>
                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                                                <DropdownMenuContent align="end">
                                                                                    <DropdownMenuItem onClick={() => handleOpenPartForm(part, category.id!)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                                                    <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem></AlertDialogTrigger>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                            <AlertDialogContent>
                                                                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the part "{part.name}".</AlertDialogDescription></AlertDialogHeader>
                                                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeletePart(part.id!)}>Delete</AlertDialogAction></AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                            {partsInCategory.length === 0 && (
                                                                <TableRow><TableCell colSpan={11} className="text-center h-24">No parts in this category.</TableCell></TableRow>
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </CardContent>
                                            </CollapsibleContent>
                                        </Card>
                                    </Collapsible>
                                )})}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

    