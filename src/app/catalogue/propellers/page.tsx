
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getCataloguePropellers, saveCataloguePropeller, deleteCataloguePropeller, getStaticLogo, getUserProfile } from '@/lib/storage';
import type { Propeller, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, PlusCircle, MoreVertical, Edit, Copy, Trash2, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getAuth, signOut } from 'firebase/auth';
import { UserProfileDialog } from '@/components/UserProfileDialog';

function PropellersCataloguePageContent() {
    const [propellers, setPropellers] = useState<Propeller[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const fetchedProps = await getCataloguePropellers();
            setPropellers(fetchedProps);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load propellers.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleAddNew = async () => {
        try {
            const newProp: Partial<Propeller> = { 
                name: `New Propeller ${propellers.length + 1}`, 
                basePrice: 0,
                sellPrice: 0,
                gpPercentage: 0
            };
            const savedProp = await saveCataloguePropeller(newProp);
            toast({ title: 'New Propeller Created' });
            router.push(`/catalogue/propellers/${savedProp.id}/edit`);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Creation Failed', description: String(error) });
        }
    };
    
    const handleDuplicate = async (propToDuplicate: Propeller) => {
        const { id, ...propData } = propToDuplicate;
        const duplicatedProp = {
            ...propData,
            name: `${propData.name} (Copy)`,
        };
        try {
            await saveCataloguePropeller(duplicatedProp);
            toast({ title: 'Propeller Duplicated' });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Duplicate Failed', description: String(error) });
        }
    };

    const handleDelete = async (propId: string) => {
        try {
            await deleteCataloguePropeller(propId);
            toast({ title: 'Propeller Deleted' });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: String(error) });
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
    }

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
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-headline font-bold">Propellers Catalogue</h1>
                        <p className="text-muted-foreground">Manage propeller models and prices.</p>
                    </div>
                    <Button onClick={handleAddNew}><PlusCircle /> Add Propeller</Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-20">Image</TableHead>
                                    <TableHead>Propeller Name</TableHead>
                                    <TableHead>NSM Code</TableHead>
                                    <TableHead>Factory Code</TableHead>
                                    <TableHead className="text-right">Base Price</TableHead>
                                    <TableHead className="text-right">Sell Price</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {propellers.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center h-24">No propellers found.</TableCell></TableRow>
                                ) : (
                                    propellers.map(prop => (
                                        <TableRow key={prop.id}>
                                             <TableCell>
                                                {prop.imageUrl ? <img src={prop.imageUrl} alt={prop.name} className="h-12 w-12 object-contain" /> : <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center"><ImageIcon className="text-muted-foreground"/></div>}
                                            </TableCell>
                                            <TableCell className="font-medium">{prop.name}</TableCell>
                                            <TableCell>{prop.nsmCode || '-'}</TableCell>
                                            <TableCell>{prop.factoryCode || '-'}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(prop.basePrice)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(prop.sellPrice)}</TableCell>
                                            <TableCell>
                                                <AlertDialog>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon"><MoreVertical /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/catalogue/propellers/${prop.id}/edit`}><Edit className="mr-2" />Edit</Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleDuplicate(prop)}><Copy className="mr-2" />Duplicate</DropdownMenuItem>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem className="text-destructive" onSelect={e => e.preventDefault()}><Trash2 className="mr-2" />Delete</DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>This will permanently delete the propeller "{prop.name}".</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(prop.id!)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

export default function PropellersCataloguePage() {
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
            <PropellersCataloguePageContent />
        </SidebarProvider>
    );
}
