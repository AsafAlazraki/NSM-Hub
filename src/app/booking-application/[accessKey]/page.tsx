
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getBookingApplication, updateBookingApplicationStatus, deleteBookingApplication } from '@/lib/booking-application-storage';
import { BookingApplication, BookingApplicationStatus } from '@/lib/types';
import { BookingForm } from '@/components/booking/BookingForm';
import { getStaticLogo } from '@/lib/storage';
import { useAuth } from '@/hooks/use-auth';
import { ArrowLeft, ChevronDown, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
} from "@/components/ui/alert-dialog"
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusOrder: BookingApplicationStatus[] = ['Awaiting Confirmation', 'Contacted', 'Booked', 'Completed', 'Declined'];

const statusClassMap: Record<BookingApplicationStatus, string> = {
  'Awaiting Confirmation': 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
  'Contacted': 'bg-blue-500/20 text-blue-700 border-blue-500/30',
  'Booked': 'bg-green-500/20 text-green-700 border-green-500/30',
  'Completed': 'bg-gray-500/20 text-gray-700 border-gray-500/30',
  'Declined': 'bg-red-500/20 text-red-700 border-red-500/30',
};

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="md:col-span-2">
        <h3 className="text-lg font-semibold mb-2 border-b pb-2">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-2">
            {children}
        </div>
    </div>
);

const DetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => {
    if (!value) return null;
    return (
        <div>
            <Label>{label}</Label>
            <p className="font-medium whitespace-pre-wrap">{value}</p>
        </div>
    )
};

export default function BookingApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const accessKeyFromUrl = params.accessKey as string;
  const { toast } = useToast();
  const { user } = useAuth();

  const [application, setApplication] = useState<BookingApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewApplicationMode, setIsNewApplicationMode] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      const fetchedLogo = await getStaticLogo();
      setLogo(fetchedLogo);

      if (accessKeyFromUrl && accessKeyFromUrl !== 'new') {
        const existingApplication = await getBookingApplication(accessKeyFromUrl);
        if (existingApplication) {
          setApplication(existingApplication);
          setIsNewApplicationMode(false);
        } else {
          toast({
            title: 'Invalid Link',
            description: 'The booking application link is invalid or expired. Please contact support.',
            variant: 'destructive',
          });
          router.replace('/service-hub/bookings');
        }
      } else if (accessKeyFromUrl === 'new') {
        setIsNewApplicationMode(true);
      } else {
        router.replace('/service-hub/bookings');
      }
      setLoading(false);
    }
    loadInitialData();
  }, [accessKeyFromUrl, toast, router]);

  const handleStatusChange = async (newStatus: BookingApplicationStatus) => {
    if (!application) return;
    try {
        const success = await updateBookingApplicationStatus(application.id!, newStatus);
        if(success) {
            setApplication(prev => prev ? { ...prev, status: newStatus } : null);
            toast({
                title: "Status Updated",
                description: `Application status changed to "${newStatus}".`,
            });
        } else {
            throw new Error("Failed to update status in database.");
        }
    } catch (error) {
        toast({
            variant: 'destructive',
            title: "Update Failed",
            description: "Could not update the application status.",
        });
    }
  }


  const handleDelete = async () => {
    if (!application) return;
    try {
        const success = await deleteBookingApplication(application.id!);
        if (!success) throw new Error("Failed to delete application in database.");
        toast({
            title: "Application Deleted",
            description: "The booking application has been moved to the bin.",
        });
        router.push('/service-hub/bookings');
    } catch (error) {
        toast({
            variant: 'destructive',
            title: "Deletion Failed",
            description: "Could not delete the application.",
        });
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading application...</p>
      </div>
    );
  }

  // Read-only view for existing submissions
  if (application && !isNewApplicationMode) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/40">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <Button asChild variant="outline">
                <Link href="/service-hub/bookings"><ArrowLeft /> Back to Applications</Link>
            </Button>
             <div className="flex items-center gap-2">
                {user && (
                    <>
                        <Button asChild>
                            <Link href={`/service-hub/bookings/${application.id}/edit`}><Edit /> Edit</Link>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive"><Trash2 /> Delete</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete this application?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will move the booking application to the bin. You can restore it later from the archived view.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            Status: <Badge className={cn("ml-2", statusClassMap[application.status])}>{application.status}</Badge> <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {statusOrder.map(status => (
                            <DropdownMenuItem key={status} onSelect={() => handleStatusChange(status)}>
                                {status}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Card className="w-full max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Booking Application: {application.customerName}</CardTitle>
                <CardDescription>Submitted on {application.createdAt.toDate().toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                <Section title="Customer Details">
                    <DetailItem label="NSM Location" value={application.location} />
                    <DetailItem label="Full Name" value={application.customerName} />
                    <DetailItem label="Mobile Number" value={application.customerMobileNumber} />
                    <DetailItem label="Email Address" value={application.customerEmail} />
                    <DetailItem label="Address" value={application.customerAddress} />
                </Section>

                <Section title="Boat Details">
                    <DetailItem label="Make" value={application.boatMake} />
                    <DetailItem label="Model" value={application.boatModel} />
                    <DetailItem label="HIN" value={application.boatHin} />
                    <DetailItem label="Registration Number" value={application.boatRegistrationNumber} />
                </Section>

                <Section title="Engine Details">
                    <DetailItem label="Make" value={application.engineMake} />
                    <DetailItem label="Model" value={application.engineModel} />
                    <DetailItem label="Serial Number" value={application.engineSerialNumber} />
                </Section>

                <Section title="Trailer Details">
                    <DetailItem label="Make" value={application.trailerMake} />
                    <DetailItem label="Model" value={application.trailerModel} />
                    <DetailItem label="VIN" value={application.trailerVin} />
                    <DetailItem label="Registration" value={application.trailerRegistration} />
                </Section>

                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold mb-2 border-b pb-2">Work to be Performed</h3>
                  <p className="whitespace-pre-wrap p-3 bg-muted rounded-md mt-2">{application.workToBePerformed}</p>
                </div>
                
                 <Section title="Key Dates">
                    <DetailItem label="Booking Date Requested" value={application.bookingDateRequested} />
                    <DetailItem label="Date Required for Collection" value={application.dateRequiredForCollection} />
                </Section>

                {application.staffNotes && (
                    <div className="md:col-span-2 mt-2">
                        <h3 className="text-lg font-semibold mb-2">Internal Staff Notes:</h3>
                        <p className="italic text-gray-600">{application.staffNotes}</p>
                    </div>
                )}
              </CardContent>
            </Card>
        </main>
      </div>
    );
  }

  // New submission form
  return (
    <div className="bg-muted/40 min-h-screen sm:py-12">
        <div className="container mx-auto max-w-4xl sm:px-4">
             <main className="w-full">
                <BookingForm formId={accessKeyFromUrl} logo={logo} />
            </main>
        </div>
    </div>
  );
}
