

"use client";

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, PlusCircle, Ship, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Kit, UserProfile } from '@/lib/types';
import { getKits, saveKit, archiveKit, restoreKit, getUserProfile, getStaticLogo } from '@/lib/storage';
import { KitKanbanBoard } from '@/components/kits/KitKanbanBoard';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getAuth, signOut } from 'firebase/auth';
import { UserProfileDialog } from '@/components/UserProfileDialog';

export default function KitsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const auth = getAuth();
    const { toast } = useToast();
    const [kits, setKits] = useState<Kit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showArchived, setShowArchived] = useState(false);
    
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

    const fetchData = async () => {
        if (user) {
            setIsLoading(true);
            try {
                const kitsData = await getKits();
                setKits(kitsData);
            } catch (err) {
                console.error("Failed to fetch kit data", err);
            } finally {
                setIsLoading(false);
            }
        }
    }

    useEffect(() => {
        fetchData();
    }, [user]);
    
    const handleSignOut = async () => {
        await signOut(auth);
        router.push('/login');
    };

    const handleKitStatusChange = async (updatedKit: Kit) => {
        try {
            await saveKit(updatedKit);
            setKits(prev => prev.map(k => k.id === updatedKit.id ? updatedKit : k));
            toast({
                title: "Kit Status Updated",
                description: `Kit "${updatedKit.name}" moved to "${updatedKit.status}".`
            })
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update the kit status.'
            });
        }
    }

    const handleArchiveKit = async (kitToArchive: Kit) => {
        try {
            await archiveKit(kitToArchive);
            fetchData(); // Refresh data to reflect the change
            toast({
                title: "Kit Archived",
                description: `Kit "${kitToArchive.name}" has been moved to the archive.`
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Archive Failed', description: String(error) });
        }
    };
    
    const handleRestoreKit = async (kitToRestore: Kit) => {
        try {
            await restoreKit(kitToRestore);
            fetchData(); // Refresh data
            toast({
                title: "Kit Restored",
                description: `Kit "${kitToRestore.name}" has been restored.`
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Restore Failed', description: String(error) });
        }
    }

    if (authLoading || !user) {
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

    const activeKits = kits.filter(k => k.status !== 'Archived');
    const archivedKits = kits.filter(k => k.status === 'Archived');

    return (
        <SidebarProvider 
            logo={logo} 
            onSignOut={handleSignOut} 
            onProfileClick={() => setIsProfileDialogOpen(true)}
            currentUserProfile={currentUserProfile}
            onBinClick={() => setShowArchived(prev => !prev)}
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
                        <Link href="/catalogue">Back to Data Modules</Link>
                    </Button>
                </Header>
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="mb-8 space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-headline font-bold">{showArchived ? 'Archived Kits' : 'Kits Catalogue'}</h1>
                                <p className="text-muted-foreground max-w-2xl">
                                {showArchived ? 'View and restore archived kits.' : 'Create, manage, and track the status of reusable service kits.'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon">
                                            <Settings />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <Link href="/catalogue/boats"><Ship className="mr-2 h-4 w-4" /> Manage Boats</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/catalogue/dealer-fit-options"><Settings className="mr-2 h-4 w-4" /> Manage Dealer Fit Options</Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button asChild size="lg">
                                    <Link href="/kits/new">
                                        <PlusCircle /> Create Kit
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    {isLoading ? (
                        <div className="grid grid-cols-4 gap-4">
                            <Skeleton className="h-96 w-full" />
                            <Skeleton className="h-96 w-full" />
                            <Skeleton className="h-96 w-full" />
                            <Skeleton className="h-96 w-full" />
                        </div>
                    ) : showArchived ? (
                        <KitKanbanBoard
                            allKits={archivedKits}
                            onKitStatusChange={handleKitStatusChange}
                            onArchiveKit={handleArchiveKit}
                            onRestoreKit={handleRestoreKit}
                            isArchiveView={true}
                        />
                    ) : (
                        <KitKanbanBoard
                            allKits={activeKits}
                            onKitStatusChange={handleKitStatusChange}
                            onArchiveKit={handleArchiveKit}
                            onRestoreKit={handleRestoreKit}
                        />
                    )}

                </main>
            </div>
        </SidebarProvider>
    )
}
