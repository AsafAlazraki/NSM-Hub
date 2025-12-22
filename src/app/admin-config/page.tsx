
"use client";

import { useState, useEffect, useMemo } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ExternalLink, Loader2, Copy, Edit, PlusCircle, RefreshCw, History, Save, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getQuotes, saveQuote, saveSyncAuditLog, getSyncAuditLogs, getCrmCredentials, saveCrmCredentials, getUserProfile, getStaticLogo } from "@/lib/storage";
import type { Quote, SyncAuditLog, CrmCredentials, UserProfile } from "@/lib/types";
import { Timestamp } from "firebase/firestore";
import { format, formatDistanceToNow, differenceInSeconds } from "date-fns";
import { useCrmSync } from "@/hooks/use-crm-sync";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { getAuth, signOut } from "firebase/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const newContactSchema = z.object({
  firstname: z.string().min(1, 'First name is required'),
  lastname: z.string().min(1, 'Last name is required'),
  emailaddress1: z.string().email('Invalid email address').optional().or(z.literal('')),
  jobtitle: z.string().optional(),
});
type NewContactFormValues = z.infer<typeof newContactSchema>;


const SyncLogDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
    const [logs, setLogs] = useState<SyncAuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    React.useEffect(() => {
        if (open) {
            setIsLoading(true);
            getSyncAuditLogs()
                .then(setLogs)
                .catch(() => toast({ title: "Error", description: "Could not fetch sync logs.", variant: "destructive" }))
                .finally(() => setIsLoading(false));
        }
    }, [open, toast]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>CRM Sync Audit Log</DialogTitle>
                    <DialogDescription>
                        A record of all data synchronization events between this app and Dynamics CRM.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[60vh] -mx-6 px-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No sync events have been logged yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            {format(log.timestamp.toDate(), 'PPP p')}
                                        </TableCell>
                                        <TableCell>{log.userName}</TableCell>
                                        <TableCell>{log.action}</TableCell>
                                        <TableCell>
                                             <span className={cn("flex items-center gap-2 text-sm font-semibold", log.error ? 'text-red-600' : 'text-green-600' )}>
                                                {log.error ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                                {log.error ? 'Fail' : 'Success'}
                                             </span>
                                             {log.error && <p className="text-xs text-destructive mt-1">{log.error}</p>}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function AdminConfigPageContent() {
    const { toast } = useToast();
    const { user } = useAuth();
    const { isSyncing, runAutomatedSync, contacts, accessToken } = useCrmSync();

    const [isSaving, setIsSaving] = useState(false);
    const [credentials, setCredentials] = useState<Partial<CrmCredentials>>({
        tenantId: '',
        clientId: '',
        clientSecret: '',
        resource: '',
    });

    const [editingCell, setEditingCell] = useState<{ contactId: string; field: keyof CrmContact } | null>(null);
    const [editValue, setEditValue] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);

    useEffect(() => {
        getCrmCredentials().then(creds => {
            if (creds) {
                setCredentials(creds);
            }
        });
    }, []);

    const newContactForm = useForm<NewContactFormValues>({
        resolver: zodResolver(newContactSchema),
        defaultValues: {
            firstname: '',
            lastname: '',
            emailaddress1: '',
            jobtitle: '',
        }
    });

    const handleSaveCredentials = async () => {
        setIsSaving(true);
        try {
            await saveCrmCredentials(credentials as CrmCredentials);
            toast({ title: "Credentials Saved", description: "Your Dynamics CRM credentials have been updated." });
        } catch (error: any) {
            toast({ title: "Save Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    interface CrmContact {
      contactid: string;
      fullname: string;
      emailaddress1: string;
      jobtitle: string;
      [key: string]: any;
    }
    
    const handleUpdateContact = async (contactId: string, field: keyof CrmContact) => {
        if (!accessToken) return;
        const originalContact = contacts.find(c => c.contactid === contactId);
        if (!originalContact || originalContact[field] === editValue) {
            setEditingCell(null);
            return;
        }

        setIsUpdating(true);
        try {
            const endpoint = `/api/data/v9.2/contacts(${contactId})`;
            const body = { [field]: editValue };

            const res = await fetch(`/api/mscrm?endpoint=${encodeURIComponent(endpoint)}&resource=${encodeURIComponent(credentials.resource || '')}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                 const errorData = await res.json();
                 throw new Error(errorData.error?.message || `Failed to update contact. Status: ${res.status}`);
            }
            
            // Re-run sync to refresh data
            runAutomatedSync(true);
            toast({ title: "Contact Updated", description: `${originalContact.fullname}'s ${field} has been changed.` });

        } catch (error: any) {
            toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsUpdating(false);
            setEditingCell(null);
        }
    };
    
    const handleCreateContact = async (values: NewContactFormValues) => {
        if (!accessToken) return;
        setIsUpdating(true);
        try {
            const endpoint = '/api/data/v9.2/contacts';
            const res = await fetch(`/api/mscrm?endpoint=${encodeURIComponent(endpoint)}&resource=${encodeURIComponent(credentials.resource || '')}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error?.message || `Failed to create contact. Status: ${res.status}`);
            }
            
            runAutomatedSync(true); // Re-fetch contacts
            toast({ title: "Contact Created", description: `Contact has been added to CRM.` });
            setIsCreateDialogOpen(false);
            newContactForm.reset();

        } catch (error: any) {
            toast({ title: 'Creation Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="flex flex-col h-screen">
            <SyncLogDialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen} />
            <Header/>
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
                 <header className="space-y-2">
                    <h1 className="text-3xl font-headline font-bold text-foreground flex items-center">
                        <Shield className="mr-3 h-8 w-8 text-primary" />
                        Admin Configuration
                    </h1>
                    <p className="text-muted-foreground">
                        Manage CRM credentials and data synchronization. Sync runs automatically every 5 minutes.
                    </p>
                </header>

                <Card>
                    <CardHeader>
                        <CardTitle>Dynamics CRM Credentials</CardTitle>
                        <CardDescription>
                            Enter your app registration details to enable synchronization.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tenantId">Directory (tenant) ID</Label>
                                <Input id="tenantId" value={credentials.tenantId} onChange={(e) => setCredentials(prev => ({...prev, tenantId: e.target.value}))} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="clientId">Application (client) ID</Label>
                                <Input id="clientId" value={credentials.clientId} onChange={(e) => setCredentials(prev => ({...prev, clientId: e.target.value}))} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="clientSecret">Client Secret</Label>
                            <Input id="clientSecret" type="password" placeholder="Enter your client secret" value={credentials.clientSecret} onChange={(e) => setCredentials(prev => ({...prev, clientSecret: e.target.value}))} />
                            <p className="text-xs text-destructive">Warning: Entering secrets in a browser is insecure. This is for demonstration only.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="resource">Resource URL</Label>
                            <Input id="resource" value={credentials.resource} onChange={(e) => setCredentials(prev => ({...prev, resource: e.target.value}))} />
                        </div>
                    </CardContent>
                    <CardFooter className="gap-2">
                        <Button onClick={handleSaveCredentials} disabled={isSaving}>
                            <Save className="mr-2 h-4 w-4" /> 
                            {isSaving ? 'Saving...' : 'Save Credentials'}
                        </Button>
                         <Button onClick={() => runAutomatedSync(true)} disabled={isSyncing}>
                            {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Sync Manually Now
                        </Button>
                         <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="secondary" disabled={!accessToken}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    New Contact
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Contact</DialogTitle>
                                    <DialogDescription>
                                        Enter the details for the new contact and save to add them to Dynamics CRM.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...newContactForm}>
                                    <form onSubmit={newContactForm.handleSubmit(handleCreateContact)} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={newContactForm.control} name="firstname" render={({ field }) => ( <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                            <FormField control={newContactForm.control} name="lastname" render={({ field }) => ( <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                        </div>
                                        <FormField control={newContactForm.control} name="emailaddress1" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                        <FormField control={newContactForm.control} name="jobtitle" render={({ field }) => ( <FormItem><FormLabel>Job Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                                            <Button type="submit" disabled={isUpdating}>
                                                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                Create Contact
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                         <Button variant="outline" onClick={() => setIsLogDialogOpen(true)}>
                            <History className="mr-2 h-4 w-4" />
                            View Sync Log
                        </Button>
                    </CardFooter>
                </Card>

                {contacts.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Fetched Contacts</CardTitle>
                            <CardDescription>Click on an email or job title to edit it.</CardDescription>
                        </CardHeader>
                        <CardContent>
                        <ScrollArea className="h-96 rounded-md border bg-background">
                            <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Full Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Job Title</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {contacts.map((contact) => (
                                            <TableRow key={contact.contactid} className="group">
                                                <TableCell className="font-medium">{contact.fullname || 'N/A'}</TableCell>
                                                <TableCell
                                                    onClick={() => { setEditingCell({ contactId: contact.contactid, field: 'emailaddress1' }); setEditValue(contact.emailaddress1 || ''); }}
                                                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                                                >
                                                    {editingCell?.contactId === contact.contactid && editingCell?.field === 'emailaddress1' ? (
                                                        isUpdating ? <Loader2 className="h-4 w-4 animate-spin"/> :
                                                        <Input
                                                            autoFocus
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            onBlur={() => handleUpdateContact(contact.contactid, 'emailaddress1')}
                                                            onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateContact(contact.contactid, 'emailaddress1'); if (e.key === 'Escape') setEditingCell(null); }}
                                                            className="h-8"
                                                        />
                                                    ) : (
                                                        <span className="flex items-center gap-2">{contact.emailaddress1 || 'N/A'} <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" /></span>
                                                    )}
                                                </TableCell>
                                                <TableCell
                                                    onClick={() => { setEditingCell({ contactId: contact.contactid, field: 'jobtitle' }); setEditValue(contact.jobtitle || ''); }}
                                                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                                                >
                                                    {editingCell?.contactId === contact.contactid && editingCell?.field === 'jobtitle' ? (
                                                        isUpdating ? <Loader2 className="h-4 w-4 animate-spin"/> :
                                                        <Input
                                                            autoFocus
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            onBlur={() => handleUpdateContact(contact.contactid, 'jobtitle')}
                                                            onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateContact(contact.contactid, 'jobtitle'); if (e.key === 'Escape') setEditingCell(null); }}
                                                            className="h-8"
                                                        />
                                                    ) : (
                                                        <span className="flex items-center gap-2">{contact.jobtitle || 'N/A'} <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" /></span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                        </ScrollArea>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}

export default function AdminConfigPage() {
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
            <AdminConfigPageContent />
        </SidebarProvider>
    );
}
