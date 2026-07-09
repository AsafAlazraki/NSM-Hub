
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getStaticLogo, getUserProfile } from "@/lib/storage";
import type { UserProfile } from "@/lib/types";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { QuoteCreationForm } from "@/components/form/QuoteCreationForm";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getAuth, signOut } from "firebase/auth";
import { UserProfileDialog } from "@/components/UserProfileDialog";

function NewQuotePageContent() {
    return (
        <div className="flex flex-col h-full">
            <Header>
                <Button variant="ghost" asChild>
                    <Link href="/service-hub/estimates">Cancel</Link>
                </Button>
            </Header>
            <main className="flex-1">
                <QuoteCreationForm />
            </main>
        </div>
    );
}

export default function NewQuotePage() {
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
            <NewQuotePageContent />
        </SidebarProvider>
    );
}
