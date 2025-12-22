
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Header } from '@/components/Header';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { getUserProfile, getStaticLogo } from '@/lib/storage';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogoUploader } from '@/components/LogoUploader';

export default function DealerManagementPage() {
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
        <div className="flex h-screen items-center justify-center">
            <Skeleton className="h-screen w-full" />
        </div>
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
                <h1 className="text-xl font-semibold">Dealer Management</h1>
             </Header>
             <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Company Logo</CardTitle>
                        <CardDescription>Upload your company logo here. This will be displayed on all quotes and reports.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LogoUploader />
                    </CardContent>
                </Card>
             </main>
        </div>
    </SidebarProvider>
  );
}
