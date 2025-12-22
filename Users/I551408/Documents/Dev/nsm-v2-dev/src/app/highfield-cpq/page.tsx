
"use client";

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, BrainCircuit, Ship, ArrowRight, Settings, Package as PackageIcon } from 'lucide-react';
import { getBoatBrands, getUserProfile, getStaticLogo } from '@/lib/storage';
import type { BoatBrand, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getAuth, signOut } from 'firebase/auth';
import { UserProfileDialog } from '@/components/UserProfileDialog';

function HighfieldCpqPageContent() {
    const [brands, setBrands] = useState<BoatBrand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState<BoatBrand | null>(null);

    useEffect(() => {
        getBoatBrands()
            .then(data => setBrands(data.filter(b => b.name.toLowerCase().includes('highfield'))))
            .finally(() => setIsLoading(false));
    }, []);

    const handleStartConfig = (brand: BoatBrand) => {
        setSelectedBrand(brand);
        setIsDialogOpen(true);
    };

    const handleBmtPackageSelect = () => {
        if (selectedBrand) {
            router.push(`/sales-hub/cpq/configure/${selectedBrand.id}`);
        }
    };

    if (isLoading) {
        return (
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center mb-8">
                    <Skeleton className="h-12 w-1/3" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-36" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </main>
        );
    }
    
    return (
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-headline font-bold">Configure, Price, Quote</h1>
                    <p className="text-muted-foreground">Configure boat packages.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                        <Link href="/catalogue/boats">
                            <Ship className="mr-2 h-4 w-4" />
                            Boat Catalogue
                        </Link>
                    </Button>
                </div>
            </div>

            {selectedBrand && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <div className="mx-auto max-w-[200px] mb-4">
                                <Logo logo={selectedBrand.logo} />
                            </div>
                            <DialogTitle className="text-center font-headline text-2xl">Select Configuration Type</DialogTitle>
                            <DialogDescription className="text-center">
                                Choose the type of package you want to configure for the {selectedBrand.name} range.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <Card className="flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all border-2 border-transparent bg-muted/50 text-muted-foreground opacity-50">
                                <Ship className="h-10 w-10 mb-2" />
                                <p className="font-semibold">Hull Only</p>
                                <p className="text-xs">Disabled</p>
                            </Card>
                            <Card onClick={handleBmtPackageSelect} className="flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 hover:shadow-lg transition-all border-2">
                                <PackageIcon className="h-10 w-10 mb-2 text-primary" />
                                <p className="font-semibold">BMT Package</p>
                            </Card>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {brands.map(brand => (
                    <Card key={brand.id} onClick={() => handleStartConfig(brand)} className="cursor-pointer hover:shadow-lg hover:border-primary transition-all h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-center h-16">
                                {brand.logo ? (
                                    <img src={brand.logo} alt={`${brand.name} logo`} className="h-12 object-contain" />
                                ) : <Ship />}
                            </CardTitle>
                            <CardDescription className="text-center pt-2">
                                Configure a new boat from the {brand.name} range.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full">
                                Start Configuring <ArrowRight className="ml-2"/>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                {brands.length === 0 && (
                    <Card className="col-span-full">
                        <CardContent>
                            <div className="text-center py-16">
                                <h2 className="text-2xl font-semibold">No Highfield Brands Found</h2>
                                <p className="text-muted-foreground mt-2">
                                    Please add a brand with "Highfield" in its name via the Boat Catalogue.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </main>
    );
}


export default function HighfieldCpqPage() {
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
                         <div className="flex justify-between items-center mb-8">
                            <Skeleton className="h-12 w-1/3" />
                            <div className="flex gap-2">
                               <Skeleton className="h-10 w-36" />
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Skeleton className="h-48 w-full" />
                            <Skeleton className="h-48 w-full" />
                        </div>
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
                        <Link href="/sales-hub"><ArrowLeft /> Back to Sales Hub</Link>
                    </Button>
                </Header>
                <HighfieldCpqPageContent />
            </div>
        </SidebarProvider>
    );
}
