
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getQuoteById, createNewVersion, getUserProfile, getStaticLogo } from "@/lib/storage";
import type { Quote, UserProfile } from "@/lib/types";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { QuoteCreationForm } from "@/components/form/QuoteCreationForm";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { getAuth, signOut } from "firebase/auth";


function EditQuotePageContent() {
    const params = useParams();
    const id = params.id as string;
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [quote, setQuote] = useState<Quote | null | undefined>(undefined);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const versioningStarted = useRef(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const handleVersioning = async () => {
            if (user && id && !versioningStarted.current) {
                versioningStarted.current = true; // Prevent this from running again
                try {
                    // This logic handles creating a new version from an existing quote.
                    const originalQuote = await getQuoteById(id);
                    if (!originalQuote) throw new Error("Original quote not found.");

                    // If it's already a version being edited, just load it.
                    // The check for `-v` handles this.
                    if (originalQuote.id.includes('-v')) {
                        setQuote(originalQuote);
                        setIsLoading(false);
                        return;
                    }
                    
                    const newVersionId = await createNewVersion(originalQuote);
                    toast({
                        title: "New Version Created",
                        description: `Editing a new version for quote ${originalQuote.id.split('-v')[0]}.`,
                    });
                    // Replace the URL to edit the new version
                    router.replace(`/quote/${newVersionId}/edit`, { scroll: false });

                } catch (error: any) {
                    toast({
                        variant: "destructive",
                        title: "Versioning Failed",
                        description: error.message || "Could not create a new version.",
                    });
                    router.push(`/quote/${id}`);
                }
            }
        };

        handleVersioning();

    }, [id, user, router, toast]);

    // This effect fetches the quote data directly if the ID already points to a version.
    // This is needed for when the page reloads after being redirected to the new version's URL.
    useEffect(() => {
        const fetchVersionedQuote = async () => {
            if (user && id && id.includes('-v')) {
                setIsLoading(true);
                const quoteData = await getQuoteById(id);
                setQuote(quoteData);
                setIsLoading(false);
            }
        };
        fetchVersionedQuote();
    }, [id, user]);


    if (isLoading || quote === undefined || authLoading || !user) {
        return (
             <div className="flex flex-col h-full">
                <Header>
                    <Button variant="ghost" asChild>
                        <Link href={id ? `/quote/${id.split('-v')[0]}` : '/insurance-quotes/dashboard'}>Cancel</Link>
                    </Button>
                </Header>
                <main className="flex-1 container mx-auto max-w-5xl py-8 px-4">
                    <div className="space-y-8">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-[600px] w-full" />
                    </div>
                </main>
            </div>
        );
    }

    if (!quote) {
        return (
             <div className="flex flex-col h-full">
                <Header>
                    <Button variant="outline" asChild>
                        <Link href="/insurance-quotes/dashboard"><ArrowLeft/>Back to Dashboard</Link>
                    </Button>
                </Header>
                <main className="flex-1 flex items-center justify-center text-center p-4">
                  <div>
                    <h1 className="text-2xl font-bold">Quote Not Found</h1>
                    <p className="text-muted-foreground">The quote you are trying to edit does not exist.</p>
                  </div>
                </main>
            </div>
        );
    }
    

    return (
        <div className="flex flex-col h-full">
            <Header>
                <Button variant="ghost" asChild>
                    <Link href={`/quote/${id.split('-v')[0]}`}>Cancel</Link>
                </Button>
            </Header>
            <main className="flex-1">
                <QuoteCreationForm initialData={quote} isEditMode={true} />
            </main>
        </div>
    );
}

export default function EditQuotePage() {
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
            <EditQuotePageContent />
        </SidebarProvider>
    )
}
