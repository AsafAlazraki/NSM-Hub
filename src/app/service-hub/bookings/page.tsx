
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Archive, Calendar, Copy, Edit, MoreVertical, PlusCircle, Search, Ship, Trash2, ArchiveRestore, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    getAllBookingApplications,
    updateBookingApplicationStatus,
    deleteBookingApplication,
    restoreBookingApplication,
    permanentlyDeleteBookingApplications,
} from '@/lib/booking-application-storage';
import { getStaticLogo, getUserProfile } from '@/lib/storage';
import type { BookingApplication, BookingApplicationStatus, UserProfile } from '@/lib/types';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { getAuth, signOut } from 'firebase/auth';
import { format } from 'date-fns';
import { Header } from '@/components/Header';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from '@/components/ui/alert-dialog';

const statusOrder: BookingApplicationStatus[] = ['Awaiting Confirmation', 'Contacted', 'Booked', 'Completed', 'Declined'];

const openStatuses: BookingApplicationStatus[] = ['Awaiting Confirmation', 'Contacted', 'Booked'];

const statusClassMap: Record<BookingApplicationStatus, string> = {
  'Awaiting Confirmation': 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/30',
  'Contacted': 'bg-blue-500/20 text-blue-700 border-blue-500/30 hover:bg-blue-500/30',
  'Booked': 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30',
  'Completed': 'bg-gray-500/20 text-gray-700 border-gray-500/30 hover:bg-gray-500/30',
  'Declined': 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30',
};

interface ApplicationCardProps {
    application: BookingApplication;
    onStatusChange: (id: string, status: BookingApplicationStatus) => void;
    onDelete: (id: string) => void;
    onRestore: (id: string) => void;
    isSelectionMode?: boolean;
    isSelected?: boolean;
    onSelect?: (id: string) => void;
}

const ApplicationCard = ({ application, onStatusChange, onDelete, onRestore, isSelectionMode = false, isSelected = false, onSelect }: ApplicationCardProps) => {
    const isArchivedView = !!application.deleted;

    const handleSelectClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
    };

    return (
        <Card className={cn('flex flex-col h-full hover:shadow-lg transition-shadow duration-300 relative', isArchivedView && 'bg-muted/50')}>
            {isSelectionMode && onSelect && (
                <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onSelect(application.id!)}
                        aria-label={`Select application from ${application.customerName}`}
                    />
                </div>
            )}
            <CardHeader className={cn(isSelectionMode && 'pl-10')}>
                <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1 min-w-0">
                        <CardTitle className="font-headline text-lg leading-tight truncate">{application.customerName}</CardTitle>
                        <CardDescription className="truncate">{application.customerEmail}</CardDescription>
                    </div>
                    <Select
                        value={application.status}
                        onValueChange={(newStatus: BookingApplicationStatus) => onStatusChange(application.id!, newStatus)}
                        disabled={isArchivedView}
                    >
                        <SelectTrigger
                            className={cn(
                                'text-xs font-semibold px-3 py-1 h-auto border rounded-full focus:ring-0 focus:ring-offset-0 w-auto shrink-0',
                                statusClassMap[application.status]
                            )}
                            onClick={handleSelectClick}
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent onClick={handleSelectClick}>
                            {statusOrder.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className={cn('flex-1 space-y-3', isSelectionMode && 'pl-10')}>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Submitted {application.createdAt ? format(application.createdAt.toDate(), 'MMMM d, yyyy') : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Ship className="w-4 h-4 shrink-0" />
                    <span className="truncate">{[application.boatMake, application.boatModel].filter(Boolean).join(' ') || 'N/A'}</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Wrench className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{application.workToBePerformed || 'N/A'}</span>
                </div>
            </CardContent>
            <CardFooter className={cn('flex justify-between items-center', isSelectionMode && 'pl-10')}>
                {application.bookingDateRequested ? (
                    <span className="text-sm font-medium text-muted-foreground">Requested: {application.bookingDateRequested}</span>
                ) : <span />}
                <div className="flex items-center">
                    {isArchivedView ? (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline"><ArchiveRestore className="mr-2 h-4 w-4" />Restore</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Restore this application?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will restore the booking application and make it active again.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onRestore(application.id!)}>Restore</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    ) : (
                        <>
                            <Button asChild variant="outline">
                                <Link href={`/booking-application/${application.id}`}>View</Link>
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href={`/service-hub/bookings/${application.id}/edit`}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will move the application to the bin. You can restore it later.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onDelete(application.id!)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
};

function BookingsPageContent() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [applications, setApplications] = useState<BookingApplication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<BookingApplicationStatus | 'All'>('All');
    const [openClosedFilter, setOpenClosedFilter] = useState<'All' | 'Open' | 'Closed'>('All');
    const [showArchived, setShowArchived] = useState(false);
    const [selectedApplications, setSelectedApplications] = useState<string[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined' && user) {
            setSearchTerm(sessionStorage.getItem('bookingSearchTerm') || '');
            setStatusFilter((sessionStorage.getItem('bookingStatusFilter') || 'All') as BookingApplicationStatus | 'All');
            setOpenClosedFilter((sessionStorage.getItem('bookingOpenClosedFilter') || 'All') as 'All' | 'Open' | 'Closed');
            setIsInitialLoad(false);
        }
    }, [user]);

    useEffect(() => {
        if (!isInitialLoad) sessionStorage.setItem('bookingSearchTerm', searchTerm);
    }, [searchTerm, isInitialLoad]);

    useEffect(() => {
        if (!isInitialLoad) sessionStorage.setItem('bookingStatusFilter', statusFilter);
    }, [statusFilter, isInitialLoad]);

    useEffect(() => {
        if (!isInitialLoad) sessionStorage.setItem('bookingOpenClosedFilter', openClosedFilter);
    }, [openClosedFilter, isInitialLoad]);

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            getAllBookingApplications()
                .then(setApplications)
                .catch(() => toast({ variant: 'destructive', title: 'Error', description: 'Could not load booking applications.' }))
                .finally(() => setIsLoading(false));
        }
    }, [user, toast]);

    const handleStatusChange = async (id: string, newStatus: BookingApplicationStatus) => {
        try {
            const success = await updateBookingApplicationStatus(id, newStatus);
            if (!success) throw new Error('Failed to update status.');
            setApplications(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
            toast({
                title: 'Status Updated',
                description: `Application status changed to "${newStatus}".`,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update the application status.',
            });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const success = await deleteBookingApplication(id);
            if (!success) throw new Error('Failed to delete application.');
            setApplications(prev => prev.map(app => app.id === id ? { ...app, deleted: true } : app));
            toast({
                title: 'Application Deleted',
                description: 'The booking application has been moved to the bin.',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: 'Could not delete the application.',
            });
        }
    };

    const handleRestore = async (id: string) => {
        try {
            const success = await restoreBookingApplication(id);
            if (!success) throw new Error('Failed to restore application.');
            setApplications(prev => prev.map(app => app.id === id ? { ...app, deleted: false } : app));
            toast({
                title: 'Application Restored',
                description: 'The booking application has been restored.',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Restore Failed',
                description: 'Could not restore the application.',
            });
        }
    };

    const handleBulkDelete = async () => {
        try {
            const success = await permanentlyDeleteBookingApplications(selectedApplications);
            if (!success) throw new Error('Failed to permanently delete applications.');
            setApplications(prev => prev.filter(app => !selectedApplications.includes(app.id!)));
            toast({
                title: 'Applications Deleted',
                description: `${selectedApplications.length} application(s) have been permanently deleted.`,
            });
            setSelectedApplications([]);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Bulk Deletion Failed',
                description: 'Could not delete the selected applications.',
            });
        }
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/service-hub/bookings/new`;
        navigator.clipboard.writeText(url);
        toast({
            title: 'Link Copied',
            description: 'The public booking form link has been copied to your clipboard.',
        });
    };

    const activeApplications = useMemo(() => applications.filter(app => !app.deleted), [applications]);
    const archivedApplications = useMemo(() => applications.filter(app => app.deleted), [applications]);

    const statusCounts = useMemo(() => {
        const counts: Record<BookingApplicationStatus | 'All', number> = {
            'All': activeApplications.length,
            'Awaiting Confirmation': 0,
            'Contacted': 0,
            'Booked': 0,
            'Completed': 0,
            'Declined': 0,
        };
        activeApplications.forEach(app => {
            if (counts[app.status] !== undefined) counts[app.status]++;
        });
        return counts;
    }, [activeApplications]);

    const filteredApplications = useMemo(() => {
        let filtered = showArchived ? archivedApplications : activeApplications;

        if (!showArchived) {
            if (statusFilter !== 'All') {
                filtered = filtered.filter(app => app.status === statusFilter);
            }
            if (openClosedFilter === 'Open') {
                filtered = filtered.filter(app => openStatuses.includes(app.status));
            } else if (openClosedFilter === 'Closed') {
                filtered = filtered.filter(app => !openStatuses.includes(app.status));
            }
        }

        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            const searchInString = (value: string | undefined | null) => !!value && value.toLowerCase().includes(lowercasedFilter);
            filtered = filtered.filter(app =>
                searchInString(app.customerName) ||
                searchInString(app.customerEmail) ||
                searchInString(app.customerMobileNumber) ||
                searchInString(app.customerAddress) ||
                searchInString(app.boatMake) ||
                searchInString(app.boatModel) ||
                searchInString(app.boatHin) ||
                searchInString(app.boatRegistrationNumber) ||
                searchInString(app.engineMake) ||
                searchInString(app.engineModel) ||
                searchInString(app.engineSerialNumber) ||
                searchInString(app.trailerMake) ||
                searchInString(app.trailerModel) ||
                searchInString(app.trailerVin) ||
                searchInString(app.trailerRegistration) ||
                searchInString(app.workToBePerformed) ||
                searchInString(app.staffNotes)
            );
        }

        return filtered;
    }, [activeApplications, archivedApplications, showArchived, statusFilter, openClosedFilter, searchTerm]);

    const handleArchiveClick = () => {
        setShowArchived(prev => !prev);
        setSelectedApplications([]);
    };

    const handleSelectApplication = (id: string) => {
        setSelectedApplications(prev =>
            prev.includes(id) ? prev.filter(appId => appId !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (isChecked: boolean) => {
        setSelectedApplications(isChecked ? filteredApplications.map(app => app.id!) : []);
    };

    return (
        <div className="flex flex-col h-screen">
            <Header>
                <Button asChild variant="outline">
                    <Link href="/service-hub"><ArrowLeft /> Back to Service Hub</Link>
                </Button>
            </Header>

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-8 space-y-8">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-headline font-bold">{showArchived ? 'Archived Applications' : 'Booking Applications'}</h1>
                            <p className="text-muted-foreground">
                                {showArchived
                                    ? 'Restore applications or permanently delete them.'
                                    : 'Manage booking forms and view submissions.'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {showArchived && selectedApplications.length > 0 && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">
                                            <Trash2 /> Delete ({selectedApplications.length})
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete {selectedApplications.length} application(s). This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleBulkDelete}>Delete Applications</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                            {!showArchived && (
                                <>
                                    <Button onClick={handleCopyLink} variant="secondary">
                                        <Copy /> Copy Public Link
                                    </Button>
                                    <Button asChild>
                                        <Link href="/booking-application/new">
                                            <PlusCircle /> New Application
                                        </Link>
                                    </Button>
                                </>
                            )}
                            <Button variant="ghost" onClick={handleArchiveClick}>
                                {showArchived ? <><ArrowLeft /> Back to Applications</> : <><Archive /> View Bin ({archivedApplications.length})</>}
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search anything..."
                                    className="pl-10 h-12 w-full text-base md:text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <Select value={statusFilter} onValueChange={(value: BookingApplicationStatus | 'All') => setStatusFilter(value)}>
                                <SelectTrigger className="h-12 text-base md:text-sm" disabled={showArchived}>
                                    <SelectValue placeholder="Filter by Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Statuses ({statusCounts['All']})</SelectItem>
                                    {statusOrder.map(status => (
                                        <SelectItem key={status} value={status}>{status} ({statusCounts[status]})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Select value={openClosedFilter} onValueChange={(value: 'All' | 'Open' | 'Closed') => setOpenClosedFilter(value)}>
                                <SelectTrigger className="h-12 text-base md:text-sm" disabled={showArchived}>
                                    <SelectValue placeholder="Filter by Open/Closed" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Open/Closed</SelectItem>
                                    <SelectItem value="Open">Open</SelectItem>
                                    <SelectItem value="Closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {showArchived && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="select-all"
                                checked={selectedApplications.length === filteredApplications.length && filteredApplications.length > 0}
                                onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                aria-label="Select all"
                            />
                            <label htmlFor="select-all" className="text-sm font-medium">
                                Select All
                            </label>
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
                    </div>
                ) : filteredApplications.length === 0 ? (
                    <div className="text-center py-16">
                        <h2 className="text-2xl font-semibold">{showArchived ? 'No Archived Applications Found' : 'No applications found'}</h2>
                        <p className="text-muted-foreground mt-2">
                            {showArchived
                                ? 'You can delete an application from the card\'s menu to move it to the bin.'
                                : (searchTerm || statusFilter !== 'All' || openClosedFilter !== 'All'
                                    ? 'Try adjusting your search or filters.'
                                    : 'When a customer submits a form, their application will appear here.')}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredApplications.map((application) => (
                            <ApplicationCard
                                key={application.id}
                                application={application}
                                onStatusChange={handleStatusChange}
                                onDelete={handleDelete}
                                onRestore={handleRestore}
                                isSelectionMode={showArchived}
                                isSelected={selectedApplications.includes(application.id!)}
                                onSelect={handleSelectApplication}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default function BookingsPage() {
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
            sessionStorage.removeItem('bookingSearchTerm');
            sessionStorage.removeItem('bookingStatusFilter');
            sessionStorage.removeItem('bookingOpenClosedFilter');
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
            <BookingsPageContent />
        </SidebarProvider>
    );
}
