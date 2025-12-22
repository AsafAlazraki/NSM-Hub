
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Quote } from '@/lib/types';
import { FileText, Ship, ArrowRight, LayoutDashboard, Users, BookOpenCheck, Package, ClipboardCheck, Home, Activity, CalendarPlus, ShoppingCart, Server, DollarSign, Wrench, Building } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getStaticLogo, getUserProfile } from '@/lib/storage';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';
import { Sidebar, SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardAnalytics } from '@/components/dashboard/DashboardAnalytics';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import type { UserProfile } from '@/lib/types';

const HomePageContent = () => {
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    
    useEffect(() => {
        if(user) {
            setIsLoading(false);
        }
    }, [user]);

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        )
    }

    return (
         <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <Link href="/sales-hub" className="block">
                    <Card className="hover:shadow-lg hover:border-primary transition-all h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                                <DollarSign /> Sales Hub
                            </CardTitle>
                            <CardDescription>
                                Central hub for sales quotes, customer management, and CPQ.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline">
                                Go to Sales Hub <ArrowRight className="ml-2"/>
                            </Button>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/service-hub" className="block">
                    <Card className="hover:shadow-lg hover:border-primary transition-all h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                                <Wrench /> Service Hub
                            </CardTitle>
                            <CardDescription>
                                Create estimates, manage bookings, and run diagnostics.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline">
                                Go to Service Hub <ArrowRight className="ml-2"/>
                            </Button>
                        </CardContent>
                    </Card>
                </Link>
                 <Link href="/dealership-management" className="block">
                    <Card className="hover:shadow-lg hover:border-primary transition-all h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                                <Building /> Dealership Management
                            </CardTitle>
                            <CardDescription>
                                Manage dealership-wide settings and configurations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline">
                                Manage Dealership <ArrowRight className="ml-2"/>
                            </Button>
                        </CardContent>
                    </Card>
                </Link>
                <Card className="bg-muted/50 text-muted-foreground opacity-50 cursor-not-allowed h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                            <BookOpenCheck /> Data Modules
                        </CardTitle>
                        <CardDescription>
                            Manage reusable data like service operations, parts, and boat models.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" disabled>
                            Manage Data <ArrowRight className="ml-2"/>
                        </Button>
                    </CardContent>
                </Card>
                 <Card className="bg-muted/50 text-muted-foreground opacity-50 cursor-not-allowed h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                            <Server /> Admin Config
                        </CardTitle>
                        <CardDescription>
                            Manage backend services, authentication, and database rules.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" disabled>
                            Manage Config <ArrowRight className="ml-2"/>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}


export default function HomePage() {
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
    if(typeof window !== 'undefined') {
        sessionStorage.removeItem('quoteSearchTerm');
        sessionStorage.removeItem('quoteStatusFilter');
        sessionStorage.removeItem('quoteOpenClosedFilter');
        sessionStorage.removeItem('quoteUserFilter');
        sessionStorage.removeItem('quoteUserFilterDefaultSet');
        sessionStorage.removeItem('quoteTypeFilter');
    }
    router.push('/login');
  };

  if (authLoading || !user) {
    return (
        <SidebarProvider>
            <div className="flex h-screen items-center justify-center">
                <Skeleton className="h-screen w-full" />
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
                <h1 className="text-xl font-semibold">Home</h1>
             </Header>
             <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <HomePageContent />
             </main>
        </div>
    </SidebarProvider>
  );
}
