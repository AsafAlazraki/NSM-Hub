
"use client";

import React, { useState, useEffect } from 'react';
import type { Quote, Operation, UserProfile, CatalogueOperation, EstimateType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Ship, Wrench, Calendar, FileText, Printer, PlusCircle, MoreVertical, Edit, Trash2, GitBranch, History, XCircle, BookMarked, ArrowUp, ArrowDown, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { saveQuote, moveQuote, createNewVersion, getQuoteById, getAllUsers } from '@/lib/storage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EditReferencesDialog, type ReferencesData } from '@/components/form/EditReferencesDialog';
import { EditCustomerAssetDialog, type CustomerAssetData } from '@/components/form/EditCustomerAssetDialog';
import { OperationForm } from '@/components/form/OperationForm';
import { CatalogueDialog } from '@/components/form/CatalogueDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';

const SummaryItem = ({ icon: Icon, label, value }: { icon?: React.ElementType; label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-3">
    {Icon && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
    )}
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-base font-semibold">{value || '-'}</p>
    </div>
  </div>
);

const statusClassMap: Record<Exclude<Quote['status'], 'Archived' >, string> = {
    'Work In Progress': 'bg-sky-500/20 text-sky-700 border-sky-500/30 hover:bg-sky-500/30',
    'Estimate': 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/30',
    'Pending': 'bg-orange-500/20 text-orange-700 border-orange-500/30 hover:bg-orange-500/30',
    'Approved': 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30',
    'Complete': 'bg-blue-500/20 text-blue-700 border-blue-500/30 hover:bg-blue-500/30',
    'Cancelled': 'bg-gray-500/20 text-gray-700 border-gray-500/30 hover:bg-gray-500/30',
    'Deleted': 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30',
};

const formatQuoteId = (id: string, version: number) => {
    let displayId = "Quote ####";
    if (!id) return displayId;

    if (id.startsWith('QT')) {
        const numberPart = id.split('-v')[0].substring(2);
        displayId = `Quote #${numberPart}`;
    } else if (id.startsWith('QUOTE-')) {
        // This is a temporary ID for a quote without a job card
        displayId = "New Quote";
    } else {
       displayId = id;
    }
    
    if (version > 1) {
      return `${displayId.replace(/-v\d+$/, '')} v${version}`;
    }

    return displayId;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
}

const OperationSubtotal = ({ operation }: { operation: Operation }) => {
    const laborCost = (operation.laborHours || 0) * (operation.laborRate || 0);
    const partsCost = (operation.parts || []).reduce((sum, part) => sum + ((part.cost || 0) * (part.quantity || 1)), 0);
    const total = laborCost + partsCost;
    return (
        <span className="font-semibold">{formatCurrency(total)}</span>
    )
}


export const QuoteView = ({ quote: initialQuote }: { quote: Quote }) => {
  const [quote, setQuote] = useState(initialQuote);
  const { toast } = useToast();
  const router = useRouter();
  const [editingOperation, setEditingOperation] = useState<Operation | undefined | null>(undefined); // null means show form for new, undefined means hide
  const [isReferencesDialogOpen, setIsReferencesDialogOpen] = useState(false);
  const [isCustomerAssetDialogOpen, setIsCustomerAssetDialogOpen] = useState(false);
  const [isCatalogueDialogOpen, setIsCatalogueDialogOpen] = useState(false);
  const [historyQuotes, setHistoryQuotes] = useState<Quote[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [selectedUserToReassign, setSelectedUserToReassign] = useState<UserProfile | null>(null);
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  
  useEffect(() => {
    setQuote(initialQuote);
    const fetchHistoryAndUsers = async () => {
        // Fetch all users for the re-assign dropdown
        const users = await getAllUsers();
        setAllUsers(users);

        // Fetch version history
        if (initialQuote.history && initialQuote.history.length > 0) {
            setIsHistoryLoading(true);
            const fetchedQuotes = await Promise.all(
                initialQuote.history.map(id => getQuoteById(id))
            );
            setHistoryQuotes(fetchedQuotes.filter((q): q is Quote => !!q).sort((a, b) => b.version - a.version));
            setIsHistoryLoading(false);
        } else {
            setHistoryQuotes([]);
        }
    }
    fetchHistoryAndUsers();
  }, [initialQuote]);

  const subTotal = (quote.operations || []).reduce((acc, op) => {
    const laborCost = (op.laborRate || 0) * (op.laborHours || 0);
    const partsCost = (op.parts || []).reduce((pAcc, part) => pAcc + ((part.cost || 0) * (part.quantity || 1)), 0);
    return acc + laborCost + partsCost;
  }, 0);

  const gstAmount = subTotal * 0.10;
  const totalCost = subTotal + gstAmount;
  
  const handleCreateNewVersion = async (quoteToVersion: Quote, newOwner?: UserProfile) => {
    try {
        const newVersionId = await createNewVersion(quoteToVersion, newOwner);
        toast({
            title: "New Version Created",
            description: `A new version of the quote has been created. You will be redirected to edit it.`,
        });
        router.push(`/quote/${newVersionId}/edit`);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Versioning Failed",
            description: error.message || "Could not create a new version.",
        });
    }
  };

  const handleRevertToVersion = async (historicalQuote: Quote) => {
    // Graft the historical version's content onto the CURRENT quote before
    // versioning, so the revert archives the live version (not the already
    // archived historical one, which would leave two active versions) and
    // keeps the quote's current owner instead of resurrecting the owner it
    // had back then.
    const revertedQuote: Quote = {
        ...quote,
        customer: historicalQuote.customer,
        boat: historicalQuote.boat,
        motors: historicalQuote.motors,
        trailer: historicalQuote.trailer,
        operations: historicalQuote.operations,
        estimateType: historicalQuote.estimateType,
    };
    await handleCreateNewVersion(revertedQuote);
  };

  const handleUserReassign = (userId: string) => {
    const userToReassign = allUsers.find(u => u.uid === userId);
    if(userToReassign) {
        setSelectedUserToReassign(userToReassign);
        setIsReassignDialogOpen(true);
    }
  };

  const confirmUserReassign = async () => {
    if (selectedUserToReassign) {
        await handleCreateNewVersion(quote, selectedUserToReassign);
        setIsReassignDialogOpen(false);
        setSelectedUserToReassign(null);
    }
  };


  const handleStatusChange = async (newStatus: Quote['status']) => {
    const updatedQuote = { ...quote, status: newStatus };
    setQuote(updatedQuote);
    await saveQuote(updatedQuote, true);
    toast({
        title: "Status Updated",
        description: `Quote status changed to ${newStatus}.`,
    });
  };
  
    const handleTypeChange = async (newType: EstimateType) => {
    const updatedQuote = { ...quote, estimateType: newType };
    setQuote(updatedQuote); // Optimistic update
    await saveQuote(updatedQuote, true);
    toast({
        title: "Estimate Type Updated",
        description: `Type changed to ${newType}.`,
    });
  };
  
  const handleToggleOperationForm = (operation?: Operation) => {
    if (operation) {
        setEditingOperation(operation);
    } else {
        setEditingOperation(null); // null indicates a new operation
    }
  };

  const handleCancelOperation = () => {
    setEditingOperation(undefined); // undefined hides the form
  }
  
  const handleSaveOperation = async (operationData: Operation) => {
    let updatedOperations;
    const isEditing = !!editingOperation;

    if (isEditing) {
        // Update existing operation
        updatedOperations = (quote.operations || []).map(op => 
            op.id === operationData.id ? operationData : op
        );
    } else {
        // Add new operation
        updatedOperations = [...(quote.operations || []), operationData];
    }

    const updatedQuote = { ...quote, operations: updatedOperations };
    
    try {
        setQuote(updatedQuote); // Optimistic update
        await saveQuote(updatedQuote, true);
        toast({
            title: `Operation ${isEditing ? 'Updated' : 'Added'}`,
            description: `The operation has been saved successfully.`,
        });
        setEditingOperation(undefined); // Hide form on save
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to save the operation.`,
        });
    }
  };

  const handleDeleteOperation = async (operationId: string) => {
      const updatedOperations = (quote.operations || []).filter(op => op.id !== operationId);
      const updatedQuote = { ...quote, operations: updatedOperations };

      try {
          setQuote(updatedQuote); // Optimistic update
          await saveQuote(updatedQuote, true);
          toast({
              title: "Operation Deleted",
              description: "The operation has been removed from the quote.",
          });
      } catch (error) {
          toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to delete the operation.",
          });
      }
  }

  const handleReorderOperation = async (operationId: string, direction: 'up' | 'down') => {
    const operations = quote.operations || [];
    const index = operations.findIndex(op => op.id === operationId);
    
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === operations.length - 1)) {
        return; // Can't move
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newOperations = [...operations];
    const [movedItem] = newOperations.splice(index, 1);
    newOperations.splice(newIndex, 0, movedItem);

    const updatedQuote = { ...quote, operations: newOperations };
    
    try {
        setQuote(updatedQuote); // Optimistic update
        await saveQuote(updatedQuote, true);
        toast({
            title: "Operation Moved",
            description: `The operation order has been updated.`,
        });
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to reorder the operation.`,
        });
    }
  }

  const handleSaveReferences = async (data: ReferencesData) => {
      const oldId = quote.id;
      const jobCardNumber = data.ourRef?.replace('JC', '') || '';
      let newId = quote.id; 

      // ID only changes if the job card number changes.
      if (jobCardNumber && `QT${jobCardNumber}` !== oldId && !oldId.startsWith("QUOTE-")) {
        newId = `QT${jobCardNumber}`;
      } else if (jobCardNumber && oldId.startsWith("QUOTE-")) {
        newId = `QT${jobCardNumber}`;
      }
      
      const updatedQuote: Quote = {
          ...quote,
          id: newId,
          user: { ...(quote.user || {}), ref: data.ourRef } as any,
          boat: { ...(quote.boat || {}), insuranceRef: data.insuranceRef } as any,
          insuranceCompany: data.insuranceCompany,
      };

      try {
          if (newId !== oldId) {
              await moveQuote(oldId, updatedQuote);
          } else {
              await saveQuote(updatedQuote, true);
          }
          
          setQuote(updatedQuote);
          
          toast({
              title: "References Updated",
              description: "The reference numbers have been updated.",
          });

          setIsReferencesDialogOpen(false);
          
          // If ID changed, we need to navigate to the new URL
          if (newId !== oldId) {
            router.replace(`/quote/${newId}`);
          }

      } catch (error: any) {
           toast({
              variant: "destructive",
              title: "Error",
              description: error.message || "Failed to update references.",
          });
      }
  };
  
    const handleSaveCustomerAsset = async (data: CustomerAssetData) => {
        const updatedQuote: Quote = {
            ...quote,
            customer: {
                ...quote.customer,
                ...data.customer,
            },
            boat: {
                ...quote.boat,
                ...data.boat,
            },
            motors: data.motors || quote.motors,
            trailer: {
                ...quote.trailer,
                ...data.trailer,
            },
        };
        try {
            setQuote(updatedQuote); // Optimistic update
            await saveQuote(updatedQuote, true);
            toast({
                title: "Details Updated",
                description: "Customer and asset details have been updated.",
            });
            setIsCustomerAssetDialogOpen(false);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update details.",
            });
        }
    };
    
    const handleAddFromCatalogue = async (catalogueOps: CatalogueOperation[]) => {
      const newOpsFromCatalogue: Operation[] = catalogueOps.map(catOp => ({
        id: `op-${Date.now()}-${Math.random()}`,
        heading: catOp.heading,
        description: catOp.description,
        customerNotes: '', // Add empty customer notes
        laborRate: catOp.laborRate,
        laborHours: catOp.laborHours,
        parts: (catOp.parts || []).map(p => ({
            ...p,
            id: `part-${Date.now()}-${Math.random()}`,
            costIncGst: p.costIncGst ?? Number(((p.cost || 0) * 1.1).toFixed(2)),
        }))
      }));

      const updatedQuote = { ...quote, operations: [...(quote.operations || []), ...newOpsFromCatalogue] };
      
      try {
          setQuote(updatedQuote); // Optimistic update
          await saveQuote(updatedQuote, true);
          toast({
              title: `Operation Added`,
              description: `Added "${newOpsFromCatalogue[0].heading}" from the catalogue.`,
          });
      } catch (error) {
          toast({
              variant: "destructive",
              title: "Error",
              description: `Failed to add operation from catalogue.`,
          });
      }
    };


  const getFullAddress = () => {
    if (!quote.customer?.address) return '';
    const { street, suburb, state, postcode } = quote.customer.address;
    return [street, suburb, state, postcode].filter(Boolean).join(', ');
  }
  
  const displayId = formatQuoteId(quote.id, quote.version);
  const isActionable = !['Complete', 'Cancelled', 'Deleted'].includes(quote.status);


  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
        <EditReferencesDialog
            isOpen={isReferencesDialogOpen}
            setIsOpen={setIsReferencesDialogOpen}
            onSave={handleSaveReferences}
            initialData={{
                ourRef: quote.user?.ref,
                insuranceRef: quote.boat?.insuranceRef,
                insuranceCompany: quote.insuranceCompany,
            }}
        />
        <EditCustomerAssetDialog
            isOpen={isCustomerAssetDialogOpen}
            setIsOpen={setIsCustomerAssetDialogOpen}
            onSave={handleSaveCustomerAsset}
            initialData={{
                customer: quote.customer,
                boat: quote.boat,
                motors: quote.motors,
                trailer: quote.trailer,
            }}
        />
         <CatalogueDialog
            isOpen={isCatalogueDialogOpen}
            setIsOpen={setIsCatalogueDialogOpen}
            onAdd={handleAddFromCatalogue}
        />
        <AlertDialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Reassign Quote?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will create a new version of the quote and assign it to <span className="font-bold">{selectedUserToReassign?.name}</span>. The current version will be archived. Are you sure?
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedUserToReassign(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmUserReassign}>
                    Reassign & Create New Version
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Card className="shadow-lg">
             <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex-1">
                    <CardTitle className="font-headline text-3xl font-bold text-primary">{displayId}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4"/> Created by {quote.user?.name || '-'} on {quote.createdAt ? format(new Date(quote.createdAt), 'MMMM d, yyyy') : 'N/A'}
                    </CardDescription>
                </div>
                <Select value={quote.status} onValueChange={(value: Quote['status']) => handleStatusChange(value)}>
                    <SelectTrigger className={cn("w-[180px] font-semibold", statusClassMap[quote.status])}>
                        <SelectValue placeholder="Change status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Work In Progress">Work In Progress</SelectItem>
                        <SelectItem value="Estimate">Estimate</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Complete">Complete</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-headline text-xl"><User/>User Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <p><strong>Name:</strong> {quote.user?.name || '-'}</p>
                                <p><strong>Role:</strong> {quote.user?.role || '-'}</p>
                                <p><strong>Phone:</strong> {quote.user?.phone || '-'}</p>
                                <p><strong>Email:</strong> {quote.user?.email || '-'}</p>
                            </div>
                            {isActionable && (
                                <div>
                                    <Label htmlFor="change-user" className="text-xs text-muted-foreground">Change Assigned User</Label>
                                    <Select onValueChange={handleUserReassign} value="">
                                        <SelectTrigger id="change-user" className="mt-1">
                                            <SelectValue placeholder="Select a user to reassign..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allUsers.filter(u => u.uid !== quote.userId).map(user => (
                                                <SelectItem key={user.uid} value={user.uid}>{user.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2 font-headline text-xl"><FileText/>Details</CardTitle>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" disabled={!isActionable}>
                                    <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setIsReferencesDialogOpen(true)} disabled={!isActionable}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit References
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-1">
                                <p><strong>Job Card #:</strong> {quote.user?.ref || '-'}</p>
                                <p><strong>Insurance Ref #:</strong> {quote.boat?.insuranceRef || '-'}</p>
                                <p><strong>Insurer:</strong> {quote.insuranceCompany?.name || '-'}</p>
                                {quote.insuranceCompany && (
                                    <div className="text-sm text-muted-foreground pl-1 space-y-0.5">
                                        {quote.insuranceCompany.abn && <p>ABN: {quote.insuranceCompany.abn}</p>}
                                        {quote.insuranceCompany.email && <p>{quote.insuranceCompany.email}</p>}
                                        {quote.insuranceCompany.phone && <p>{quote.insuranceCompany.phone}</p>}
                                    </div>
                                )}
                            </div>
                            <Separator />
                             <div>
                                <Label htmlFor="change-type" className="text-sm font-medium">Estimate Type</Label>
                                <Select onValueChange={(value: EstimateType) => handleTypeChange(value)} value={quote.estimateType}>
                                    <SelectTrigger id="change-type" className="mt-1">
                                        <SelectValue placeholder="Select an estimate type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Installation">Installation</SelectItem>
                                        <SelectItem value="Insurance">Insurance</SelectItem>
                                        <SelectItem value="Mechanical Estimate">Mechanical Estimate</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2 font-headline text-xl"><User/>Customer</CardTitle>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" disabled={!isActionable}>
                                    <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setIsCustomerAssetDialogOpen(true)} disabled={!isActionable}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p><strong>Name:</strong> {quote.customer?.name || '-'}</p>
                            <p><strong>Phone:</strong> {quote.customer?.phone || '-'}</p>
                            <p><strong>Email:</strong> {quote.customer?.email || '-'}</p>
                            <p><strong>Address:</strong> {getFullAddress() || '-'}</p>
                        </CardContent>
                    </Card>
                </div>
                 <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2 font-headline text-xl"><Ship/>Asset Details</CardTitle>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" disabled={!isActionable}>
                                    <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setIsCustomerAssetDialogOpen(true)} disabled={!isActionable}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                         <CardContent className="space-y-2">
                             <p><strong>Boat:</strong> {[quote.boat?.make, quote.boat?.model].filter(Boolean).join(' ') || '-'}</p>
                             <p><strong>Registration:</strong> {quote.boat?.registration || '-'}</p>
                             {quote.motors?.map((motor, index) => (
                                <p key={motor.id}><strong>Motor {quote.motors.length > 1 ? index + 1 : ''}:</strong> {[motor.make, motor.model].filter(Boolean).join(' ') || '-'}</p>
                             ))}
                             <p><strong>Trailer:</strong> {[quote.trailer?.make, quote.trailer?.model].filter(Boolean).join(' ') || '-'}</p>
                             <p><strong>Trailer Registration:</strong> {quote.trailer?.registration || '-'}</p>
                        </CardContent>
                    </Card>
                
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-headline font-semibold flex items-center gap-2"><Wrench/>Operations</h3>
                        {isActionable && editingOperation === undefined && (
                            <div className="flex items-center gap-2">
                                <Button variant="secondary" size="sm" onClick={() => setIsCatalogueDialogOpen(true)}>
                                    <BookMarked className="mr-2 h-4 w-4" />
                                    Add from Catalogue
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleToggleOperationForm()}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Operation
                                </Button>
                            </div>
                        )}
                    </div>
                     <div className="space-y-4">
                        {(quote.operations || []).length === 0 && editingOperation === undefined && (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No operations added yet.</p>
                            </div>
                        )}
                        {(quote.operations || []).map((op, index) => (
                           <Card key={op.id} className="bg-background/50">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <p className="font-semibold">{index + 1}. {op.heading}</p>
                                        </div>
                                        <div className="flex items-center flex-shrink-0">
                                            <div className="text-right w-28 mr-2">
                                                <OperationSubtotal operation={op} />
                                            </div>
                                            {isActionable && (
                                                <AlertDialog>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" disabled={editingOperation !== undefined}>
                                                            <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleToggleOperationForm(op)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleReorderOperation(op.id, 'up')} disabled={index === 0}>
                                                                <ArrowUp className="mr-2 h-4 w-4" />
                                                                Move Up
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleReorderOperation(op.id, 'down')} disabled={index === (quote.operations || []).length - 1}>
                                                                <ArrowDown className="mr-2 h-4 w-4" />
                                                                Move Down
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the operation "{op.heading}".
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteOperation(op.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pl-6">
                                        {op.customerNotes && (
                                            <div className="mt-2 text-sm">
                                                <p className="font-semibold text-blue-600">Internal Notes:</p>
                                                <p className="text-blue-600 italic whitespace-pre-wrap">{op.customerNotes}</p>
                                            </div>
                                        )}
                                        {op.description && (
                                            <div className="mt-2 text-sm">
                                                <p className="font-semibold text-muted-foreground">Description:</p>
                                                <p className="text-muted-foreground whitespace-pre-wrap">{op.description}</p>
                                            </div>
                                        )}
                                        <div className="text-sm mt-4">
                                            <div className="space-y-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Labor: {op.laborHours || 0} hrs @ ${op.laborRate || 0}/hr</span>
                                                    <span className="font-medium text-muted-foreground text-right w-28">{formatCurrency((op.laborHours || 0) * (op.laborRate || 0))}</span>
                                                </div>
                                                {(op.parts && op.parts.length > 0) && (
                                                     <div className="flex justify-between items-center">
                                                        <span className="text-muted-foreground">Parts:</span>
                                                    </div>
                                                )}
                                                {op.parts?.map(p => (
                                                    <div key={p.id} className="flex justify-between items-center text-muted-foreground ml-4">
                                                        <span>
                                                            {p.quantity || 1} x {p.name || 'N/A'} @ {formatCurrency(p.cost || 0)}
                                                            {p.costIncGst ? ` (${formatCurrency(p.costIncGst)} inc. GST)` : ''}
                                                        </span>
                                                        <span className="font-medium text-right w-28">{formatCurrency((p.cost || 0) * (p.quantity || 1))}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {editingOperation !== undefined && (
                        <Card className="mt-4">
                            <CardContent className="p-6">
                                <OperationForm
                                    key={editingOperation ? editingOperation.id : 'new'}
                                    initialData={editingOperation}
                                    onSave={handleSaveOperation}
                                    onCancel={handleCancelOperation}
                                />
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Separator />
                 {/* Version History */}
                {(quote.history?.length > 0 || historyQuotes.length > 0) && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-headline text-xl"><History />Version History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isHistoryLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-8 w-full" />
                                    <Skeleton className="h-8 w-full" />
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {historyQuotes.map(hq => (
                                        <li key={hq.id} className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50">
                                            <div>
                                                <Link href={`/quote/${hq.id}`} className="font-medium text-primary hover:underline">
                                                    {formatQuoteId(hq.id, hq.version)} ({hq.status})
                                                </Link>
                                                <p className="text-sm text-muted-foreground">
                                                    Created on {format(new Date(hq.createdAt), 'PPp')}
                                                </p>
                                            </div>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" size="sm" disabled={!isActionable}>Revert to this version</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Revert to an old version?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                          This will create a <span className="font-bold">new version</span> of the quote based on the contents of version {hq.version}. The current version will be archived. Are you sure?
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleRevertToVersion(hq)}>
                                                          Revert & Create New Version
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                )}


                <div className="flex justify-end">
                    <div className="w-full max-w-xs space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium text-right">{formatCurrency(subTotal)}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">GST (10%)</span>
                            <span className="font-medium text-right">{formatCurrency(gstAmount)}</span>
                        </div>
                        <Separator/>
                        <div className="flex justify-between items-baseline">
                            <span className="text-lg font-bold font-headline">Total</span>
                            <span className="text-2xl font-bold font-headline text-primary">{formatCurrency(totalCost)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center items-center gap-4 mt-6">
                     <Button size="lg" asChild>
                        <Link href={`/quote/${quote.id}/print`}>
                            <Printer className="mr-2 h-4 w-4" />
                            View Printable Quote
                        </Link>
                    </Button>
                    {!isActionable && (
                       <Button size="lg" variant="secondary" onClick={() => handleCreateNewVersion(quote)}>
                            <GitBranch className="mr-2 h-4 w-4" />
                            Create New Version
                        </Button>
                    )}
                </div>

            </CardContent>
        </Card>
    </div>
  );
};
