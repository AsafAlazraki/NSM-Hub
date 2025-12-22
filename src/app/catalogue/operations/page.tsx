

"use client";

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { CatalogueOperation, Operation, UserProfile } from '@/lib/types';
import { getCatalogueOperations, saveCatalogueOperation, deleteCatalogueOperation, getUserProfile, getStaticLogo } from '@/lib/storage';
import { PlusCircle, MoreVertical, Edit, Trash2, ArrowLeft, Package, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { OperationForm } from '@/components/form/OperationForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { getAuth, signOut } from 'firebase/auth';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
}

export default function OperationsCataloguePage() {
    const [operations, setOperations] = useState<CatalogueOperation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const auth = getAuth();
    const { toast } = useToast();
    const [editingOperation, setEditingOperation] = useState<Partial<Operation> | null | undefined>(undefined);
    const [operationToDelete, setOperationToDelete] = useState<string | null>(null);

    const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
    const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
    const [logo, setLogo] = useState<string | null>(null);


    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const fetchData = async () => {
        if (user) {
            setIsLoading(true);
            try {
                const fetchedOps = await getCatalogueOperations();
                setOperations(fetchedOps);
            } catch (error) {
                console.error("Failed to load catalogue operations:", error);
                toast({ variant: "destructive", title: "Error", description: "Could not load operations." });
            } finally {
                setIsLoading(false);
            }
        }
    };
    
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
        fetchData();
    }, [user]);

    const handleSignOut = async () => {
        await signOut(auth);
        router.push('/login');
    };

    const handleSaveOperation = async (opData: Operation) => {
        try {
            await saveCatalogueOperation(opData);
            toast({
                title: "Operation Saved",
                description: `"${opData.heading}" has been saved to the catalogue.`
            });
            setEditingOperation(undefined); // Hide form
            fetchData(); // Refresh list
        } catch (error) {
            toast({ variant: "destructive", title: "Save Failed", description: "Could not save the operation." });
        }
    };
    
    const handleDeleteOperation = async (opHeading: string) => {
        try {
            await deleteCatalogueOperation(opHeading);
             toast({
                title: "Operation Deleted",
                description: `"${opHeading}" has been removed from the catalogue.`
            });
            window.location.reload();
        } catch (error) {
            toast({ variant: "destructive", title: "Delete Failed", description: "Could not delete the operation." });
        }
    }
    
    const handleAddNewClick = () => {
        setEditingOperation(null); // null means new
    }
    
    const handleEditClick = (op: CatalogueOperation) => {
        // We need to convert CatalogueOperation to Operation format for the form
        const operationToEdit: Operation = {
            ...op,
            id: op.heading, // use heading as id for form purposes
            parts: (op.parts || []).map(p => ({...p, id: `part-${Math.random()}`}))
        };
        setEditingOperation(operationToEdit);
    }
    
    const handleCancelForm = () => {
        setEditingOperation(undefined); // undefined means hide
    }

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
                                <h1 className="text-3xl font-headline font-bold">Operations Catalogue</h1>
                                <p className="text-muted-foreground">Manage your reusable service operations.</p>
                            </div>
                            <Button onClick={handleAddNewClick} disabled={editingOperation !== undefined}>
                                <PlusCircle /> Add New Operation
                            </Button>
                        </div>
                    </div>

                    {editingOperation !== undefined && (
                        <div className="mb-8">
                            <OperationForm
                                key={editingOperation?.id || 'new-op'}
                                initialData={editingOperation}
                                onSave={handleSaveOperation}
                                onCancel={handleCancelForm}
                            />
                        </div>
                    )}

                    {operations.length === 0 ? (
                        <div className="text-center py-16">
                            <h2 className="text-2xl font-semibold">No operations found</h2>
                            <p className="text-muted-foreground mt-2">
                            Click "Add New Operation" to build your catalogue.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {operations.map(op => {
                                const partsCount = (op.parts || []).length;
                                const partsCost = (op.parts || []).reduce((sum, part) => sum + (part.cost || 0) * (part.quantity || 1), 0);
                                const laborCost = (op.laborHours || 0) * (op.laborRate || 0);

                                return (
                                <Card key={op.heading} className="flex flex-col">
                                    <CardHeader className="flex flex-row items-start justify-between">
                                        <CardTitle className="text-lg leading-tight">{op.heading}</CardTitle>
                                        <AlertDialog>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={editingOperation !== undefined}>
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEditClick(op)}>
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
                                                        This will permanently delete "{op.heading}" from the catalogue. This cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteOperation(op.heading)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </CardHeader>
                                    <CardContent className="flex-1 space-y-3 text-sm">
                                        <div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Package className="w-4 h-4" />
                                                <span>{partsCount} part{partsCount !== 1 ? 's' : ''}</span>
                                            </div>
                                            <div className="flex justify-between items-center pl-6">
                                                <span>Total Parts Cost:</span>
                                                <span className="font-medium">{formatCurrency(partsCost)}</span>
                                            </div>
                                        </div>
                                        <Separator />
                                        <div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Clock className="w-4 h-4" />
                                                <span>Labor</span>
                                            </div>
                                            <div className="flex justify-between items-center pl-6">
                                                <span>{op.laborHours || 0} hrs @ {formatCurrency(op.laborRate || 0)}/hr</span>
                                                <span className="font-medium">{formatCurrency(laborCost)}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )})}
                        </div>
                    )}
                </main>
            </div>
        </SidebarProvider>
    )
}
