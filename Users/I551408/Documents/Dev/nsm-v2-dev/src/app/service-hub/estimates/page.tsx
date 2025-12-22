

"use client";

import Link from 'next/link';
import { QuoteCard } from '@/components/QuoteCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Quote, UserProfile, EstimateType } from '@/lib/types';
import { PlusCircle, Search, Trash2, Wrench } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { getQuotes, deleteQuote, getAllUsers, saveQuote, getQuoteById, createNewVersion, deleteQuotes } from '@/lib/storage';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/Header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { getStaticLogo, getUserProfile } from '@/lib/storage';
import { getAuth, signOut } from 'firebase/auth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from '@/components/ui/checkbox';


function ServiceEstimatesDashboardPageContent() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Quote['status'] | 'All'>('All');
  const [userFilter, setUserFilter] = useState<string | 'All'>('All');
  const [openClosedFilter, setOpenClosedFilter] = useState<'All' | 'Open' | 'Closed'>('All');
  const [typeFilter, setTypeFilter] = useState<EstimateType | 'All'>('All');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const [showArchived, setShowArchived] = useState(false);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const storedSearchTerm = sessionStorage.getItem('quoteSearchTerm') || "";
      const storedStatusFilter = (sessionStorage.getItem('quoteStatusFilter') || 'All') as Quote['status'] | 'All';
      const storedOpenClosedFilter = (sessionStorage.getItem('quoteOpenClosedFilter') || 'All') as 'All' | 'Open' | 'Closed';
      const storedTypeFilter = (sessionStorage.getItem('quoteTypeFilter') || 'All') as EstimateType | 'All';
      let storedUserFilter = sessionStorage.getItem('quoteUserFilter') || 'All';
      
      setSearchTerm(storedSearchTerm);
      setStatusFilter(storedStatusFilter);
      setOpenClosedFilter(storedOpenClosedFilter);
      setTypeFilter(storedTypeFilter);

      const defaultSet = sessionStorage.getItem('quoteUserFilterDefaultSet');
      if (!defaultSet) {
           setUserFilter(user.uid);
           sessionStorage.setItem('quoteUserFilter', user.uid);
           sessionStorage.setItem('quoteUserFilterDefaultSet', 'true');
      } else {
           setUserFilter(storedUserFilter);
      }
      setIsInitialLoad(false);
    }
  }, [user]);

  useEffect(() => {
    if(!isInitialLoad) sessionStorage.setItem('quoteSearchTerm', searchTerm);
  }, [searchTerm, isInitialLoad]);

  useEffect(() => {
    if(!isInitialLoad) sessionStorage.setItem('quoteStatusFilter', statusFilter);
  }, [statusFilter, isInitialLoad]);
  
  useEffect(() => {
    if(!isInitialLoad) sessionStorage.setItem('quoteOpenClosedFilter', openClosedFilter);
  }, [openClosedFilter, isInitialLoad]);

  useEffect(() => {
    if(!isInitialLoad) sessionStorage.setItem('quoteUserFilter', userFilter);
  }, [userFilter, isInitialLoad]);

  useEffect(() => {
    if(!isInitialLoad) sessionStorage.setItem('quoteTypeFilter', typeFilter);
  }, [typeFilter, isInitialLoad]);


  const refreshQuotes = async () => {
    if (user) {
      setIsLoading(true);
      try {
        const [fetchedQuotes, fetchedUsers] = await Promise.all([
          getQuotes(),
          getAllUsers(),
        ]);
        setQuotes(fetchedQuotes);
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load dashboard data. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    refreshQuotes();
  }, [user, toast]);

  const handleNewVersionFromCard = async (quoteId: string) => {
    const originalQuote = quotes.find(q => q.id === quoteId);
    if (!originalQuote) {
      toast({ variant: "destructive", title: "Error", description: "Could not find original estimate to duplicate." });
      return;
    }
     try {
        const newVersionId = await createNewVersion(originalQuote);
        toast({
            title: "New Version Created",
            description: `A new draft has been created from estimate ${originalQuote.id.split('-v')[0]}.`,
        });
        refreshQuotes(); 
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Versioning Failed",
            description: error.message || "Could not create a new version.",
        });
    }
  }

  const handleDeleteQuote = async (quoteId: string) => {
    try {
        await deleteQuote(quoteId);
        toast({
            title: "Estimate Deleted",
            description: `Estimate ${quoteId} has been moved to the bin.`,
        });
        window.location.reload();
    } catch (error) {
            toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "Could not delete the estimate. You may not have permission.",
        });
    }
  }
  
  const handleBulkDelete = async () => {
    try {
        await deleteQuotes(selectedQuotes);
        toast({
            title: "Estimates Deleted",
            description: `${selectedQuotes.length} estimate(s) have been permanently deleted.`,
        });
        window.location.reload();
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Bulk Deletion Failed",
            description: "Could not delete the selected estimates.",
        });
    }
  };

  const handleRestoreQuote = async (quoteId: string) => {
    try {
      const quoteToRestore = quotes.find(q => q.id === quoteId);
      if (quoteToRestore) {
        const updatedQuote = { ...quoteToRestore, status: 'Work In Progress' as const };
        await saveQuote(updatedQuote, true);
        setQuotes(prevQuotes => prevQuotes.map(q => q.id === quoteId ? updatedQuote : q));
        toast({
          title: "Estimate Restored",
          description: `Estimate ${quoteId} has been restored.`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Restore Failed",
        description: "Could not restore the estimate.",
      });
    }
  };


  const handleCancelQuote = async (quoteId: string) => {
    if (user) {
      try {
        const quoteToCancel = await getQuoteById(quoteId);
        if (quoteToCancel) {
          const updatedQuote = { ...quoteToCancel, status: 'Cancelled' as const };
          await saveQuote(updatedQuote, true);
          setQuotes(prevQuotes => prevQuotes.map(q => q.id === quoteId ? updatedQuote : q));
          toast({
            title: "Estimate Cancelled",
            description: `Estimate ${quoteId} has been marked as Cancelled.`,
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: "Could not cancel the estimate.",
        });
      }
    }
  }

  const handleStatusChange = async (quoteId: string, newStatus: Quote['status']) => {
     if (user) {
      try {
        const quoteToUpdate = quotes.find(q => q.id === quoteId);
        if (quoteToUpdate) {
          const updatedQuote = { ...quoteToUpdate, status: newStatus };
          await saveQuote(updatedQuote, true);
          setQuotes(prevQuotes => prevQuotes.map(q => q.id === quoteId ? updatedQuote : q));
          toast({
            title: "Status Updated",
            description: `Estimate ${quoteId} status changed to ${newStatus}.`,
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: "Could not update the estimate status.",
        });
      }
    }
  };
  
  const statusCounts = useMemo(() => {
    const counts: Record<Quote['status'] | 'All', number> = {
      'All': 0, 'Work In Progress': 0, 'Estimate': 0, 'Pending': 0, 
      'Approved': 0, 'Complete': 0, 'Cancelled': 0, 'Deleted': 0
    };
    
    const validQuotes = quotes.filter(Boolean); // Filter out any null/undefined quotes
    const historyIds = new Set<string>();
    validQuotes.forEach(quote => { (quote.history || []).forEach(id => historyIds.add(id)); });
    
    const activeQuotes = validQuotes.filter(q => !historyIds.has(q.id) && q.status !== 'Deleted');
    counts['All'] = activeQuotes.length;
    
    activeQuotes.forEach(q => {
      const status = q.status as keyof typeof counts;
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });

    return counts;
  }, [quotes]);
  
  const archivedQuotes = useMemo(() => {
    return quotes.filter(q => q && q.status === 'Deleted');
  }, [quotes]);


  const filteredQuotes = useMemo(() => {
    const sourceQuotes = showArchived ? archivedQuotes : quotes.filter(q => {
        if (!q) return false;
        const historyIds = new Set<string>();
        quotes.filter(Boolean).forEach(quote => { (quote.history || []).forEach(id => historyIds.add(id)); });
        return !historyIds.has(q.id) && q.status !== 'Deleted';
    });

    let filtered = sourceQuotes.filter(Boolean);
    
    if (typeFilter !== 'All') {
        filtered = filtered.filter(quote => quote.estimateType === typeFilter);
    }
    
    if (statusFilter !== 'All') {
        filtered = filtered.filter(quote => quote.status === statusFilter);
    }
    
    if (openClosedFilter === 'Open') {
      filtered = filtered.filter(quote => quote.status !== 'Complete' && quote.status !== 'Cancelled');
    } else if (openClosedFilter === 'Closed') {
      filtered = filtered.filter(quote => quote.status === 'Complete' || quote.status === 'Cancelled');
    }

    if (userFilter !== 'All') {
        filtered = filtered.filter(quote => quote.userId === userFilter);
    }
    
    if (searchTerm) {
        const lowercasedFilter = searchTerm.toLowerCase();
        filtered = filtered.filter(quote => {
          const searchInString = (value: string | undefined | null) => value && value.toLowerCase().includes(lowercasedFilter);

          return (
            searchInString(quote.id) ||
            searchInString(quote.user?.ref) ||
            searchInString(quote.user?.name) ||
            searchInString(quote.customer?.name) ||
            searchInString(quote.customer?.phone) ||
            searchInString(quote.customer?.address?.street) ||
            searchInString(quote.customer?.address?.suburb) ||
            searchInString(quote.customer?.address?.state) ||
            searchInString(quote.boat?.make) ||
            searchInString(quote.boat?.model) ||
            searchInString(quote.boat?.registration) ||
            (quote.motors || []).some(m => searchInString(m.make) || searchInString(m.model)) ||
            searchInString(quote.trailer?.make) ||
            searchInString(quote.trailer?.model) ||
            searchInString(quote.trailer?.registration) ||
            quote.operations?.some(op => 
                searchInString(op.heading) || 
                searchInString(op.description) ||
                op.parts?.some(p => searchInString(p.name))
            )
          );
        });
    }

    return filtered;
  }, [quotes, searchTerm, statusFilter, userFilter, openClosedFilter, showArchived, archivedQuotes, typeFilter]);
  
  const handleArchiveClick = () => {
    setShowArchived(prev => !prev);
    setSelectedQuotes([]); // Clear selections when toggling view
  };

  const handleSelectQuote = (quoteId: string) => {
    setSelectedQuotes(prev => 
        prev.includes(quoteId) 
            ? prev.filter(id => id !== quoteId)
            : [...prev, quoteId]
    );
  };
  
  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
        setSelectedQuotes(filteredQuotes.map(q => q.id));
    } else {
        setSelectedQuotes([]);
    }
  };
  
  return (
    <div className="flex flex-col h-screen">
      <Header>
        <div className="flex items-center gap-4">
          <Button asChild variant="outline">
            <Link href="/service-hub">Back to Service Hub</Link>
          </Button>
          <h1 className="text-xl font-semibold">{ showArchived ? "Archived Estimates" : "Service Estimates" }</h1>
          {showArchived && selectedQuotes.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 /> Delete ({selectedQuotes.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {selectedQuotes.length} estimate(s). This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete}>Delete Estimates</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {!showArchived && (
            <Button asChild>
              <Link href="/service-hub/estimates/new">
                <PlusCircle />
                New Estimate
              </Link>
            </Button>
          )}
        </div>
      </Header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
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
              <Select value={userFilter} onValueChange={(value: string | 'All') => setUserFilter(value)}>
                <SelectTrigger className="h-12 text-base md:text-sm">
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Users</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.uid} value={u.uid}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={typeFilter} onValueChange={(value: EstimateType | 'All') => setTypeFilter(value)}>
                <SelectTrigger className="h-12 text-base md:text-sm">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="Installation">Installation</SelectItem>
                  <SelectItem value="Insurance">Insurance</SelectItem>
                  <SelectItem value="Mechanical Estimate">Mechanical Estimate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={(value: Quote['status'] | 'All') => setStatusFilter(value)}>
                <SelectTrigger className="h-12 text-base md:text-sm">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses ({statusCounts['All']})</SelectItem>
                  <SelectItem value="Work In Progress">Work In Progress ({statusCounts['Work In Progress']})</SelectItem>
                  <SelectItem value="Estimate">Estimate ({statusCounts['Estimate']})</SelectItem>
                  <SelectItem value="Pending">Pending ({statusCounts['Pending']})</SelectItem>
                  <SelectItem value="Approved">Approved ({statusCounts['Approved']})</SelectItem>
                  <SelectItem value="Complete">Complete ({statusCounts['Complete']})</SelectItem>
                  <SelectItem value="Cancelled">Cancelled ({statusCounts['Cancelled']})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={openClosedFilter} onValueChange={(value: 'All' | 'Open' | 'Closed') => setOpenClosedFilter(value)}>
                <SelectTrigger className="h-12 text-base md:text-sm">
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
                checked={selectedQuotes.length === filteredQuotes.length && filteredQuotes.length > 0}
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
        ) : filteredQuotes.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold">{showArchived ? 'No Archived Estimates Found' : 'No estimates found'}</h2>
            <p className="text-muted-foreground mt-2">
              {showArchived
                ? 'You can delete or cancel an estimate from the card\'s menu to archive it.'
                : (searchTerm || statusFilter !== 'All' || userFilter !== 'All' || typeFilter !== 'All' || openClosedFilter !== 'All' ? 'Try adjusting your search or filters.' : 'Click "New Estimate" to get started.')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredQuotes.map((quote) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                onDelete={() => handleDeleteQuote(quote.id)}
                onCancel={() => handleCancelQuote(quote.id)}
                onStatusChange={handleStatusChange}
                onRestore={() => handleRestoreQuote(quote.id)}
                onNewVersion={() => handleNewVersionFromCard(quote.id)}
                isSelectionMode={showArchived}
                isSelected={selectedQuotes.includes(quote.id)}
                onSelect={handleSelectQuote}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default function ServiceEstimatesPageWrapper() {
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
      <ServiceEstimatesDashboardPageContent />
    </SidebarProvider>
  )
}
