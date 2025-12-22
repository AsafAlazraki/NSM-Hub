
"use client";

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, ShoppingCart, ArrowRight, FileText } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { getAuth, signOut } from 'firebase/auth';
import { getUserProfile, getStaticLogo, getBmtQuotes } from '@/lib/storage';
import type { UserProfile, BMTQuote } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function SalesPipelineChart({ quotes }: { quotes: BMTQuote[] }) {
    const data = [
        { name: 'Draft', count: quotes.filter(q => q.status === 'Draft').length, fill: 'hsl(var(--chart-1))' },
        { name: 'Completed', count: quotes.filter(q => q.status === 'Completed').length, fill: 'hsl(var(--chart-2))' },
        { name: 'Archived', count: quotes.filter(q => q.status === 'Archived').length, fill: 'hsl(var(--chart-3))' },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sales Pipeline</CardTitle>
                <CardDescription>Overview of all BMT quotes by status.</CardDescription>
            </CardHeader>
            <CardContent>
                {quotes.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                                cursor={{ fill: 'hsl(var(--accent))', opacity: 0.5 }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        <p>No sales data yet to display.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


function SalesHubPageContent() {
    const [quotes, setQuotes] = useState<BMTQuote[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getBmtQuotes().then(data => {
            setQuotes(data);
            setIsLoading(false);
        });
    }, []);

    if (isLoading) {
        return (
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                 <div className="mb-8 space-y-4">
                    <h1 className="text-3xl font-headline font-bold">Sales Hub</h1>
                    <p className="text-muted-foreground">
                        This is the central hub for all sales activities.
                    </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-96 w-full lg:col-span-2" />
                    <div className="space-y-6">
                        <Skeleton className="h-44 w-full" />
                        <Skeleton className="h-44 w-full" />
                        <Skeleton className="h-44 w-full" />
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8 space-y-4">
                <h1 className="text-3xl font-headline font-bold">Sales Hub</h1>
                <p className="text-muted-foreground">
                    This is the central hub for all sales activities.
                </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <SalesPipelineChart quotes={quotes} />
                </div>
                <div className="space-y-6">
                    <Link href="/sales-hub/quotes" className="block">
                        <Card className="hover:shadow-lg hover:border-primary transition-all h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                                    <FileText /> BMT Quotes
                                </CardTitle>
                                <CardDescription>
                                    View and manage all boat, motor, and trailer quotes.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline">
                                    Manage Quotes <ArrowRight className="ml-2"/>
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>
                     <Link href="/sales-hub/customers" className="block">
                        <Card className="hover:shadow-lg hover:border-primary transition-all h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                                    <Users /> Customers
                                </CardTitle>
                                <CardDescription>
                                    Browse and manage all customer profiles.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline">
                                    Manage Customers <ArrowRight className="ml-2"/>
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/highfield-cpq" className="block">
                        <Card className="hover:shadow-lg hover:border-primary transition-all h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                                    <ShoppingCart /> Configure, Price, Quote
                                </CardTitle>
                                <CardDescription>
                                    Configure, price, and quote new boat packages.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline">
                                    Go to CPQ <ArrowRight className="ml-2"/>
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        </main>
    );
}

export default function SalesHubPage() {
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
                        <Link href="/"><ArrowLeft /> Back to Home</Link>
                    </Button>
                </Header>
                <SalesHubPageContent />
            </div>
        </SidebarProvider>
    );
}
