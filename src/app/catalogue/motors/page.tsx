

"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { getCatalogueMotors, saveCatalogueMotor, deleteCatalogueMotor, getStaticLogo, getUserProfile } from '@/lib/storage';
import type { CatalogueMotor, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, PlusCircle, MoreVertical, Edit, Copy, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getAuth, signOut } from 'firebase/auth';
import { UserProfileDialog } from '@/components/UserProfileDialog';

const motorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Motor name is required.'),
});

type MotorFormValues = z.infer<typeof motorSchema>;

function MotorsCataloguePageContent() {
    const [motors, setMotors] = useState<CatalogueMotor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const fetchedMotors = await getCatalogueMotors();
            setMotors(fetchedMotors);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load motors.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleAddNewMotor = async () => {
        try {
            const newMotor = { name: `New Motor ${motors.length + 1}`, basePrice: 0, sellPrice: 0, gpPercentage: 0 };
            const savedMotor = await saveCatalogueMotor(newMotor);
            toast({ title: 'New Motor Created', description: `"${savedMotor.name}" has been added.` });
            router.push(`/catalogue/motors/${savedMotor.id}/edit`);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Creation Failed', description: String(error) });
        }
    };

    const handleDuplicate = async (motorToDuplicate: CatalogueMotor) => {
        const { id, ...motorData } = motorToDuplicate;
        const duplicatedMotor = {
            ...motorData,
            name: `${motorData.name} (Copy)`,
            compatiblePropellerIds: motorData.compatiblePropellerIds || [],
        };
        try {
            const savedMotor = await saveCatalogueMotor(duplicatedMotor);
            toast({ title: 'Motor Duplicated', description: `A copy of "${motorData.name}" has been created.` });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Duplicate Failed', description: String(error) });
        }
    };

    const handleDeleteMotor = async (motorId: string) => {
        try {
            await deleteCatalogueMotor(motorId);
            toast({ title: 'Motor Deleted', description: 'The motor has been deleted.' });
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
                        <h1 className="text-3xl font-headline font-bold">Motors Catalogue</h1>
                        <p className="text-muted-foreground">Manage motors and their compatible propeller options.</p>
                    </div>
                    <Button onClick={handleAddNewMotor}><PlusCircle /> Add Motor</Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-20">Image</TableHead>
                                    <TableHead>Motor Name</TableHead>
                                    <TableHead>Base Price</TableHead>
                                    <TableHead>Sell Price</TableHead>
                                    <TableHead>Compatible Props</TableHead>
                                    <TableHead>Pre-Delivery</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {motors.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center h-24">No motors found.</TableCell></TableRow>
                                ) : (
                                    motors.map(motor => (
                                        <TableRow key={motor.id}>
                                            <TableCell>
                                                {motor.imageUrl ? <img src={motor.imageUrl} alt={motor.name} className="h-12 w-12 object-contain" /> : <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center"><ImageIcon className="text-muted-foreground"/></div>}
                                            </TableCell>
                                            <TableCell className="font-medium">{motor.name}</TableCell>
                                            <TableCell>{formatCurrency(motor.basePrice)}</TableCell>
                                            <TableCell>{formatCurrency(motor.sellPrice)}</TableCell>
                                            <TableCell>{motor.compatiblePropellerIds?.length || 0}</TableCell>
                                            <TableCell>{motor.includesPreDelivery ? 'Yes' : 'No'}</TableCell>
                                            <TableCell>
                                                <AlertDialog>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon"><MoreVertical /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                             <DropdownMenuItem asChild>
                                                                <Link href={`/catalogue/motors/${motor.id}/edit`}><Edit className="mr-2" />Edit</Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleDuplicate(motor)}><Copy className="mr-2" />Duplicate</DropdownMenuItem>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem className="text-destructive" onSelect={e => e.preventDefault()}><Trash2 className="mr-2" />Delete</DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>This will permanently delete the motor "{motor.name}".</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteMotor(motor.id!)}>Delete</AlertDialogAction>
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

export default function MotorsCataloguePage() {
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
            <MotorsCataloguePageContent />
        </SidebarProvider>
    );
}
