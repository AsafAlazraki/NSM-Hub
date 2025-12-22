
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { getTrailerById, saveCatalogueTrailer, getFactoryOptionCategories, getCatalogueFactoryOptions, getUserProfile, getStaticLogo } from '@/lib/storage';
import type { CatalogueTrailer, FactoryOption, FactoryOptionCategory, OptionTag, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Trash2, PlusCircle, Upload, ImageIcon, Save, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getAuth, signOut } from 'firebase/auth';
import { UserProfileDialog } from '@/components/UserProfileDialog';

const trailerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Trailer name is required.'),
  price: z.coerce.number().min(0, 'Price must be non-negative.'),
  specifications: z.array(z.object({
    name: z.string().min(1, 'Specification name is required.'),
    value: z.string().min(1, 'Specification value is required.'),
  })).optional(),
  imageUrl: z.string().optional(),
  imageFile: z.instanceof(File).optional(),
  compatibleFactoryOptionIds: z.array(z.string()).optional(),
});

type TrailerFormValues = z.infer<typeof trailerSchema>;

const tagColors: Record<OptionTag, string> = {
  Boat: 'bg-blue-100 text-blue-800',
  Motor: 'bg-green-100 text-green-800',
  Trailer: 'bg-orange-100 text-orange-800',
  Misc: 'bg-gray-100 text-gray-800',
};

function EditTrailerPageContent() {
    const params = useParams();
    const trailerId = params.id as string;
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [trailer, setTrailer] = useState<CatalogueTrailer | null>(null);
    const [allFactoryCategories, setAllFactoryCategories] = useState<FactoryOptionCategory[]>([]);
    const [allFactoryOptions, setAllFactoryOptions] = useState<FactoryOption[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<TrailerFormValues>({
        resolver: zodResolver(trailerSchema),
        defaultValues: { name: '', price: 0, specifications: [], imageUrl: '', compatibleFactoryOptionIds: [] },
    });

    const { fields: specFields, append: appendSpec, remove: removeSpec } = useFieldArray({ control: form.control, name: "specifications" });
  
    useEffect(() => {
        if (!authLoading && !user) {
        router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && trailerId) {
            setIsLoading(true);
            Promise.all([
                getTrailerById(trailerId),
                getFactoryOptionCategories(),
                getCatalogueFactoryOptions(),
            ]).then(([trailerData, catData, optData]) => {
                if (trailerData) {
                    setTrailer(trailerData);
                    form.reset(trailerData);
                }
                setAllFactoryCategories(catData);
                setAllFactoryOptions(optData);
                setIsLoading(false);
            });
        }
    }, [user, trailerId, form]);

    const onSubmit = async (data: TrailerFormValues) => {
        if (!trailerId) return;
        setIsSaving(true);
        try {
            await saveCatalogueTrailer({ id: trailerId, ...data });
            toast({ title: 'Trailer Saved', description: `"${data.name}" has been updated.` });
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
  
    if (isLoading || authLoading) {
        return (
            <div className="flex flex-col h-screen">
                <Header />
                <main className="flex-1 p-8"><Skeleton className="h-full w-full" /></main>
            </div>
        );
    }

    if (!trailer) {
        return (
            <div className="flex flex-col h-screen">
                <Header><Button asChild variant="outline"><Link href="/catalogue/trailers"><ArrowLeft /> Back</Link></Button></Header>
                <main className="flex-1 flex items-center justify-center"><p>Trailer not found.</p></main>
            </div>
        );
    }
    
    const watchedImageUrl = form.watch('imageUrl');
    
    const trailerFactoryOptions = allFactoryOptions.filter(opt => opt.tag === 'Trailer');
    const trailerFactoryCategories = allFactoryCategories.filter(cat => cat.tag === 'Trailer' || trailerFactoryOptions.some(opt => opt.categoryId === cat.id));

    return (
        <div className="flex flex-col h-screen">
            <Header>
                <Button asChild variant="outline"><Link href="/catalogue/trailers"><ArrowLeft /> Back</Link></Button>
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
                                <CardTitle>Edit Trailer: {trailer.name}</CardTitle>
                                <CardDescription>Update the details for this trailer.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-4">
                                    <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Trailer Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={form.control} name="price" render={({ field }) => ( <FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                </div>
                                <div className="space-y-2">
                                    <FormLabel>Trailer Image</FormLabel>
                                    <div className="flex flex-col items-center gap-2">
                                        {watchedImageUrl ? <img src={watchedImageUrl} alt="Trailer preview" className="h-24 w-full object-contain border rounded-md" /> : <div className="h-24 w-full bg-muted rounded-md flex items-center justify-center"><ImageIcon className="text-muted-foreground"/></div>}
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                        <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleUploadClick}><Upload className="mr-2"/>Upload Image</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                                    {specFields.length === 0 && <p className="text-sm text-center text-muted-foreground py-2">No specifications added.</p>}
                                </CardContent>
                            </Card>
                              <Card>
                                <CardHeader className="flex flex-row items-start justify-between">
                                    <div>
                                        <CardTitle>Compatible Factory Options</CardTitle>
                                        <CardDescription>Select trailer-specific options.</CardDescription>
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
                                                {trailerFactoryCategories.map(cat => (
                                                    <div key={cat.id} className="space-y-2">
                                                        <h4 className="font-semibold flex items-center gap-2">{cat.name} <Badge className={cn("text-xs", tagColors[cat.tag!])}>{cat.tag}</Badge></h4>
                                                        <div className="pl-4 space-y-2">
                                                            {trailerFactoryOptions.filter(opt => opt.categoryId === cat.id).map(opt => (
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
                        </div>
                    </form>
                </Form>
            </main>
        </div>
    );
}

export default function EditTrailerPage() {
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
            <EditTrailerPageContent />
        </SidebarProvider>
    );
}
