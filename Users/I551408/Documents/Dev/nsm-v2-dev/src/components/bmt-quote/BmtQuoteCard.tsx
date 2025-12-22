
"use client";

import type { BMTQuote, BMTQuoteStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Ship, User, MoreVertical, Edit, Trash2, PackageIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { saveBmtQuote } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

const statusClassMap: Record<BMTQuoteStatus, string> = {
  Draft: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
  'Sent to Customer': 'bg-blue-500/20 text-blue-700 border-blue-500/30',
  Approved: 'bg-green-500/20 text-green-700 border-green-500/30',
  'Not Approved': 'bg-red-500/20 text-red-700 border-red-500/30',
  Cancelled: 'bg-gray-500/20 text-gray-700 border-gray-500/30',
  Archived: 'bg-gray-500/20 text-gray-700 border-gray-500/30',
};

const formatCurrency = (value: number) => {
    if (isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
};

export const BmtQuoteCard = ({ quote, onDelete }: { quote: BMTQuote, onDelete: (quoteId: string) => void }) => {
    const { toast } = useToast();
    const { pricing, hullIncludesRegistration, selectedFactoryOptionIds, selectedDealerFitOptionIds } = quote;
    const { hullPrice = 0, consolePrice = 0, motorPrice = 0, propellerPrice = 0, riggingKitPrice = 0, trailerPrice = 0 } = pricing || {};
    
    // This calculation is a simplified version and may not match the summary page exactly
    // as it doesn't have access to all catalogue data here.
    // It is intended to be a representative total.
    let subtotalExGst = 0;
    subtotalExGst += hullPrice / 1.1; // Assume hull price might be inc. GST
    subtotalExGst += consolePrice;
    subtotalExGst += motorPrice;
    subtotalExGst += propellerPrice;
    subtotalExGst += riggingKitPrice;
    subtotalExGst += trailerPrice;

    if (hullIncludesRegistration) {
        subtotalExGst += (200 / 1.1);
    }
    
    // This is a rough calculation. For full accuracy, we'd need to fetch all options.
    // However, for a card view, this is a reasonable estimation.
    const totalCost = subtotalExGst * 1.1;
    
    const handleStatusChange = async (newStatus: BMTQuoteStatus) => {
        try {
            await saveBmtQuote({ ...quote, status: newStatus });
            toast({
                title: "Status Updated",
                description: `Quote status changed to ${newStatus}.`,
            });
             window.location.reload();
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update quote status.'
            });
        }
    };


    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
             <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                         <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                            <PackageIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="font-headline text-lg leading-tight">{quote.modelName}</CardTitle>
                             <CardDescription>
                                {quote.customer?.name || 'No Customer Assigned'}
                            </CardDescription>
                        </div>
                    </div>
                    <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={`/sales-hub/quotes/${quote.id}`}><Edit className="mr-2 h-4 w-4" />View / Edit</Link>
                                </DropdownMenuItem>
                                <AlertDialogTrigger asChild>
                                     <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Archive
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This action will archive the quote. You can restore it later.</AlertDialogDescription>
                            </AlertDialogHeader>
                             <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(quote.id)}>Archive</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>Created by: {quote.user?.name || 'N/A'}</span>
                </div>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Ship className="w-4 h-4" />
                    <span>
                        {quote.selectedMaterial ? `${quote.selectedMaterial} / ${quote.selectedColorName}` : 'No hull details'}
                    </span>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                 <span className="text-xl font-bold font-headline text-primary">
                    {formatCurrency(totalCost)}
                </span>
                 <Select value={quote.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className={cn("w-[150px] text-xs font-semibold px-2 py-1 h-auto", statusClassMap[quote.status])}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Sent to Customer">Sent to Customer</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Not Approved">Not Approved</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </CardFooter>
        </Card>
    );
};
