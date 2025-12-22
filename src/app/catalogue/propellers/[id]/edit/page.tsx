
"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { getPropellerById, saveCataloguePropeller, getCatalogueMotors, getUserProfile, getStaticLogo } from '@/lib/storage';
import type { Propeller, CatalogueMotor, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save, Upload, ImageIcon, Search, X } from 'lucide-react';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getAuth, signOut } from 'firebase/auth';
import { UserProfileDialog } from '@/components/UserProfileDialog';

const propellerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Propeller name is required.'),
  basePrice: z.coerce.number().min(0, 'Price must be non-negative.'),
  sellPrice: z.coerce.number().min(0, 'Price must be non-negative.'),
  gpPercentage: z.coerce.number().min(0).max(100),
  nsmCode: z.string().optional(),
  factoryCode: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  imageFile: z.instanceof(File).optional(),
  compatibleMotorIds: z.array(z.string()).optional(),
});

type PropellerFormValues = z.infer<typeof propellerSchema>;

function formatCurrency(value: number) {
    if (isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
}

function EditPropellerPageContent() {
    const params = useParams();
    const propId = params.id as string;
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [propeller, setPropeller] = useState<Propeller | null>(null);
    const [allMotors, setAllMotors] = useState<CatalogueMotor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [lastEditedField, setLastEditedField] = useState<'gpPercentage' | 'sellPrice' | null>(null);
    const [motorSearchTerm, setMotorSearchTerm] = useState('');

    const form = useForm<PropellerFormValues>({
        resolver: zodResolver(propellerSchema),
        defaultValues: { name: '', basePrice: 0, sellPrice: 0, gpPercentage: 0, nsmCode: '', factoryCode: '', compatibleMotorIds: [] },
    });
  
    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && propId) {
            setIsLoading(true);
            Promise.all([
                getPropellerById(propId),
                getCatalogueMotors(),
            ]).then(([propData, motorData]) => {
                if (propData) {
                    setPropeller(propData);
                    form.reset(propData);
                }
                setAllMotors(motorData);
                setIsLoading(false);
            });
        }
    }, [user, propId, form]);

    const { watch, setValue } = form;
    const basePrice = watch('basePrice');
    const sellPrice = watch('sellPrice');
    const gpPercentage = watch('gpPercentage');

    useEffect(() => {
      if (basePrice > 0) {
        if (lastEditedField === 'gpPercentage') {
          const newSellPrice = basePrice / (1 - gpPercentage / 100);
          if (!isNaN(newSellPrice) && Math.abs(newSellPrice - sellPrice) > 0.01) {
            setValue('sellPrice', parseFloat(newSellPrice.toFixed(2)));
          }
        } else if (lastEditedField === 'sellPrice') {
          if (sellPrice > 0) {
            const newGp = ((sellPrice - basePrice) / sellPrice) * 100;
            if (!isNaN(newGp) && Math.abs(newGp - gpPercentage) > 0.01) {
                setValue('gpPercentage', parseFloat(newGp.toFixed(2)));
            }
          }
        }
      }
    }, [basePrice, sellPrice, gpPercentage, lastEditedField, setValue]);


    const onSubmit = async (data: PropellerFormValues) => {
        if (!propId) return;
        setIsSaving(true);
        try {
            await saveCataloguePropeller({ id: propId, ...data });
            toast({ title: 'Propeller Saved', description: `"${data.name}" has been updated.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Save Failed', description: String(error) });
        } finally {
            setIsSaving(false);
        }
    };

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            form.setValue('imageFile', file, { shouldDirty: true });
            const reader = new FileReader();
            reader.onloadend = () => form.setValue('imageUrl', reader.result as string, { shouldDirty: true });
            reader.readAsDataURL(file);
        }
    };
    
    const filteredMotors = useMemo(() => {
        return allMotors.filter(motor =>
            motor.name.toLowerCase().includes(motorSearchTerm.toLowerCase())
        );
    }, [allMotors, motorSearchTerm]);
  
    if (isLoading || authLoading) {
        return (
            <div className="flex flex-col h-screen">
                <Header />
                <main className="flex-1 p-8"><Skeleton className="h-full w-full" /></main>
            </div>
        );
    }

    if (!propeller) {
        return (
            <div className="flex flex-col h-screen">
                <Header><Button asChild variant="outline"><Link href="/catalogue/propellers"><ArrowLeft /> Back</Link></Button></Header>
                <main className="flex-1 flex items-center justify-center"><p>Propeller not found.</p></main>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-screen">
            <Header>
                <Button asChild variant="outline"><Link href="/catalogue/propellers"><ArrowLeft /> Back</Link></Button>
                <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                    <Save className="mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </Header>
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            <div className="lg:col-span-2 space-y-8">
                                 <Card>
                                     <CardHeader>
                                        <CardTitle>Edit Propeller: {propeller.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            <div className="lg:col-span-1 space-y-2">
                                                <FormLabel>Image</FormLabel>
                                                <div className="flex flex-col items-center gap-2">
                                                    {form.watch('imageUrl') ? <img src={form.watch('imageUrl')!} alt="Preview" className="h-24 w-full object-contain border rounded-md" /> : <div className="h-24 w-full bg-muted rounded-md flex items-center justify-center"><ImageIcon className="text-muted-foreground"/></div>}
                                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                                    <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleUploadClick}><Upload className="mr-2"/>Upload Image</Button>
                                                </div>
                                            </div>
                                             <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="sm:col-span-2">
                                                     <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Propeller Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                                </div>
                                                <FormField control={form.control} name="nsmCode" render={({ field }) => ( <FormItem><FormLabel>NSM Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                                <FormField control={form.control} name="factoryCode" render={({ field }) => ( <FormItem><FormLabel>Factory Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                 <Card>
                                    <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                            <FormField control={form.control} name="basePrice" render={({ field }) => ( <FormItem><FormLabel>Base Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                            <FormField control={form.control} name="gpPercentage" render={({ field }) => ( <FormItem><FormLabel>GP %</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => { field.onChange(e); setLastEditedField('gpPercentage'); }} /></FormControl><FormMessage /></FormItem> )} />
                                            <FormField control={form.control} name="sellPrice" render={({ field }) => ( <FormItem><FormLabel>Sell Price</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => { field.onChange(e); setLastEditedField('sellPrice'); }} /></FormControl><FormMessage /></FormItem> )} />
                                            <div>
                                                <Label>Gross Profit ($)</Label>
                                                <Input readOnly disabled value={formatCurrency(watch('sellPrice') - watch('basePrice'))} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                             <div className="lg:col-span-1">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Compatible Motors</CardTitle>
                                        <CardDescription>Select all motors this propeller can be fitted to.</CardDescription>
                                        <div className="relative pt-2">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search motors..."
                                                value={motorSearchTerm}
                                                onChange={(e) => setMotorSearchTerm(e.target.value)}
                                                className="pl-10"
                                            />
                                            {motorSearchTerm && <Button variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2" onClick={() => setMotorSearchTerm('')}><X className="h-4 w-4" /></Button>}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <FormField
                                            control={form.control}
                                            name="compatibleMotorIds"
                                            render={() => (
                                                <FormItem>
                                                    <ScrollArea className="h-96">
                                                        <div className="space-y-2 p-1">
                                                            {filteredMotors.map((motor) => (
                                                                <FormField
                                                                    key={motor.id}
                                                                    control={form.control}
                                                                    name="compatibleMotorIds"
                                                                    render={({ field }) => {
                                                                        return (
                                                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2 rounded-md hover:bg-muted">
                                                                                <FormControl>
                                                                                    <Checkbox
                                                                                        checked={field.value?.includes(motor.id!)}
                                                                                        onCheckedChange={(checked) => {
                                                                                            return checked
                                                                                            ? field.onChange([...(field.value || []), motor.id])
                                                                                            : field.onChange((field.value || []).filter(value => value !== motor.id))
                                                                                        }}
                                                                                    />
                                                                                </FormControl>
                                                                                <FormLabel className="font-normal cursor-pointer w-full">
                                                                                    {motor.name}
                                                                                </FormLabel>
                                                                            </FormItem>
                                                                        )
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    </ScrollArea>
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </form>
                </Form>
            </main>
        </div>
    );
}

export default function EditPropellerPage() {
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
            <EditPropellerPageContent />
        </SidebarProvider>
    );
}
