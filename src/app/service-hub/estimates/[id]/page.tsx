
"use client";

import { Header } from "@/components/Header";
import { QuoteView } from "@/components/QuoteView";
import { getQuoteById, getStaticLogo, getUserProfile } from "@/lib/storage";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { Quote, UserProfile } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, useParams } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { getAuth, signOut } from "firebase/auth";

function QuoteDetailPageContent() {
  const params = useParams();
  const id = params.id as string;
  const [quote, setQuote] = useState<Quote | null | undefined>(undefined);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchQuote = async () => {
        if (user && id) {
            const foundQuote = await getQuoteById(id);
            setQuote(foundQuote);
        }
    }
    fetchQuote();
  }, [id, user]);

  if (quote === undefined || authLoading || !user) {
      return (
        <div className="flex flex-col h-full">
            <Header>
                <Button variant="outline" asChild>
                    <Link href="/service-hub/estimates"><ArrowLeft/>Back to Estimates</Link>
                </Button>
            </Header>
            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto max-w-5xl py-8 px-4">
                    <div className="w-full space-y-8">
                            <Skeleton className="h-12 w-1/4" />
                            <Skeleton className="h-48 w-full" />
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-64 w-full" />
                    </div>
                </div>
            </main>
      </div>
      );
  }

  if (!quote) {
    return (
      <div className="flex flex-col h-full">
        <Header>
          <Button variant="ghost" asChild>
              <Link href="/service-hub/estimates">Back to Estimates</Link>
          </Button>
        </Header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Quote not found</h1>
            <p className="text-muted-foreground">The quote you are looking for does not exist.</p>
            <Button asChild className="mt-4">
              <Link href="/service-hub/estimates">Go to Estimates</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const isEditable = !['Complete', 'Cancelled', 'Deleted'].includes(quote.status);

  return (
    <div className="flex flex-col h-full">
       <Header>
          <Button variant="outline" asChild>
              <Link href="/service-hub/estimates"><ArrowLeft/>Back to Estimates</Link>
          </Button>
          {isEditable && (
            <Button asChild>
                <Link href={`/service-hub/estimates/${quote.id}/edit`}><Edit/>Edit Quote</Link>
            </Button>
          )}
      </Header>
      <main className="flex-1 overflow-y-auto">
        <QuoteView quote={quote} />
      </main>
    </div>
  );
}


export default function QuoteDetailPage() {
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
            <QuoteDetailPageContent />
        </SidebarProvider>
    );
}
