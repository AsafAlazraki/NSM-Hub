
"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { getMotorById, saveCatalogueMotor, getCataloguePropellers, getFactoryOptionCategories, getCatalogueFactoryOptions, getUserProfile, getStaticLogo } from '@/lib/storage';
import type { CatalogueMotor, Propeller, FactoryOption, FactoryOptionCategory, OptionTag, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Trash2, PlusCircle, Upload, ImageIcon, Save, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getAuth, signOut } from 'firebase/auth';
import { UserProfileDialog } from '@/components/UserProfileDialog';

const motorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Motor name is required.'),
  basePrice: z.coerce.number().min(0, 'Price must be non-negative.'),
  sellPrice: z.coerce.number().min(0, 'Price must be non-negative.'),
  gpPercentage: z.coerce.number().min(0).max(100),
  specifications: z.array(z.object({
    name: z.string().min(1, 'Specification name is required.'),
    value: z.string().min(1, 'Specification value is required.'),
  })).optional(),
  includesPreDelivery: z.boolean().optional(),
  imageUrl: z.string().optional(),
  imageFile: z.instanceof(File).optional(),
  compatiblePropellerIds: z.array(z.string()).optional(),
  compatibleFactoryOptionIds: z.array(z.string()).optional(),
});

type MotorFormValues = z.infer<typeof motorSchema>;

function formatCurrency(value: number) {
    if (isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
}

const tagColors: Record<OptionTag, string> = {
  Boat: 'bg-blue-100 text-blue-800',
  Motor: 'bg-green-100 text-green-800',
  Trailer: 'bg-orange-100 text-orange-800',
  Misc: 'bg-gray-100 text-gray-800',
};


function EditMotorPageContent() {
    const params = useParams();
    const motorId = params.id as string;
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [motor, setMotor] = useState<CatalogueMotor | null>(null);
    const [allPropellers, setAllPropellers] = useState<Propeller[]>([]);
    const [allFactoryCategories, setAllFactoryCategories] = useState<FactoryOptionCategory[]>([]);
    const [allFactoryOptions, setAllFactoryOptions] = useState<FactoryOption[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [lastEditedField, setLastEditedField] = useState<'gpPercentage' | 'sellPrice' | null>(null);

    const form = useForm<MotorFormValues>({
        resolver: zodResolver(motorSchema),
        defaultValues: { name: '', basePrice: 0, sellPrice: 0, gpPercentage: 0, specifications: [], includesPreDelivery: false, imageUrl: '', compatiblePropellerIds: [], compatibleFactoryOptionIds: [] },
    });

    const { fields: specFields, append: appendSpec, remove: removeSpec } = useFieldArray({ control: form.control, name: "specifications" });
  
    useEffect(() => {
        if (!authLoading && !user) {
        router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && motorId) {
            setIsLoading(true);
            Promise.all([
                getMotorById(motorId),
                getCataloguePropellers(),
                getFactoryOptionCategories(),
                getCatalogueFactoryOptions(),
            ]).then(([motorData, propData, catData, optData]) => {
                if (motorData) {
                    setMotor(motorData);
                    form.reset(motorData);
                }
                setAllPropellers(propData);
                setAllFactoryCategories(catData);
                setAllFactoryOptions(optData);
                setIsLoading(false);
            });
        }
    }, [user, motorId, form]);

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


    const onSubmit = async (data: MotorFormValues) => {
        if (!motorId) return;
        setIsSaving(true);
        try {
            await saveCatalogueMotor({ id: motorId, ...data });
            toast({ title: 'Motor Saved', description: `"${data.name}" has been updated.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Save Failed', description: String(error) });
        } finally {
            setIsSaving(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            form.setValue('imageFile', file, { shouldDirty: true });
            const reader = new FileReader();
            reader.onloadend = () => {
                form.setValue('imageUrl', reader.result as string, { shouldDirty: true });
            };
            reader.readAsDataURL(file);
        }
    };

    const motorFactoryOptions = useMemo(() => {
        return allFactoryOptions.filter(opt => opt.tag === 'Motor');
    }, [allFactoryOptions]);

    const motorFactoryCategories = useMemo(() => {
        const motorOptionCategoryIds = new Set(motorFactoryOptions.map(o => o.categoryId));
        return allFactoryCategories.filter(cat => cat.tag === 'Motor' || motorOptionCategoryIds.has(cat.id));
    }, [allFactoryCategories, motorFactoryOptions]);

  
    if (isLoading || authLoading) {
        return (
            <div className="flex flex-col h-screen">
                <Header />
                <main className="flex-1 p-8"><Skeleton className="h-full w-full" /></main>
            </div>
        );
    }

    if (!motor) {
        return (
            <div className="flex flex-col h-screen">
                <Header><Button asChild variant="outline"><Link href="/catalogue/motors"><ArrowLeft /> Back</Link></Button></Header>
                <main className="flex-1 flex items-center justify-center"><p>Motor not found.</p></main>
            </div>
        );
    }
    
    const watchedImageUrl = form.watch('imageUrl');

    return (
        <div className="flex flex-col h-screen">
            <Header>
                <Button asChild variant="outline"><Link href="/catalogue/motors"><ArrowLeft /> Back</Link></Button>
                <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                    <Save className="mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </Header>
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <Card>
                             <CardHeader>
                                <CardTitle>Edit Motor: {motor.name}</CardTitle>
                                <CardDescription>Update the details for this motor.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-4">
                                    <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Motor Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                     <FormField control={form.control} name="includesPreDelivery" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-2"> <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="cursor-pointer">Includes Pre-Delivery & Install</FormLabel></FormItem>)}/>
                                </div>
                                <div className="space-y-2">
                                    <FormLabel>Motor Image</FormLabel>
                                    <div className="flex flex-col items-center gap-2">
                                        {watchedImageUrl ? <img src={watchedImageUrl} alt="Motor preview" className="h-24 w-full object-contain border rounded-md" /> : <div className="h-24 w-full bg-muted rounded-md flex items-center justify-center"><ImageIcon className="text-muted-foreground"/></div>}
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                        <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleUploadClick}><Upload className="mr-2"/>Upload Image</Button>
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
                                        <Input readOnly disabled value={formatCurrency(sellPrice - basePrice)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>


                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Compatible Propellers</CardTitle>
                                    <CardDescription>Select which propellers can be fitted to this motor.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="compatiblePropellerIds"
                                        render={() => (
                                        <FormItem>
                                            <div className="space-y-2">
                                                {allPropellers.map((prop) => (
                                                    <FormField
                                                        key={prop.id}
                                                        control={form.control}
                                                        name="compatiblePropellerIds"
                                                        render={({ field }) => {
                                                            return (
                                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                                    <FormControl>
                                                                        <Checkbox
                                                                            checked={field.value?.includes(prop.id!)}
                                                                            onCheckedChange={(checked) => {
                                                                                return checked
                                                                                ? field.onChange([...(field.value || []), prop.id])
                                                                                : field.onChange((field.value || []).filter(value => value !== prop.id))
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal cursor-pointer">
                                                                        {prop.name}
                                                                    </FormLabel>
                                                                </FormItem>
                                                            )
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row justify-between items-center">
                                    <CardTitle>Specifications</CardTitle>
                                    <Button type="button" variant="outline" size="sm" onClick={() => appendSpec({ name: '', value: '' })}><PlusCircle className="mr-2"/>Add Spec</Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {specFields.map((field, index) => (
                                        <div key={field.id} className="grid grid-cols-2 gap-4 items-center">
                                            <FormField control={form.control} name={`specifications.${index}.name`} render={({ field }) => ( <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )}/>
                                            <div className="flex items-end gap-2">
                                                <FormField control={form.control} name={`specifications.${index}.value`} render={({ field }) => ( <FormItem className="flex-1"><FormLabel>Value</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )}/>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeSpec(index)}><Trash2 className="text-destructive"/></Button>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                         </div>
                          <Card>
                            <CardHeader className="flex flex-row items-start justify-between">
                                <div>
                                    <CardTitle>Compatible Factory Options</CardTitle>
                                    <CardDescription>Select motor-specific options or entire categories compatible with this model.</CardDescription>
                                </div>
                                <Button asChild variant="link" className="text-sm">
                                    <Link href="/catalogue/factory-options">
                                        Manage Options <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={form.control}
                                    name="compatibleFactoryOptionIds"
                                    render={() => (
                                    <FormItem>
                                        <div className="space-y-4">
                                            {motorFactoryCategories.map(cat => (
                                                <div key={cat.id} className="space-y-2">
                                                    <h4 className="font-semibold flex items-center gap-2">{cat.name} <Badge className={cn("text-xs", tagColors[cat.tag!])}>{cat.tag}</Badge></h4>
                                                    <div className="pl-4 space-y-2">
                                                        {motorFactoryOptions.filter(opt => opt.categoryId === cat.id).map(opt => (
                                                             <FormField
                                                                key={opt.id}
                                                                control={form.control}
                                                                name="compatibleFactoryOptionIds"
                                                                render={({ field }) => (
                                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                                    <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(opt.id!)}
                                                                        onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...(field.value || []), opt.id])
                                                                            : field.onChange((field.value || []).filter((value) => value !== opt.id))
                                                                        }}
                                                                    />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal cursor-pointer">
                                                                        {opt.name}
                                                                    </FormLabel>
                                                                </FormItem>
                                                                )}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </form>
                </Form>
            </main>
        </div>
    );
}

export default function EditMotorPage() {
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
            <EditMotorPageContent />
        </SidebarProvider>
    );
}
