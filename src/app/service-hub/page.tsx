
"use client";

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, BrainCircuit, Ship, ArrowRight, Settings, Wrench, CalendarPlus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { getAuth, signOut } from 'firebase/auth';
import { getUserProfile, getStaticLogo } from '@/lib/storage';
import type { UserProfile } from '@/lib/types';


function ServiceHubPageContent() {
    return (
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8 space-y-4">
                <h1 className="text-3xl font-headline font-bold">Service Hub</h1>
                <p className="text-muted-foreground">
                    This is the central hub for all service-related activities.
                </p>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <Link href="/service-hub/estimates" className="block">
                    <Card className="hover:shadow-lg hover:border-primary transition-all h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                                <Wrench /> Service Estimates
                            </CardTitle>
                            <CardDescription>
                                Create and manage repair and service estimates.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline">
                                Manage Estimates <ArrowRight className="ml-2"/>
                            </Button>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/service-hub/bookings" className="block">
                    <Card className="hover:shadow-lg hover:border-primary transition-all h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                                <CalendarPlus /> Booking Applications
                            </CardTitle>
                            <CardDescription>
                                View and manage incoming booking requests from customers.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline">
                                View Bookings <ArrowRight className="ml-2"/>
                            </Button>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/service-hub/yamaha-diagnostics" className="block">
                    <Card className="hover:shadow-lg hover:border-primary transition-all h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                                <BrainCircuit /> Yamaha Diagnostics
                            </CardTitle>
                            <CardDescription>
                                Analyze Yamaha engine diagnostic reports using AI.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline">
                                Go to Diagnostics <ArrowRight className="ml-2"/>
                            </Button>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </main>
    );
}

export default function ServiceHubPage() {
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
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Skeleton className="h-48 w-full" />
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
                        <Link href="/"><ArrowLeft /> Back to Home</Link>
                    </Button>
                </Header>
                <ServiceHubPageContent />
            </div>
        </SidebarProvider>
    );
}
