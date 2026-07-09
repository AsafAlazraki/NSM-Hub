
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getBookingApplication } from "@/lib/booking-application-storage";
import { getStaticLogo, getUserProfile } from "@/lib/storage";
import type { BookingApplication, UserProfile } from "@/lib/types";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookingForm } from "@/components/booking/BookingForm";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { getAuth, signOut } from "firebase/auth";

function EditBookingApplicationPageContent() {
    const params = useParams();
    const id = params.id as string;
    const { user } = useAuth();
    const [application, setApplication] = useState<BookingApplication | null | undefined>(undefined);
    const [logo, setLogo] = useState<string | null>(null);

    useEffect(() => {
        const fetchApplication = async () => {
            if (user && id) {
                const [fetchedApplication, fetchedLogo] = await Promise.all([
                    getBookingApplication(id),
                    getStaticLogo(),
                ]);
                setApplication(fetchedApplication);
                setLogo(fetchedLogo);
            }
        };
        fetchApplication();
    }, [id, user]);

    if (application === undefined) {
        return (
            <div className="flex flex-col h-full">
                <Header>
                    <Button variant="ghost" asChild>
                        <Link href={`/booking-application/${id}`}>Cancel</Link>
                    </Button>
                </Header>
                <main className="flex-1 container mx-auto max-w-4xl py-8 px-4">
                    <div className="space-y-8">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-[600px] w-full" />
                    </div>
                </main>
            </div>
        );
    }

    if (!application) {
        return (
            <div className="flex flex-col h-full">
                <Header>
                    <Button variant="outline" asChild>
                        <Link href="/service-hub/bookings"><ArrowLeft/>Back to Applications</Link>
                    </Button>
                </Header>
                <main className="flex-1 flex items-center justify-center text-center p-4">
                    <div>
                        <h1 className="text-2xl font-bold">Application Not Found</h1>
                        <p className="text-muted-foreground">The booking application you are trying to edit does not exist.</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <Header>
                <Button variant="ghost" asChild>
                    <Link href={`/booking-application/${application.id}`}>Cancel</Link>
                </Button>
            </Header>
            <main className="flex-1 overflow-y-auto py-8">
                <div className="container mx-auto max-w-4xl sm:px-4">
                    <BookingForm formId={application.id!} logo={logo} initialData={application} />
                </div>
            </main>
        </div>
    );
}

export default function EditBookingApplicationPage() {
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
            <EditBookingApplicationPageContent />
        </SidebarProvider>
    );
}
