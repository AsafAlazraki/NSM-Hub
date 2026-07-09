"use client";

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { getAllUsers, getStaticLogo, getUserProfile } from '@/lib/storage';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { StaffCard } from '@/components/staff/StaffCard';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { getAuth, signOut } from 'firebase/auth';

function StaffPageContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            getAllUsers()
                .then(setUsers)
                .catch(err => console.error("Failed to fetch users", err))
                .finally(() => setIsLoading(false));
        }
    }, [user]);

    if (authLoading || !user) {
         return (
             <div className="flex flex-col h-screen">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            <Header>
                 <Button asChild variant="outline">
                    <Link href="/">Back to Dashboard</Link>
                </Button>
            </Header>
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                 <div className="mb-8 space-y-4">
                     <div className="flex justify-between items-center">
                        <div>
                             <h1 className="text-3xl font-headline font-bold">Staff Members</h1>
                             <p className="text-muted-foreground">Manage all staff members in the system.</p>
                        </div>
                     </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: users.length || 4 }).map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
                    </div>
                ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {users.map(staffUser => (
                            <StaffCard key={staffUser.uid} user={staffUser} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default function StaffPage() {
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
                <div className="flex flex-col h-screen">
                    <Header />
                    <main className="flex-1 p-8"><Skeleton className="h-full w-full" /></main>
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
            <StaffPageContent />
        </SidebarProvider>
    );
}
