
"use client";

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Wrench, Package, Ship, Settings, Cog, Fan, GitMerge, Truck, CheckSquare } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { getAuth, signOut } from 'firebase/auth';
import { getUserProfile, getStaticLogo } from '@/lib/storage';
import type { UserProfile } from '@/lib/types';


function CatalogueHubPageContent() {
    return (
        <div className="flex flex-col h-screen">
            <Header>
                <Button asChild variant="outline">
                    <Link href="/">Back to Dashboard</Link>
                </Button>
            </Header>
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-8 space-y-4">
                    <h1 className="text-3xl font-headline font-bold">Data Modules</h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Here you can manage your reusable service operations, parts, and boat models. Building a comprehensive catalogue will speed up the process of creating new quotes and configurations.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link href="/catalogue/operations" className="block">
                        <Card className="hover:shadow-lg hover:border-primary transition-all h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                                    <Wrench /> Operations
                                </CardTitle>
                                <CardDescription>
                                    Manage predefined service operations, including labor and required parts.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline">
                                    Manage Operations <ArrowRight className="ml-2"/>
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/catalogue/parts" className="block">
                        <Card className="hover:shadow-lg hover:border-primary transition-all h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                                    <Package /> Parts
                                </CardTitle>
                                <CardDescription>
                                    Manage your library of individual parts and their costs.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline">
                                    Manage Parts <ArrowRight className="ml-2"/>
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/catalogue/boats" className="block">
                        <Card className="hover:shadow-lg hover:border-primary transition-all h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                                    <Ship /> Boats
                                </CardTitle>
                                <CardDescription>
                                    Manage boat brands, ranges, and models for quotes and CPQ.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline">
                                    Manage Boats <ArrowRight className="ml-2"/>
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/catalogue/motors" className="block">
                        <Card className="hover:shadow-lg hover:border-primary transition-all h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                                    <Cog /> Motors
                                </CardTitle>
                                <CardDescription>
                                    Manage motors and their compatible propeller options.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline">
                                    Manage Motors <ArrowRight className="ml-2"/>
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/catalogue/propellers" className="block">
                        <Card className="hover:shadow-lg hover:border-primary transition-all h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                                    <Fan /> Propellers
                                </CardTitle>
                                <CardDescription>
                                    Manage propeller models and prices.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline">
                                    Manage Propellers <ArrowRight className="ml-2"/>
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/catalogue/rigging-kits" className="block">
                        <Card className="hover:shadow-lg hover:border-primary transition-all h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                                    <GitMerge /> Rigging Kits
                                </CardTitle>
                                <CardDescription>
                                    Manage rigging kits with control and gauge options.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline">
                                    Manage Rigging <ArrowRight className="ml-2"/>
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/catalogue/trailers" className="block">
                        <Card className="hover:shadow-lg hover:border-primary transition-all h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                                    <Truck /> Trailers
                                </CardTitle>
                                <CardDescription>
                                    Manage trailer models and prices.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline">
                                    Manage Trailers <ArrowRight className="ml-2"/>
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/catalogue/factory-options" className="block">
                        <Card className="hover:shadow-lg hover:border-primary transition-all h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                                    <Settings /> Factory Options
                                </CardTitle>
                                <CardDescription>
                                    Manage factory-fit options and prices.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline">
                                    Manage Options <ArrowRight className="ml-2"/>
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/catalogue/dealer-fit-options" className="block">
                        <Card className="hover:shadow-lg hover:border-primary transition-all h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                                    <CheckSquare /> Dealer Fit Options
                                </CardTitle>
                                <CardDescription>
                                    Manage parts and services fitted by the dealer.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline">
                                    Manage Dealer Options <ArrowRight className="ml-2"/>
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </main>
        </div>
    )
}


export default function CatalogueHubPage() {
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


    if (authLoading || !user || !currentUserProfile) {
        return (
             <SidebarProvider>
                <div className="flex flex-col h-screen">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        <Skeleton className="h-12 w-1/3 mb-8" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <UserProfileDialog 
            isOpen={isProfileDialogOpen}
            setIsOpen={setIsProfileDialogOpen}
            userProfile={currentUserProfile}
            onSave={() => {}}
            />
            <CatalogueHubPageContent />
        </SidebarProvider>
    )
}
