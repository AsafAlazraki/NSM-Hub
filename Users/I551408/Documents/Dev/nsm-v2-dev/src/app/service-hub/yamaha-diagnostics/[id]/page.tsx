
"use client";

import { Header } from "@/components/Header";
import { getDiagnosticReportById, getUserProfile, getStaticLogo } from "@/lib/storage";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Ship, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import type { DiagnosticReport, EngineDetails, UserProfile } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getAuth, signOut } from "firebase/auth";
import { UserProfileDialog } from "@/components/UserProfileDialog";


const EngineDataDisplay = ({ engine }: { engine: EngineDetails }) => {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Ship /> {engine.model || 'Engine Details'}</CardTitle>
        <CardDescription>S/N: {engine.serial || 'N/A'} &bull; Hours: {engine.hours || 'N/A'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {engine.hourAnalysis && engine.hourAnalysis.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Engine Operating Hours</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={engine.hourAnalysis}>
                <XAxis dataKey="rpmRange" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} hrs`, 'Hours']} />
                <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {engine.diagnosisRecords && engine.diagnosisRecords.length > 0 && (
           <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="text-destructive" /> Diagnostic Codes ({engine.diagnosisRecords.length})</h4>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Occurrences</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {engine.diagnosisRecords.map((record, i) => (
                        <TableRow key={i}>
                            <TableCell>{record.code}</TableCell>
                            <TableCell>{record.description}</TableCell>
                            <TableCell className="text-right">{record.occurrences}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
           </div>
        )}
      </CardContent>
    </Card>
  )
}

function ViewDiagnosticReportPageContent() {
  const params = useParams();
  const id = params.id as string;
  const [report, setReport] = useState<DiagnosticReport | null | undefined>(undefined);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
        if (user && id) {
            setIsLoading(true);
            const foundReport = await getDiagnosticReportById(id);
            setReport(foundReport);
            setIsLoading(false);
        }
    }
    fetchReport();
  }, [id, user]);

  if (isLoading || report === undefined) {
    return (
      <div className="flex flex-col h-full bg-muted/40">
        <Header>
          <Button variant="outline" asChild>
            <Link href="/service-hub/yamaha-diagnostics"><ArrowLeft/>Back to Diagnostics</Link>
          </Button>
        </Header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Skeleton className="h-[80vh] w-full" />
        </main>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col h-full">
        <Header>
          <Button variant="ghost" asChild>
            <Link href="/service-hub/yamaha-diagnostics">Back to Diagnostics</Link>
          </Button>
        </Header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Report not found</h1>
            <p className="text-muted-foreground">The report you are looking for does not exist.</p>
          </div>
        </main>
      </div>
    );
  }

  const engines = report.engines || [];

  return (
    <div className="flex flex-col h-screen bg-muted/40">
      <Header>
        <Button variant="outline" asChild>
          <Link href="/service-hub/yamaha-diagnostics"><ArrowLeft/>Back to Diagnostics</Link>
        </Button>
        <Button asChild>
          <Link href={`/service-hub/yamaha-diagnostics/${report.id}/print`}><Printer className="mr-2"/> View Printable Report</Link>
        </Button>
      </Header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold">Diagnostic Report for {report.customer.name}</h1>
        <p className="text-muted-foreground">Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
        <div className="mt-6 space-y-4">
          {engines.length > 0 ? (
            engines.map(engine => <EngineDataDisplay key={engine.id} engine={engine} />)
          ) : (
            <div className="flex items-center justify-center h-48 border rounded-md bg-card">
              <p className="text-muted-foreground">No engine data was found in this report.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


export default function ViewDiagnosticReportPage() {
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
                <div className="flex flex-col h-screen bg-muted/40">
                    <Header>
                        <Button variant="outline" asChild>
                            <Link href="/service-hub/yamaha-diagnostics"><ArrowLeft/>Back to Diagnostics</Link>
                        </Button>
                    </Header>
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        <Skeleton className="h-[80vh] w-full" />
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
            <ViewDiagnosticReportPageContent />
        </SidebarProvider>
    )
}
