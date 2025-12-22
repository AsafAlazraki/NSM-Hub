
"use client";

import { Header } from "@/components/Header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ReportCreationForm } from "@/components/yamaha-diagnostics/ReportCreationForm";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { getAuth, signOut } from "firebase/auth";
import { getUserProfile, getStaticLogo } from "@/lib/storage";
import type { UserProfile } from "@/lib/types";

function NewDiagnosticReportPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-col h-full">
        <Header>
            <Button variant="ghost" asChild>
                <Link href="/yamaha-diagnostics">Cancel</Link>
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

  return (
    <div className="flex flex-col h-full">
      <Header>
          <Button variant="ghost" asChild>
              <Link href="/yamaha-diagnostics">Cancel</Link>
          </Button>
      </Header>
      <main className="flex-1">
        <ReportCreationForm />
      </main>
    </div>
  );
}


export default function NewDiagnosticReportPage() {
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
            <NewDiagnosticReportPageContent />
        </SidebarProvider>
    );
}
