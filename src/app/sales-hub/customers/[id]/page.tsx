
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getQuotes, getBmtQuotes, getUserProfile, getStaticLogo } from '@/lib/storage';
import type { Customer, Quote, BMTQuote, Boat, Motor, Trailer, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User, Ship, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getAuth, signOut } from 'firebase/auth';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { FileText } from 'lucide-react';


type AggregatedAsset<T> = T & { count: number };
type CombinedQuote = Quote | BMTQuote;

function CustomerDetailPageContent() {
    const params = useParams();
    const customerId = decodeURIComponent(params.id as string);
    
    const [quotes, setQuotes] = useState<CombinedQuote[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
            setIsLoading(true);
            Promise.all([getQuotes(), getBmtQuotes()])
                .then(([serviceQuotes, bmtQuotes]) => {
                    const allQuotes: CombinedQuote[] = [...serviceQuotes, ...bmtQuotes];
                    const filtered = allQuotes.filter(q => {
                        if (!q || !q.customer?.name) return false;
                        const sanitizedName = q.customer.name.toLowerCase().trim().replace(/\//g, '-');
                        const quoteCustomerId = `${sanitizedName}|${q.customer.phone || ''}`;
                        return quoteCustomerId === customerId;
                    });
                    setQuotes(filtered);
                })
                .catch(err => console.error("Failed to fetch quotes", err))
                .finally(() => setIsLoading(false));
    }, [customerId]);

    const customerDetails = useMemo<Customer | null>(() => {
        if (quotes.length === 0) return null;

        const allCustomerRecords = quotes.map(q => q.customer).filter((c): c is Customer => !!c);
        if(allCustomerRecords.length === 0) return null;

        const initialValue: Customer = { id: customerId, name: '', phone: '', email: '', address: { street: '', suburb: '', state: '', postcode: ''} };

        return allCustomerRecords.reduce((best, current) => {
            return {
                id: customerId,
                name: current.name || best.name,
                phone: current.phone || best.phone,
                email: current.email || best.email,
                address: {
                    street: current.address?.street || best.address?.street,
                    suburb: current.address?.suburb || best.address?.suburb,
                    state: current.address?.state || best.address?.state,
                    postcode: current.address?.postcode || best.address?.postcode,
                }
            }
        }, initialValue);
    }, [quotes, customerId]);


    const getFullAddress = (customer: Customer | null) => {
        if (!customer?.address) return null;
        const { street, suburb, state, postcode } = customer.address;
        if (!street && !suburb && !state && !postcode) return null;
        return [street, suburb, state, postcode].filter(Boolean).join(', ');
    };

    const { boats, motors, trailers } = useMemo(() => {
        const boatSet = new Set<string>();
        const motorMap = new Map<string, Motor & { count: number }>();
        const trailerSet = new Set<string>();

        quotes.forEach(quote => {
            if (!quote) return; 

            // Handle boat asset
            if ('operations' in quote && quote.boat && quote.boat.registration) { // Service Quote with valid boat
                boatSet.add(`${quote.boat.make || ''} ${quote.boat.model || ''} (${quote.boat.registration})`);
            } else if ('brandName' in quote && (quote as BMTQuote).brandName && (quote as BMTQuote).selectedModelId) { // BMT Quote
                 boatSet.add(`${(quote as BMTQuote).brandName} ${(quote as BMTQuote).selectedModelId}`);
            }

            // Handle motor assets
            if (quote && 'motors' in quote && Array.isArray(quote.motors)) {
                (quote.motors as Motor[]).forEach(motor => {
                    if (motor && motor.serial) { 
                        if (motorMap.has(motor.serial)) {
                            motorMap.get(motor.serial)!.count++;
                        } else {
                            motorMap.set(motor.serial, { ...motor, count: 1 });
                        }
                    }
                });
            }
            
            // Handle trailer asset
             if ('trailer' in quote && quote.trailer && (quote.trailer as Trailer).registration) {
                trailerSet.add(`${(quote.trailer as Trailer).make || ''} ${(quote.trailer as Trailer).model || ''} (${(quote.trailer as Trailer).registration})`);
            }
        });

        return {
            boats: Array.from(boatSet),
            motors: Array.from(motorMap.values()),
            trailers: Array.from(trailerSet),
        };
    }, [quotes]);


    if (isLoading) {
        return (
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <Skeleton className="h-16 w-1/2 mb-8" />
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-48 w-full md:col-span-1" />
                    <Skeleton className="h-64 w-full md:col-span-2" />
                </div>
            </main>
        )
    }

    if (!customerDetails) {
         return (
            <main className="flex-1 flex items-center justify-center text-center">
                <div>
                    <h1 className="text-2xl font-bold">Customer Not Found</h1>
                    <p className="text-muted-foreground">The customer you are looking for does not exist.</p>
                </div>
            </main>
        )
    }

    const getQuoteTitle = (quote: CombinedQuote) => {
        if (!quote) return "Invalid Quote";
        if ('operations' in quote) { // Service Quote
            return `Service Estimate: ${quote.boat?.make || ''} ${quote.boat?.model || ''}`;
        }
        return `BMT Quote: ${(quote as BMTQuote).brandName || ''} ${(quote as BMTQuote).selectedModelId || 'Draft'}`; // BMT Quote
    };

    const getQuoteLink = (quote: CombinedQuote) => {
        if (!quote) return "/sales-hub/customers";
        if ('operations' in quote) { // Service Quote
            return `/service-hub/estimates/${quote.id}`;
        }
        return `/highfield-cpq/summary/${quote.id}`; // BMT Quote
    };

    return (
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-muted/40">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User /> {customerDetails.name}</CardTitle>
                            <CardDescription>Contact Information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                            <p><strong>Phone:</strong> {customerDetails.phone || 'N/A'}</p>
                            <p><strong>Email:</strong> {customerDetails.email || 'N/A'}</p>
                            <p><strong>Address:</strong> {getFullAddress(customerDetails) || 'N/A'}</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Ship /> Assets</CardTitle>
                            <CardDescription>Boats, motors, and trailers associated with this customer.</CardDescription>
                        </CardHeader>
                         <CardContent className="space-y-4">
                            {boats.length > 0 && (
                                <div>
                                    <h4 className="font-semibold">Boats</h4>
                                    <Separator className="my-1"/>
                                    {boats.map((boatDesc, i) => <p key={i} className="text-sm">{boatDesc}</p>)}
                                </div>
                            )}
                            {motors.length > 0 && (
                                 <div>
                                    <h4 className="font-semibold">Motors</h4>
                                    <Separator className="my-1"/>
                                    {motors.map((motor, i) => <p key={i} className="text-sm">{motor.make} {motor.model} (S/N: {motor.serial})</p>)}
                                </div>
                            )}
                            {trailers.length > 0 && (
                                 <div>
                                    <h4 className="font-semibold">Trailers</h4>
                                    <Separator className="my-1"/>
                                    {trailers.map((trailerDesc, i) => <p key={i} className="text-sm">{trailerDesc}</p>)}
                                </div>
                            )}
                            {boats.length === 0 && motors.length === 0 && trailers.length === 0 && (
                                <p className="text-sm text-muted-foreground">No assets found.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FileText /> Quote History</CardTitle>
                            <CardDescription>All quotes created for {customerDetails.name}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {quotes.length > 0 ? (
                                <div className="space-y-4">
                                    {quotes.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(quote => {
                                        if(!quote) return null;
                                        return (
                                        <Link key={quote.id} href={getQuoteLink(quote)} className="block hover:bg-muted/50 p-3 rounded-lg border">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold">{getQuoteTitle(quote)}</p>
                                                    <p className="text-sm text-muted-foreground">{new Date(quote.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <Badge>{quote.status}</Badge>
                                            </div>
                                        </Link>
                                    )})}
                                </div>
                            ): (
                                <p className="text-sm text-muted-foreground">No quote history found.</p>
                            )}
                        </CardContent>
                     </Card>
                </div>
            </div>
        </main>
    );
}

export default function CustomerDetailPage() {
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
                        <Button asChild variant="outline"><Link href="/sales-hub/customers"><ArrowLeft /> Back to Customers</Link></Button>
                    </Header>
                     <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        <Skeleton className="h-16 w-1/2 mb-8" />
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Skeleton className="h-48 w-full md:col-span-1" />
                            <Skeleton className="h-64 w-full md:col-span-2" />
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
            <div className="flex flex-col h-screen bg-muted/40">
                 <Header>
                    <Button asChild variant="outline">
                        <Link href="/sales-hub/customers"><ArrowLeft/> Back to Customers</Link>
                    </Button>
                </Header>
                {currentUserProfile && (
                    <UserProfileDialog 
                        isOpen={isProfileDialogOpen}
                        setIsOpen={setIsProfileDialogOpen}
                        userProfile={currentUserProfile}
                        onSave={() => {}}
                    />
                )}
                <CustomerDetailPageContent />
            </div>
        </SidebarProvider>
    );
}

    
