
"use client";

import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, PlusCircle, Trash2 } from 'lucide-react';
import { DiagnosticReportCard } from '@/components/yamaha-diagnostics/DiagnosticReportCard';
import { getDiagnosticReports, deleteDiagnosticReport, deleteAllDiagnosticReports, getUserProfile, getStaticLogo } from '@/lib/storage';
import type { DiagnosticReport, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SidebarProvider } from '@/components/ui/sidebar';
import { getAuth, signOut } from 'firebase/auth';
import { UserProfileDialog } from '@/components/UserProfileDialog';


function YamahaDiagnosticsPageContent() {
    const { toast } = useToast();
    const [reports, setReports] = useState<DiagnosticReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();


    const fetchReports = async () => {
        if (user) {
            setIsLoading(true);
            try {
                const fetchedReports = await getDiagnosticReports();
                setReports(fetchedReports);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load diagnostic reports.' });
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchReports();
    }, [user]);

    const handleDeleteReport = async (id: string) => {
        try {
            await deleteDiagnosticReport(id);
            toast({ title: 'Report Deleted', description: 'The diagnostic report has been deleted.' });
            window.location.reload();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the report.' });
        }
    };

    const handleDeleteAll = async () => {
        try {
            await deleteAllDiagnosticReports();
            toast({ title: 'All Reports Deleted', description: 'All diagnostic reports have been cleared.' });
            window.location.reload();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete all reports.' });
        }
    }
    return (
         <div className="flex flex-col h-screen">
            <Header>
                 <Button asChild variant="outline">
                    <Link href="/service-hub"><ArrowLeft /> Back to Service Hub</Link>
                </Button>
            </Header>
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                 <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-headline font-bold">Yamaha Diagnostics</h1>
                        <p className="text-muted-foreground">AI-powered diagnostics and analysis for Yamaha engines.</p>
                    </div>
                     <div className="flex items-center gap-2">
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 /> Temp: Delete All
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete all diagnostic reports.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteAll}>Delete All</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Button asChild>
                            <Link href="/service-hub/yamaha-diagnostics/new">
                                <PlusCircle /> New Report
                            </Link>
                        </Button>
                     </div>
                </div>
                 {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
                    </div>
                ) : reports.length === 0 ? (
                    <Card>
                        <CardContent>
                            <div className="text-center py-16">
                                <h2 className="text-2xl font-semibold">No Diagnostic Reports</h2>
                                <p className="text-muted-foreground mt-2">
                                    Click "New Report" to generate your first analysis.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                 ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {reports.map(report => (
                            <DiagnosticReportCard key={report.id} report={report} onDelete={handleDeleteReport} />
                        ))}
                    </div>
                 )}
            </main>
        </div>
    )
}

export default function YamahaDiagnosticsPage() {
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
                         <Skeleton className="h-12 w-1/3 mb-8" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
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
            <YamahaDiagnosticsPageContent />
        </SidebarProvider>
    );
}
