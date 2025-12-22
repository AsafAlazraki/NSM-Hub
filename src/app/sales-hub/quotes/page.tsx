
"use client";

import { useEffect, useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { ArrowLeft, Search, PlusCircle } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { getAuth, signOut } from 'firebase/auth';
import { getUserProfile, getStaticLogo, getBmtQuotes, getAllUsers, deleteBmtQuote } from '@/lib/storage';
import type { UserProfile, BMTQuote, BMTQuoteStatus } from '@/lib/types';
import { BmtQuoteCard } from '@/components/bmt-quote/BmtQuoteCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

function BmtQuotesPageContent() {
    const [quotes, setQuotes] = useState<BMTQuote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const { toast } = useToast();
    const router = useRouter();
    
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<BMTQuoteStatus | 'All'>('All');
    const [userFilter, setUserFilter] = useState<string | 'All'>('All');
    
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [data, usersData] = await Promise.all([getBmtQuotes(), getAllUsers()]);
            setQuotes(data);
            setUsers(usersData);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch quotes.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, []);

    const handleDeleteQuote = async (quoteId: string) => {
        try {
            await deleteBmtQuote(quoteId);
            toast({ title: "Quote Archived", description: "The BMT quote has been moved to the archive." });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: "Archive Failed", description: "Could not archive the quote." });
        }
    };
    
    const filteredQuotes = useMemo(() => {
        let filtered = quotes.filter(q => q.status !== 'Archived');

        if (statusFilter !== 'All') {
            filtered = filtered.filter(q => q.status === statusFilter);
        }
        
        if (userFilter !== 'All') {
            filtered = filtered.filter(q => q.userId === userFilter);
        }

        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            filtered = filtered.filter(quote => {
              const searchInString = (value: string | undefined | null) => value && value.toLowerCase().includes(lowercasedFilter);
    
              return (
                searchInString(quote.id) ||
                searchInString(quote.user?.name) ||
                searchInString(quote.customer?.name) ||
                searchInString(quote.brandName) ||
                searchInString(quote.selectedModelId)
              );
            });
        }

        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    }, [quotes, statusFilter, userFilter, searchTerm]);

    if (isLoading) {
        return (
             <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
                 </div>
            </main>
        )
    }

    return (
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
             <div className="mb-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search quotes..."
                                className="pl-10 h-12 w-full text-base md:text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                     <div>
                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                            <SelectTrigger className="h-12 text-base md:text-sm">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Statuses</SelectItem>
                                <SelectItem value="Draft">Draft</SelectItem>
                                <SelectItem value="Sent to Customer">Sent to Customer</SelectItem>
                                <SelectItem value="Approved">Approved</SelectItem>
                                <SelectItem value="Not Approved">Not Approved</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                                <SelectItem value="Archived">Archived</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Select value={userFilter} onValueChange={(value) => setUserFilter(value)}>
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
                </div>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredQuotes.map(quote => (
                    <BmtQuoteCard key={quote.id} quote={quote} onDelete={handleDeleteQuote} />
                ))}
            </div>
             {filteredQuotes.length === 0 && (
                <div className="text-center py-16">
                    <h2 className="text-2xl font-semibold">No BMT Quotes Found</h2>
                    <p className="text-muted-foreground mt-2">
                        {searchTerm || statusFilter !== 'All' || userFilter !== 'All' ? 'Try adjusting your search or filters.' : 'No quotes have been created yet.'}
                    </p>
                </div>
            )}
        </main>
    );
}

export default function BmtQuotesPage() {
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
                <div className="flex h-screen items-center justify-center">
                    <div className="w-full h-full p-4">
                        <Header />
                        <Skeleton className="h-full w-full mt-4" />
                    </div>
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
            <div className="flex flex-col h-screen">
                <Header>
                    <Button asChild variant="outline">
                        <Link href="/sales-hub"><ArrowLeft /> Back to Sales Hub</Link>
                    </Button>
                     <Button asChild>
                        <Link href="/highfield-cpq"><PlusCircle /> New BMT Quote</Link>
                    </Button>
                </Header>
                <BmtQuotesPageContent />
            </div>
        </SidebarProvider>
    );
}
