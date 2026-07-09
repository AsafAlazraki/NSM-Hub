
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { 
    getBmtQuoteById, 
    getQuotes, 
    getBoatModelById, 
    getCatalogueMotors, 
    getRiggingKits, 
    getCatalogueTrailers, 
    getCatalogueFactoryOptions, 
    getDealerFitParts,
    saveBmtQuote,
    getUserProfile, 
    getStaticLogo,
    getBmtQuotes,
} from '@/lib/storage';
import type { BMTQuote, Customer, Quote, BoatModel, CatalogueMotor, RiggingKit, CatalogueTrailer, FactoryOption, DealerFitPart, KeyDocument, UserProfile, Propeller } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Edit, User, Printer, Ship, Settings, CheckSquare, FileText } from 'lucide-react';
import { ConfigurationStepper } from '@/components/highfield-cpq/ConfigurationStepper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { SummaryItem } from '@/components/highfield-cpq/SummaryItem';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getAuth, signOut } from 'firebase/auth';
import { UserProfileDialog } from '@/components/UserProfileDialog';


const aggregateCustomers = (quotes: (Quote | BMTQuote)[]): Customer[] => {
    const customerMap = new Map<string, Customer>();
    quotes.forEach(quote => {
        if (quote?.customer?.name) {
            const sanitizedName = quote.customer.name.toLowerCase().trim().replace(/\//g, '-');
            const key = `${sanitizedName}|${quote.customer.phone || ''}`;
            if (!customerMap.has(key)) {
                customerMap.set(key, { ...quote.customer, id: key });
            }
        }
    });
    return Array.from(customerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};

const customerSchema = z.object({
  name: z.string().min(1, 'Full name is required.'),
  address: z.string().optional(),
  phone: z.string().min(1, 'Mobile number is required.'),
  email: z.string().email('Invalid email address.').min(1, 'Email address is required.'),
});
type CustomerFormValues = z.infer<typeof customerSchema>;

const formatCurrency = (value: number) => {
    if (isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
};


const CustomerDialog = ({ bmtQuote, setBmtQuote }: { bmtQuote: BMTQuote, setBmtQuote: React.Dispatch<React.SetStateAction<BMTQuote | null>>}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [existingCustomers, setExistingCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const methods = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            name: bmtQuote.customer?.name || '',
            phone: bmtQuote.customer?.phone || '',
            email: bmtQuote.customer?.email || '',
        },
    });

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
             Promise.all([getQuotes(), getBmtQuotes()]).then(([serviceQuotes, bmtQuotes]) => {
                setExistingCustomers(aggregateCustomers([...serviceQuotes, ...bmtQuotes]));
                setIsLoading(false);
            });
        }
    }, [isOpen]);

    const handleCustomerSelect = (customer: Customer) => {
        methods.reset({
            name: customer.name,
            phone: customer.phone || '',
            email: customer.email || '',
        });
        setIsPopoverOpen(false);
    };

    const onSubmit = (data: CustomerFormValues) => {
        const updatedQuote: BMTQuote = {
            ...bmtQuote,
            customer: {
                ...bmtQuote.customer,
                name: data.name,
                phone: data.phone,
                email: data.email,
            } as Customer,
        };
        setBmtQuote(updatedQuote);
        saveBmtQuote(updatedQuote);
        toast({ title: 'Customer Updated' });
        setIsOpen(false);
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit Customer</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Assign Customer</DialogTitle>
                    <DialogDescription>Select an existing customer or create a new one.</DialogDescription>
                </DialogHeader>
                 <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isPopoverOpen}
                        className="w-full justify-between"
                        disabled={isLoading}
                    >
                        {isLoading ? "Loading customers..." : (bmtQuote.customer?.name || "Select existing customer...")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Search customers..." />
                        <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                            {existingCustomers.map((customer) => (
                            <CommandItem
                                key={customer.id}
                                value={customer.name}
                                onSelect={() => handleCustomerSelect(customer)}
                            >
                                <Check
                                className={cn('mr-2 h-4 w-4', bmtQuote.customer?.name === customer.name ? 'opacity-100' : 'opacity-0')}
                                />
                                {customer.name}
                            </CommandItem>
                            ))}
                        </CommandGroup>
                        </CommandList>
                    </Command>
                    </PopoverContent>
                </Popover>

                <div className="flex items-center">
                    <Separator className="flex-1" />
                    <span className="px-4 text-sm text-muted-foreground">OR</span>
                    <Separator className="flex-1" />
                </div>
                
                <FormProvider {...methods}>
                    <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={methods.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={methods.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={methods.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Save Customer</Button>
                        </DialogFooter>
                    </form>
                </FormProvider>
            </DialogContent>
        </Dialog>
    );
};

function BmtQuoteSummaryPageContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const [bmtQuote, setBmtQuote] = useState<BMTQuote | null>(null);
    const [catalogueData, setCatalogueData] = useState<{
        model: BoatModel | null;
        motors: CatalogueMotor[];
        riggingKits: RiggingKit[];
        trailers: CatalogueTrailer[];
        factoryOptions: FactoryOption[];
        dealerFitParts: DealerFitPart[];
    }>({ model: null, motors: [], riggingKits: [], trailers: [], factoryOptions: [], dealerFitParts: [] });

    const [isLoading, setIsLoading] = useState(true);

    const quoteId = params.quoteId as string;
    
    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    useEffect(() => {
        if (quoteId) {
            setIsLoading(true);
            const fetchAllData = async () => {
                try {
                    const quoteData = await getBmtQuoteById(quoteId);
                    if (!quoteData) {
                        setBmtQuote(null);
                        setIsLoading(false);
                        return;
                    }
                    setBmtQuote(quoteData);

                    const [
                        model,
                        motors,
                        riggingKits,
                        trailers,
                        factoryOptions,
                        dealerFitParts
                    ] = await Promise.all([
                        quoteData.selectedModelId ? getBoatModelById(quoteData.selectedModelId) : Promise.resolve(null),
                        getCatalogueMotors(),
                        getRiggingKits(),
                        getCatalogueTrailers(),
                        getCatalogueFactoryOptions(),
                        getDealerFitParts()
                    ]);
                    setCatalogueData({ model, motors, riggingKits, trailers, factoryOptions, dealerFitParts });

                } catch (e) {
                    console.error("Failed to load summary data", e);
                } finally {
                    setIsLoading(false);
                }
            }
            fetchAllData();
        }
    }, [quoteId]);

    const {
        selectedHull,
        selectedConsole,
        selectedMotor,
        propeller,
        selectedRiggingKit,
        selectedTrailer,
        hullFactoryOptions,
        motorFactoryOptions,
        trailerFactoryOptions,
        selectedDealerFitOptions,
        totalPrice,
        subtotal,
        gst,
        selectedColor
    } = useMemo(() => {
        if (!bmtQuote || !catalogueData.model) return { totalPrice: 0, subtotal: 0, gst: 0, selectedHull: null, selectedConsole: null, selectedMotor: null, propeller: null, selectedRiggingKit: null, selectedTrailer: null, hullFactoryOptions: [], motorFactoryOptions: [], trailerFactoryOptions: [], selectedDealerFitOptions: [], selectedColor: null };
        
        const { model, motors, riggingKits, trailers, factoryOptions, dealerFitParts } = catalogueData;

        const selectedColor = model.colors?.find(c => c.name === bmtQuote.selectedColorName);
        const hullPricing = model.pricing?.find(p => p.material === bmtQuote.selectedMaterial && p.color === bmtQuote.selectedColorName);
        const hullPrice = hullPricing?.price || 0;
        const selectedHull = { name: `${bmtQuote.selectedMaterial} ${model.name}`, price: hullPrice, includesGst: hullPricing?.includesGst || false, imageUrl: selectedColor?.images?.[0]?.url };
        
        const selectedConsole = model.consoleOptions?.find(opt => opt.name === bmtQuote.selectedConsoleName);
        const selectedMotor = motors.find(m => m.id === bmtQuote.selectedMotorId);
        
        let propeller: Propeller | { name: 'N/A' } | null = null;
        if (bmtQuote.selectedPropellerId === 'N/A') {
            propeller = { name: 'N/A' };
        } else if (selectedMotor?.propellers) {
            propeller = selectedMotor.propellers.find(p => p.id === bmtQuote.selectedPropellerId) || null;
        }

        const selectedRiggingKit = riggingKits.find(kit => kit.id === bmtQuote.selectedRiggingKitId);
        const selectedTrailer = trailers.find(t => t.id === bmtQuote.selectedTrailerId);
        const allSelectedFactoryOptions = factoryOptions.filter(opt => bmtQuote.selectedFactoryOptionIds?.includes(opt.id!));
        
        const hullFactoryOptions = allSelectedFactoryOptions.filter(opt => opt.tag === 'Boat');
        const motorFactoryOptions = allSelectedFactoryOptions.filter(opt => opt.tag === 'Motor');
        const trailerFactoryOptions = allSelectedFactoryOptions.filter(opt => opt.tag === 'Trailer');
        
        const selectedDealerFitOptions = dealerFitParts.filter(part => bmtQuote.selectedDealerFitOptionIds?.includes(part.id!));
        
        let subtotal = 0;
        const addToSubtotal = (price: number = 0, includesGst: boolean = false) => {
            subtotal += includesGst ? (price / 1.1) : price;
        };
        
        const consolePrice = bmtQuote.pricing?.consolePrice || 0;
        addToSubtotal(consolePrice, true);

        if (selectedHull) addToSubtotal(selectedHull?.price, selectedHull?.includesGst);
        if (selectedMotor) addToSubtotal(selectedMotor.sellPrice, true);

        if (propeller && typeof propeller === 'object' && 'sellPrice' in propeller) {
            addToSubtotal(propeller.sellPrice, true);
        }

        if(selectedRiggingKit) addToSubtotal(selectedRiggingKit.sellPrice, true);
        if(selectedTrailer) addToSubtotal(selectedTrailer.price, true);
        allSelectedFactoryOptions.forEach(opt => addToSubtotal(opt.sellPrice, true));
        selectedDealerFitOptions.forEach(part => addToSubtotal(part.sellPrice, true));

        if (bmtQuote.hullIncludesRegistration) subtotal += (200 / 1.1);

        const gst = subtotal * 0.1;
        const totalPrice = subtotal + gst;

        return {
            selectedHull,
            selectedConsole,
            selectedMotor,
            propeller,
            selectedRiggingKit,
            selectedTrailer,
            hullFactoryOptions,
            motorFactoryOptions,
            trailerFactoryOptions,
            selectedDealerFitOptions,
            totalPrice,
            subtotal,
            gst,
            selectedColor
        };
    }, [bmtQuote, catalogueData]);
    

    const handleFinalize = () => {
        if (!bmtQuote) return;
        // 'Completed' is not part of the BMTQuoteStatus union in lib/types.ts;
        // cast preserves the existing persisted value without changing runtime.
        const updatedQuote: BMTQuote = { ...bmtQuote, status: 'Completed' as BMTQuote['status'] };
        setBmtQuote(updatedQuote);
        saveBmtQuote(updatedQuote);
        router.push(`/sales-hub/quotes`);
    };

    if (isLoading || authLoading || !bmtQuote) {
        return <div className="flex flex-col h-screen"><Header /><main className="flex-1 p-8"><Skeleton className="h-full w-full" /></main></div>;
    }

    const { brandId, selectedModelId } = bmtQuote;
    const editUrl = `/highfield-cpq/configure/${brandId}/${selectedModelId}?quoteId=${quoteId}&from=/sales-hub/quotes/${quoteId}`;


    return (
        <div className="flex flex-col h-screen">
            <Header>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                        <Link href="/sales-hub/quotes">
                            <ArrowLeft /> Back to Quotes
                        </Link>
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="secondary">
                        <Link href={editUrl}><Edit/>Edit Quote</Link>
                    </Button>
                    <Button variant="secondary" asChild>
                      <Link href={`/highfield-cpq/summary/${quoteId}/print`}><Printer /> Generate PDF</Link>
                    </Button>
                    <Button onClick={handleFinalize}>Finalize Quote</Button>
                </div>
            </Header>
             <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card>
                             <CardHeader className="flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2 font-headline text-xl"><User/>Customer Details</CardTitle>
                                <CustomerDialog bmtQuote={bmtQuote} setBmtQuote={setBmtQuote} />
                            </CardHeader>
                            <CardContent>
                                {bmtQuote.customer?.name ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><p className="font-semibold">{bmtQuote.customer.name}</p></div>
                                        <div><p>{bmtQuote.customer.phone}</p></div>
                                        <div className="col-span-2"><p>{bmtQuote.customer.email}</p></div>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">No customer assigned.</p>
                                )}
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle className="font-headline text-xl">Package Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {selectedHull && <SummaryItem icon={Ship} label="Hull" value={`${selectedHull.name} (${bmtQuote.selectedColorName})`} price={selectedHull.price} includesGst={selectedHull.includesGst} imageUrl={selectedHull.imageUrl} />}
                                {bmtQuote.hullIncludesPreDelivery && <SummaryItem label="Hull Pre-Delivery" value="Included" isSubItem />}
                                {bmtQuote.hullIncludesRegistration && <SummaryItem label="Hull Registration" value="12 Months" price={200} includesGst={true} isSubItem />}
                                {selectedConsole && <SummaryItem label="Console" value={selectedConsole.name} price={selectedConsole.price} includesGst={true} isSubItem />}
                                
                                {selectedMotor && <><Separator /><SummaryItem icon={Settings} label="Motor" value={selectedMotor?.name} price={selectedMotor?.sellPrice} includesGst={true} imageUrl={selectedMotor?.imageUrl}/></>}
                                {propeller && propeller.name !== 'N/A' && <SummaryItem label="Propeller" value={(propeller as Propeller)?.name} price={(propeller as Propeller)?.sellPrice} includesGst={true} isSubItem imageUrl={(propeller as Propeller)?.imageUrl} />}
                                {bmtQuote.motorIncludesPreDelivery && <SummaryItem label="Motor Pre-Delivery & Install" value="Included" isSubItem />}

                                {selectedRiggingKit && <><Separator /><SummaryItem icon={Settings} label="Rigging Kit" value={selectedRiggingKit.name} price={selectedRiggingKit.sellPrice} includesGst={true} imageUrl={selectedRiggingKit.imageUrl}/></>}
                                {bmtQuote.riggingIncludesInstallation && <SummaryItem label="Rigging Installation" value="Included" isSubItem />}
                                
                                {selectedTrailer && <><Separator /><SummaryItem icon={Ship} label="Trailer" value={selectedTrailer?.name} price={selectedTrailer?.price} includesGst={true} imageUrl={selectedTrailer?.imageUrl}/></>}
                                {bmtQuote.trailerIncludesPreDelivery && <SummaryItem label="Trailer Pre-Delivery" value="Included" isSubItem />}
                                {bmtQuote.trailerIncludesRegistration && <SummaryItem label="Trailer Registration" value="Included" isSubItem />}

                                {hullFactoryOptions.length > 0 && <Separator/>}
                                {hullFactoryOptions.length > 0 && <h4 className="font-semibold flex items-center gap-2 pt-2"><Settings/> Hull Options</h4>}
                                {hullFactoryOptions.map(opt => <SummaryItem key={opt.id} label={opt.name} price={opt.sellPrice} includesGst={true} isSubItem imageUrl={opt.imageUrl} />)}
                                
                                {motorFactoryOptions.length > 0 && <Separator/>}
                                {motorFactoryOptions.length > 0 && <h4 className="font-semibold flex items-center gap-2 pt-2"><Settings/> Motor Options</h4>}
                                {motorFactoryOptions.map(opt => <SummaryItem key={opt.id} label={opt.name} price={opt.sellPrice} includesGst={true} isSubItem imageUrl={opt.imageUrl} />)}
                                
                                {trailerFactoryOptions.length > 0 && <Separator/>}
                                {trailerFactoryOptions.length > 0 && <h4 className="font-semibold flex items-center gap-2 pt-2"><Settings/> Trailer Options</h4>}
                                {trailerFactoryOptions.map(opt => <SummaryItem key={opt.id} label={opt.name} price={opt.sellPrice} includesGst={true} isSubItem imageUrl={opt.imageUrl} />)}

                                {selectedDealerFitOptions.length > 0 && <Separator/>}
                                {selectedDealerFitOptions.length > 0 && <h4 className="font-semibold flex items-center gap-2 pt-2"><CheckSquare/> Dealer Fit Options</h4>}
                                {selectedDealerFitOptions.map(opt => <SummaryItem key={opt.id} label={opt.name} price={opt.sellPrice} includesGst={true} isSubItem imageUrl={opt.imageUrl} />)}

                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-1 space-y-8">
                         <Card>
                            <CardHeader>
                                <CardTitle className="font-headline text-xl">Pricing</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                 <div className="flex justify-between items-center text-lg">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between items-center text-lg">
                                    <span>GST</span>
                                    <span>{formatCurrency(gst)}</span>
                                </div>
                                <Separator className="my-2"/>
                                <div className="flex justify-between items-center text-2xl font-bold text-primary">
                                    <span>Total</span>
                                    <span>{formatCurrency(totalPrice)}</span>
                                </div>
                            </CardContent>
                        </Card>
                         {catalogueData.model?.keyDocuments && catalogueData.model.keyDocuments.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Key Documents</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-2">
                                    {catalogueData.model.keyDocuments.map((doc: KeyDocument) => (
                                        <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="block group">
                                            <Card className="hover:border-primary hover:shadow-lg transition-all">
                                                <CardContent className="p-3 flex flex-col items-center justify-center text-center space-y-1">
                                                    <FileText className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                                    <p className="text-xs font-medium leading-tight">{doc.name}</p>
                                                </CardContent>
                                            </Card>
                                        </a>
                                    ))}
                                </CardContent>
                            </Card>
                         )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function BmtQuoteSummaryPage() {
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
                 <div className="flex flex-col h-screen"><Header /><main className="flex-1 p-8"><Skeleton className="h-full w-full" /></main></div>
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
            <BmtQuoteSummaryPageContent />
        </SidebarProvider>
    )
}
