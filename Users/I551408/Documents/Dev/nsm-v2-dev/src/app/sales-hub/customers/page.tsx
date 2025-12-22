
"use client";

import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Customer, Quote, UserProfile, QuoteStatus, Boat, Motor, Trailer, BMTQuote } from '@/lib/types';
import { getQuotes, deleteCustomerAndQuotes, getUserProfile, getStaticLogo, getBmtQuotes } from '@/lib/storage';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, LayoutGrid, List, MoreVertical, Trash2, ArrowUp, ArrowDown, Ship, FileText, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { useCrmSync } from '@/hooks/use-crm-sync';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CustomerCard } from '@/components/customers/CustomerCard';

type SortableKey = 'name' | 'quoteCount' | 'lastActivity';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortableKey;
  direction: SortDirection;
}

const getCustomerId = (customer: { name: string; phone?: string | null }): string => {
    const sanitizedName = customer.name.toLowerCase().trim().replace(/\//g, '-');
    return `${sanitizedName}|${customer.phone || ''}`;
};


const getFullAddress = (customer: Customer | null) => {
    if (!customer?.address) return null;
    const { street, suburb, state, postcode } = customer.address;
    if (!street && !suburb && !state && !postcode) return null;
    return [street, suburb, state, postcode].filter(Boolean).join(', ');
};

const AttributeDisplay = ({
    icon: Icon,
    count,
    tooltipContent,
    dialogTitle,
    dialogDescription,
    children
}: {
    icon: React.ElementType;
    count: number;
    tooltipContent: string;
    dialogTitle: string;
    dialogDescription: string;
    children: React.ReactNode;
}) => {
    if (count === 0) {
        return (
            <div className="flex items-center gap-1 text-muted-foreground/50">
                <Icon className="h-4 w-4" />
                <span className="font-medium">{count}</span>
            </div>
        )
    }

    return (
        <Dialog>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <DialogTrigger asChild>
                            <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                                <Icon className="h-4 w-4" />
                                <span className="font-medium">{count}</span>
                            </div>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{tooltipContent}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <DialogContent className="max-w-lg p-0">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle>{dialogTitle}</DialogTitle>
                    <DialogDescription>{dialogDescription}</DialogDescription>
                </DialogHeader>
                <div className="px-6 pb-6">
                    <ScrollArea className="max-h-[60vh]">
                        {children}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
};


function CustomerHubPageContent() {
    const [quotes, setQuotes] = useState<(Quote | BMTQuote)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const { contacts: crmContacts, isSyncing } = useCrmSync();
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'lastActivity', direction: 'descending' });
    const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'All'>('All');

    const calculateQuoteTotal = (quote: Quote | BMTQuote) => {
        if (!quote) return 0;
        if ('operations' in quote && quote.operations) { // It's a Service Quote
            const subTotal = (quote.operations || []).reduce((acc, op) => {
                const laborCost = (op.laborRate || 0) * (op.laborHours || 0);
                const partsCost = (op.parts || []).reduce((pAcc, part) => pAcc + ((part.cost || 0) * (part.quantity || 1)), 0);
                return acc + laborCost + partsCost;
            }, 0);
            return subTotal * 1.10; // Add 10% GST
        } else if ('brandName' in quote) { // It's a BMT Quote
             if (!quote.pricing) return 0; // Guard against null pricing
            const { hullPrice = 0, consolePrice = 0, motorPrice = 0, propellerPrice = 0, riggingKitPrice = 0, trailerPrice = 0 } = quote.pricing;
            let subtotal = hullPrice + consolePrice + motorPrice + propellerPrice + riggingKitPrice + trailerPrice;
            if (quote.hullIncludesRegistration) subtotal += (200 / 1.1);
            return subtotal * 1.1;
        }
        return 0;
    };

    const formatCurrency = (value: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);


    const fetchData = async () => {
        if (user) {
            setIsLoading(true);
            try {
                const [serviceQuotes, bmtQuotes] = await Promise.all([
                    getQuotes(),
                    getBmtQuotes(),
                ]);
                setQuotes([...serviceQuotes, ...bmtQuotes]);
            } catch (error) {
                console.error("Failed to load customer data:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleDeleteCustomer = async (customerId: string) => {
        try {
            await deleteCustomerAndQuotes(customerId);
            toast({
                title: "Customer Deleted",
                description: "The customer and all their associated quotes have been deleted."
            });
            window.location.reload();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Deletion Failed",
                description: "Could not delete the customer. Please try again."
            });
        }
    }
    
    const requestSort = (key: SortableKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const getSortIndicator = (key: SortableKey) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
    };
    
    const statusCounts = useMemo(() => {
        const counts: Record<QuoteStatus | 'Draft' | 'Archived' | 'All', { count: number; totalValue: number }> = {
            'All': { count: 0, totalValue: 0 },
            'Work In Progress': { count: 0, totalValue: 0 },
            'Estimate': { count: 0, totalValue: 0 },
            'Pending': { count: 0, totalValue: 0 },
            'Approved': { count: 0, totalValue: 0 },
            'Complete': { count: 0, totalValue: 0 },
            'Cancelled': { count: 0, totalValue: 0 },
            'Deleted': { count: 0, totalValue: 0 },
            'Draft': { count: 0, totalValue: 0 },
            'Archived': { count: 0, totalValue: 0 }
        };
        
        quotes.forEach(q => {
            if (!q) return;
            const quoteTotal = calculateQuoteTotal(q);
            counts['All'].count++;
            counts['All'].totalValue += quoteTotal;

            const status = q.status as keyof typeof counts;
            if (counts[status] !== undefined) {
                counts[status].count++;
                counts[status].totalValue += quoteTotal;
            }
        });

        return counts;
    }, [quotes]);


    const sortedAndFilteredCustomers = useMemo(() => {
        const customerMap = new Map<string, Customer>();

        // 1. Process customers from local quotes
        quotes.forEach(quote => {
            if (!quote || !quote.customer || !quote.customer.name) return;
            const key = getCustomerId(quote.customer);
            if (!customerMap.has(key)) {
                customerMap.set(key, { ...quote.customer, id: key });
            }
        });

        // 2. Process and merge customers from CRM
        crmContacts.forEach(crmContact => {
            if (crmContact && crmContact.fullname) {
                const key = getCustomerId({ name: crmContact.fullname, phone: crmContact.telephone1 });
                const existingCustomer = customerMap.get(key);

                const crmCustomerData = {
                    id: key,
                    name: crmContact.fullname,
                    phone: crmContact.telephone1,
                    email: crmContact.emailaddress1,
                    address: existingCustomer?.address,
                };
                customerMap.set(key, { ...(existingCustomer || {}), ...crmCustomerData });
            }
        });
        
        let sortableItems = Array.from(customerMap.values());
        
        const customerDataMap = quotes.reduce((acc, quote) => {
            if (!quote || !quote.customer || !quote.customer.name) return acc;
            const key = getCustomerId(quote.customer);
            const existing = acc.get(key) || { quoteCount: 0, lastActivity: 0, assetCount: new Set<string>(), quotes: [] as (Quote | BMTQuote)[] };

            const assetIdentifiers = new Set<string>();
            
            if ('operations' in quote && quote.boat && quote.boat.registration) {
                assetIdentifiers.add(quote.boat.registration);
            } else if ('brandName' in quote) {
                const bmtQuote = quote as BMTQuote;
                if (bmtQuote.brandName && bmtQuote.selectedModelId) {
                    assetIdentifiers.add(`${bmtQuote.brandName} ${bmtQuote.selectedModelId}`);
                }
            }
            
            assetIdentifiers.forEach(id => existing.assetCount.add(id));


            acc.set(key, {
                quoteCount: existing.quoteCount + 1,
                lastActivity: Math.max(existing.lastActivity, new Date(quote.createdAt).getTime()),
                assetCount: existing.assetCount,
                quotes: [...existing.quotes, quote]
            });
            return acc;
        }, new Map<string, { quoteCount: number, lastActivity: number, assetCount: Set<string>, quotes: (Quote | BMTQuote)[] }>());

        sortableItems = sortableItems.map(c => ({
            ...c,
            quoteCount: customerDataMap.get(c.id!)?.quoteCount || 0,
            assetCount: customerDataMap.get(c.id!)?.assetCount.size || 0,
            lastActivity: customerDataMap.get(c.id!)?.lastActivity || 0,
            quotes: customerDataMap.get(c.id!)?.quotes || []
        }));
        
        // Status Filtering
        if (statusFilter !== 'All') {
            const customerIdsWithStatus = new Set(
                quotes
                    .filter(q => q && q.status === statusFilter)
                    .map(q => q?.customer ? getCustomerId(q.customer) : '')
            );
            sortableItems = sortableItems.filter(c => customerIdsWithStatus.has(c.id!));
        }


        // Sorting
        sortableItems.sort((a, b) => {
            let aValue, bValue;
            
            if (sortConfig.key === 'name') {
                aValue = a.name;
                bValue = b.name;
            } else if (sortConfig.key === 'quoteCount') {
                aValue = (a as any).quoteCount;
                bValue = (b as any).quoteCount;
            } else { // lastActivity
                aValue = (a as any).lastActivity;
                bValue = (b as any).lastActivity;
            }


            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });

        // Search Filtering
        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            sortableItems = sortableItems.filter(customer => {
                const searchInString = (value: string | undefined | null) => value && value.toLowerCase().includes(lowercasedFilter);

                return (
                    searchInString(customer.name) ||
                    searchInString(customer.phone) ||
                    searchInString(customer.email) ||
                    searchInString(customer.address?.street) ||
                    searchInString(customer.address?.suburb)
                );
            });
        }
        
        return sortableItems;
    }, [quotes, crmContacts, searchTerm, sortConfig, statusFilter]);

    if (isLoading && !isSyncing) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
            </div>
        )
    }

    return (
        <>
            <div className="mb-8 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-headline font-bold">Customer Hub</h1>
                        <p className="text-muted-foreground">Browse and manage all customer profiles.</p>
                    </div>
                        <Button onClick={() => setViewMode(viewMode === 'card' ? 'table' : 'card')} variant="outline">
                        {viewMode === 'card' ? <List className="mr-2" /> : <LayoutGrid className="mr-2" />}
                        {viewMode === 'card' ? 'Table View' : 'Card View'}
                    </Button>
                </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name, phone, email, or address..."
                            className="pl-10 h-12 w-full text-base md:text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                        <div>
                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as QuoteStatus | 'All')}>
                            <SelectTrigger className="h-12 text-base md:text-sm">
                                <SelectValue placeholder="Filter by quote status" />
                            </SelectTrigger>
                            <SelectContent>
                                {(Object.keys(statusCounts) as Array<keyof typeof statusCounts>).map(status => (
                                    status !== 'Deleted' && (
                                        <SelectItem key={status} value={status}>
                                            <div className="flex justify-between w-full items-center">
                                                <span>{status} ({statusCounts[status].count})</span>
                                                <span className="text-muted-foreground ml-4">{formatCurrency(statusCounts[status].totalValue)}</span>
                                            </div>
                                        </SelectItem>
                                    )
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <Skeleton className="h-96 w-full" />
            ) : sortedAndFilteredCustomers.length === 0 ? (
                <div className="text-center py-16">
                    <h2 className="text-2xl font-semibold">No customers found</h2>
                    <p className="text-muted-foreground mt-2">
                        {searchTerm || statusFilter !== 'All' ? 'Try adjusting your search or filters.' : 'Create a new quote to add a customer.'}
                    </p>
                </div>
            ) : viewMode === 'card' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedAndFilteredCustomers.map(customer => (
                         <CustomerCard
                            key={customer.id}
                            customer={customer as Customer & { quoteCount?: number, lastActivity?: number, assetCount: number }}
                            onDeleteCustomer={handleDeleteCustomer}
                        />
                    ))}
                </div>
            ) : (
                <div className="border rounded-lg bg-card text-card-foreground">
                    <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => requestSort('name')} className="px-0">
                                        Customer {getSortIndicator('name')}
                                    </Button>
                                </TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead className="text-center">
                                    <Button variant="ghost" onClick={() => requestSort('quoteCount')} className="px-0">
                                        Attributes {getSortIndicator('quoteCount')}
                                    </Button>
                                </TableHead>
                                <TableHead>
                                        <Button variant="ghost" onClick={() => requestSort('lastActivity')} className="px-0">
                                        Last Activity {getSortIndicator('lastActivity')}
                                    </Button>
                                </TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedAndFilteredCustomers.map(customer => {
                                const customerQuotes = (customer as any).quotes || [];
                                const quoteCount = (customer as any).quoteCount || 0;
                                const lastActivity = (customer as any).lastActivity || 0;
                                const assetCount = (customer as any).assetCount || 0;

                                const uniqueAssets: string[] = [];
                                const assetSet = new Set<string>();
                                customerQuotes.forEach((quote: Quote | BMTQuote) => {
                                    if (!quote) return;
                                    let assetIdentifier: string | undefined;

                                    if ('operations' in quote && quote.boat?.registration) {
                                        assetIdentifier = `${quote.boat.make || ''} ${quote.boat.model || ''} (${quote.boat.registration})`.trim();
                                    } else if ('brandName' in quote && quote.brandName && quote.selectedModelId) {
                                        assetIdentifier = `${quote.brandName} ${quote.selectedModelId}`;
                                    }
                                    if (assetIdentifier && !assetSet.has(assetIdentifier)) {
                                        assetSet.add(assetIdentifier);
                                        uniqueAssets.push(assetIdentifier);
                                    }
                                });


                                return (
                                    <TableRow key={customer.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/sales-hub/customers/${encodeURIComponent(customer.id!)}`} className="hover:underline text-primary">
                                                {customer.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm">{customer.phone || 'N/A'}</p>
                                            <p className="text-xs text-muted-foreground">{customer.email || 'N/A'}</p>
                                        </TableCell>
                                        <TableCell>{getFullAddress(customer) || 'N/A'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-4 text-sm">
                                                <AttributeDisplay
                                                    icon={FileText}
                                                    count={quoteCount}
                                                    tooltipContent={`${quoteCount} quote(s)`}
                                                    dialogTitle={`Quotes for ${customer.name}`}
                                                    dialogDescription="A list of all quotes associated with this customer."
                                                >
                                                     <div className="space-y-2">
                                                        {customerQuotes.map((quote: Quote | BMTQuote) => {
                                                            if (!quote || !quote.id) return null;
                                                            return (
                                                                <Link key={quote.id} href={'operations' in quote ? `/service-hub/estimates/${quote.id}` : `/highfield-cpq/summary/${quote.id}`} className="block hover:bg-muted/50 p-3 rounded-lg border">
                                                                    <div className="flex justify-between items-center gap-4">
                                                                        <div className="flex-1">
                                                                            <p className="font-semibold truncate">{'operations' in quote ? `${quote.boat?.make || ''} ${quote.boat?.model || ''}` : `${quote.brandName || ''} ${quote.selectedModelId || 'Draft'}`}</p>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                Created by {quote.user?.name || 'N/A'} on {new Date(quote.createdAt).toLocaleDateString()}
                                                                            </p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <Badge>{quote.status}</Badge>
                                                                            <p className="font-semibold text-primary mt-1">{formatCurrency(calculateQuoteTotal(quote))}</p>
                                                                        </div>
                                                                    </div>
                                                                </Link>
                                                            )
                                                        })}
                                                    </div>
                                                </AttributeDisplay>
                                                <AttributeDisplay
                                                    icon={Ship}
                                                    count={assetCount}
                                                    tooltipContent={`${assetCount} asset(s)`}
                                                    dialogTitle={`Assets for ${customer.name}`}
                                                    dialogDescription="A list of all unique assets associated with this customer."
                                                >
                                                     <div className="space-y-2">
                                                        {uniqueAssets.length > 0 ? (
                                                            uniqueAssets.map((assetName, index) => (
                                                                <div key={index} className="p-3 rounded-lg border">
                                                                    <p className="font-semibold">{assetName}</p>
                                                                </div>
                                                            ))
                                                        ) : (<p>No assets found.</p>)}
                                                    </div>
                                                </AttributeDisplay>
                                            </div>
                                        </TableCell>
                                        <TableCell>{lastActivity > 0 ? new Date(lastActivity).toLocaleDateString() : 'N/A'}</TableCell>
                                        <TableCell>
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/sales-hub/customers/${encodeURIComponent(customer.id!)}`}>View Profile</Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                                <AlertDialogTrigger className="w-full text-left"><Trash2 className="mr-2 h-4 w-4"/>Delete</AlertDialogTrigger>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                    <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the customer "{customer.name}" and all of their associated quotes ({quoteCount} quotes).
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteCustomer(customer.id!)}>Yes, delete customer</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </>
    )
}

export default function CustomerHubPage() {
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
                        <Button asChild variant="outline"><Link href="/sales-hub"><ArrowLeft/> Back to Sales Hub</Link></Button>
                    </Header>
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
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
            <div className="flex flex-col h-screen bg-muted/40">
                <Header>
                    <Button asChild variant="outline">
                        <Link href="/sales-hub"><ArrowLeft/> Back to Sales Hub</Link>
                    </Button>
                </Header>
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                   <CustomerHubPageContent />
                </main>
            </div>
        </SidebarProvider>
    )
}

    