
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getCatalogueTrailers, saveCatalogueTrailer, deleteCatalogueTrailer, getStaticLogo, getUserProfile } from '@/lib/storage';
import type { CatalogueTrailer, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, PlusCircle, MoreVertical, Edit, Copy, ImageIcon, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getAuth, signOut } from 'firebase/auth';
import { UserProfileDialog } from '@/components/UserProfileDialog';

function TrailersCataloguePageContent() {
    const [trailers, setTrailers] = useState<CatalogueTrailer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const fetchedTrailers = await getCatalogueTrailers();
            setTrailers(fetchedTrailers);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load trailers.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleAddNewTrailer = async () => {
        try {
            const newTrailer: Partial<CatalogueTrailer> = { name: `New Trailer ${trailers.length + 1}`, price: 0 };
            const savedTrailer = await saveCatalogueTrailer(newTrailer);
            toast({ title: 'New Trailer Created', description: 'A new trailer has been created.' });
            router.push(`/catalogue/trailers/${savedTrailer.id}/edit`);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Creation Failed', description: String(error) });
        }
    };
    
    const handleDuplicate = async (trailerToDuplicate: CatalogueTrailer) => {
        const { id, ...trailerData } = trailerToDuplicate;
        const duplicatedTrailer: Partial<CatalogueTrailer> = {
            ...trailerData,
            name: `${trailerData.name} (Copy)`,
        };
        try {
            await saveCatalogueTrailer(duplicatedTrailer);
            toast({ title: 'Trailer Duplicated', description: `A copy of "${trailerData.name}" has been created.` });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Duplicate Failed', description: String(error) });
        }
    };

    const handleDeleteTrailer = async (trailerId: string) => {
        try {
            await deleteCatalogueTrailer(trailerId);
            toast({ title: 'Trailer Deleted', description: 'The trailer has been deleted.' });
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
                        <h1 className="text-3xl font-headline font-bold">Trailers Catalogue</h1>
                        <p className="text-muted-foreground">Manage trailer models and prices.</p>
                    </div>
                    <Button onClick={handleAddNewTrailer}><PlusCircle /> Add Trailer</Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-20">Image</TableHead>
                                    <TableHead>Trailer Name</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {trailers.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center h-24">No trailers found.</TableCell></TableRow>
                                ) : (
                                    trailers.map(trailer => (
                                        <TableRow key={trailer.id}>
                                            <TableCell>
                                                {trailer.imageUrl ? <img src={trailer.imageUrl} alt={trailer.name} className="h-12 w-12 object-contain" /> : <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center"><ImageIcon className="text-muted-foreground"/></div>}
                                            </TableCell>
                                            <TableCell className="font-medium">{trailer.name}</TableCell>
                                            <TableCell>{formatCurrency(trailer.price)}</TableCell>
                                            <TableCell>
                                                <AlertDialog>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon"><MoreVertical /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/catalogue/trailers/${trailer.id}/edit`}><Edit className="mr-2" />Edit</Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleDuplicate(trailer)}><Copy className="mr-2" />Duplicate</DropdownMenuItem>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem className="text-destructive" onSelect={e => e.preventDefault()}><Trash2 className="mr-2" />Delete</DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>This will permanently delete the trailer "{trailer.name}".</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteTrailer(trailer.id!)}>Delete</AlertDialogAction>
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

export default function TrailersCataloguePage() {
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
            <TrailersCataloguePageContent />
        </SidebarProvider>
    );
}
