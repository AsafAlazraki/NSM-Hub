
"use client";

import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Copy, User, PlusCircle, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAllBookingApplications } from '@/lib/booking-application-storage';
import type { BookingApplication, BookingApplicationStatus } from '@/lib/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const statusOrder: BookingApplicationStatus[] = ['Awaiting Confirmation', 'Contacted', 'Booked', 'Completed', 'Declined'];

const statusClassMap: Record<BookingApplicationStatus, string> = {
  'Awaiting Confirmation': 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
  'Contacted': 'bg-blue-500/20 text-blue-700 border-blue-500/30',
  'Booked': 'bg-green-500/20 text-green-700 border-green-500/30',
  'Completed': 'bg-gray-500/20 text-gray-700 border-gray-500/30',
  'Declined': 'bg-red-500/20 text-red-700 border-red-500/30',
};

const ApplicationCard = ({ application }: { application: BookingApplication }) => (
    <Link href={`/booking-application/${application.id}`} className="block">
        <Card className="hover:shadow-md transition-shadow">
             <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold">{application.customerName}</CardTitle>
                    <Badge className={statusClassMap[application.status]}>{application.status}</Badge>
                </div>
                <CardDescription>{application.customerEmail}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground truncate">
                    {application.boatMake} {application.boatModel}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                    <span className="font-medium">Work:</span> {application.workToBePerformed.substring(0, 100)}...
                </p>
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">
                    Submitted: {format(application.createdAt.toDate(), 'PPP')}
                </p>
            </CardFooter>
        </Card>
    </Link>
)

export default function BookingsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [applications, setApplications] = useState<BookingApplication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            getAllBookingApplications()
                .then(setApplications)
                .catch(err => toast({ variant: 'destructive', title: 'Error', description: 'Could not load booking applications.'}))
                .finally(() => setIsLoading(false));
        }
    }, [user, toast]);

    const filteredApplications = useMemo(() => {
        return applications.filter(app => {
            const lowercasedFilter = searchTerm.toLowerCase();
            const searchInString = (value: string | undefined | null) => value && value.toLowerCase().includes(lowercasedFilter);

            return (
                searchInString(app.customerName) ||
                searchInString(app.customerEmail) ||
                searchInString(app.boatMake) ||
                searchInString(app.boatModel) ||
                searchInString(app.boatRegistrationNumber)
            );
        });
    }, [applications, searchTerm]);


    const handleCopyLink = () => {
        // Updated to use a consistent, non-dynamic URL
        const url = `${window.location.origin}/service-hub/bookings/new`;
        navigator.clipboard.writeText(url);
        toast({
            title: "Link Copied",
            description: "The public booking form link has been copied to your clipboard.",
        });
    }

    return (
        <div className="flex flex-col h-screen">
            <Header>
                 <Button asChild variant="outline">
                    <Link href="/service-hub"><ArrowLeft /> Back to Service Hub</Link>
                </Button>
            </Header>
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-headline font-bold">Booking Applications</h1>
                        <p className="text-muted-foreground">Manage booking forms and view submissions.</p>
                    </div>
                    <div className="flex items-center gap-2">
                         <Button onClick={handleCopyLink} variant="secondary">
                            <Copy /> Copy Public Link
                        </Button>
                         <Button asChild>
                            <Link href="/booking-application/new">
                                <PlusCircle /> New Application
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name, email, boat..."
                        className="pl-10 h-12 w-full max-w-lg text-base md:text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {isLoading ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
                    </div>
                ) : filteredApplications.length === 0 ? (
                    <div className="text-center py-16 border rounded-lg bg-card">
                        <h2 className="text-2xl font-semibold">No Submissions Found</h2>
                        <p className="text-muted-foreground mt-2">
                            {searchTerm ? "Try adjusting your search." : "When a customer submits a form, their application will appear here."}
                        </p>
                    </div>
                ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredApplications.map((app) => (
                           <ApplicationCard key={app.id} application={app} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
