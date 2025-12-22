

"use client";

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { CataloguePart, UserProfile } from '@/lib/types';
import { getCatalogueParts, saveCataloguePart, deleteCataloguePart, getUserProfile, getStaticLogo } from '@/lib/storage';
import { PlusCircle, MoreVertical, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { getAuth, signOut } from 'firebase/auth';

const partSchema = z.object({
  name: z.string().min(1, "Part name is required."),
  cost: z.coerce.number().min(0, "Cost cannot be negative."),
});

type PartFormValues = z.infer<typeof partSchema>;

export default function PartsCataloguePage() {
    const [parts, setParts] = useState<CataloguePart[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const auth = getAuth();
    const { toast } = useToast();
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPart, setEditingPart] = useState<CataloguePart | null>(null);

    const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
    const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
    const [logo, setLogo] = useState<string | null>(null);


    const form = useForm<PartFormValues>({
        resolver: zodResolver(partSchema),
        defaultValues: { name: '', cost: 0 },
    });

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

    const fetchData = async () => {
        if (user) {
            setIsLoading(true);
            try {
                const fetchedParts = await getCatalogueParts();
                setParts(fetchedParts);
            } catch (error) {
                console.error("Failed to load catalogue parts:", error);
                toast({ variant: "destructive", title: "Error", description: "Could not load parts." });
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);
    
    const handleSignOut = async () => {
        await signOut(auth);
        router.push('/login');
    };


    const handleOpenForm = (part: CataloguePart | null = null) => {
        setEditingPart(part);
        form.reset(part ? { name: part.name, cost: part.cost } : { name: '', cost: 0 });
        setIsFormOpen(true);
    };
    
    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingPart(null);
        form.reset();
    }
    
    const onSubmit = async (data: PartFormValues) => {
        try {
            await saveCataloguePart(data, editingPart?.name);
            toast({
                title: "Part Saved",
                description: `"${data.name}" has been saved to the catalogue.`
            });
            handleCloseForm();
            window.location.reload();
        } catch (error) {
             toast({ variant: "destructive", title: "Save Failed", description: "Could not save the part." });
        }
    };
    
    const handleDeletePart = async (partName: string) => {
        try {
            await deleteCataloguePart(partName);
            toast({
                title: "Part Deleted",
                description: `"${partName}" has been removed from the catalogue.`
            });
            window.location.reload();
        } catch (error) {
            toast({ variant: "destructive", title: "Delete Failed", description: "Could not delete the part." });
        }
    }

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
        event.target.select();
    };

    if (authLoading || isLoading || !user) {
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
                                <h1 className="text-3xl font-headline font-bold">Parts Catalogue</h1>
                                <p className="text-muted-foreground">Manage your reusable parts.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button onClick={() => handleOpenForm()}>
                                    <PlusCircle /> Add New Part
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} onInteractOutside={handleCloseForm}>
                            <DialogHeader>
                            <DialogTitle>{editingPart ? 'Edit Part' : 'Add New Part'}</DialogTitle>
                            <DialogDescription>
                                Enter the details for the part.
                            </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Part Name</FormLabel>
                                        <FormControl><Input placeholder="e.g., Spark Plug" {...field} /></FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                    <FormField
                                    control={form.control}
                                    name="cost"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Cost (ex. GST)</FormLabel>
                                        <FormControl><Input type="number" step="any" {...field} onFocus={handleFocus} /></FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={handleCloseForm}>Cancel</Button>
                                        <Button type="submit">Save Part</Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>

                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Part Name</TableHead>
                                    <TableHead className="text-right">Cost (ex. GST)</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {parts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24">No parts found.</TableCell>
                                    </TableRow>
                                ) : (
                                    parts.map(part => (
                                        <TableRow key={part.name}>
                                            <TableCell className="font-medium">{part.name}</TableCell>
                                            <TableCell className="text-right">${part.cost.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <AlertDialog>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleOpenForm(part)}>
                                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                                            </DropdownMenuItem>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete "{part.name}" from the catalogue. This cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeletePart(part.name)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </main>
            </div>
        </SidebarProvider>
    )
}
