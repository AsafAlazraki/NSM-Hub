

import type { Quote, EstimateType } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Ship, User, Wrench, MoreVertical, Trash2, XCircle, ArchiveRestore, Copy, GitBranch, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Checkbox } from './ui/checkbox';

interface QuoteCardProps {
  quote: Quote;
  onDelete: (quoteId: string) => void;
  onCancel: (quoteId: string) => void;
  onStatusChange: (quoteId: string, newStatus: Quote['status']) => void;
  onRestore: (quoteId: string) => void;
  onNewVersion: (quoteId: string) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (quoteId: string) => void;
}

const statusClassMap: Record<Quote['status'], string> = {
  Estimate: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/30',
  'Work In Progress': 'bg-sky-500/20 text-sky-700 border-sky-500/30 hover:bg-sky-500/30',
  Pending: 'bg-orange-500/20 text-orange-700 border-orange-500/30 hover:bg-orange-500/30',
  Approved: 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30',
  Complete: 'bg-blue-500/20 text-blue-700 border-blue-500/30 hover:bg-blue-500/30',
  Cancelled: 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30',
  Deleted: 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30',
}

const typeClassMap: Record<EstimateType, string> = {
    'Installation': 'bg-cyan-500/20 text-cyan-700 border-cyan-500/30',
    'Insurance': 'bg-indigo-500/20 text-indigo-700 border-indigo-500/30',
    'Mechanical Estimate': 'bg-fuchsia-500/20 text-fuchsia-700 border-fuchsia-500/30',
};


const userColorClasses = [
  'bg-green-200 text-green-800 border-green-300',
  'bg-blue-200 text-blue-800 border-blue-300',
  'bg-purple-200 text-purple-800 border-purple-300',
  'bg-pink-200 text-pink-800 border-pink-300',
  'bg-indigo-200 text-indigo-800 border-indigo-300',
  'bg-teal-200 text-teal-800 border-teal-300',
]

const getUserColor = (userId?: string) => {
  // Simple hash function to get a consistent color for a user
  if (!userId) return userColorClasses[0];
  const hash = userId.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const index = Math.abs(hash) % userColorClasses.length;
  return userColorClasses[index];
}

const formatAndWrapTitle = (title: string) => {
  const words = title.split(' ');
  if (words.length > 2) {
    return (
      <>
        {words.slice(0, 2).join(' ')}
        <br />
        {words.slice(2).join(' ')}
      </>
    );
  }
  return title;
};

const formatQuoteIdForDisplay = (quote: Quote) => {
    if (!quote.id) return "QT-####";
    if (quote.id.startsWith('QUOTE-')) {
        return "New Quote";
    }
    
    let displayId = quote.id;
    const baseId = quote.id.split('-v')[0];
    if (baseId.startsWith('QT')) {
        const numberPart = baseId.substring(2);
        displayId = `QT ${numberPart}`;
    }

    if (quote.version > 1) {
        displayId += ` v${quote.version}`;
    }

    return displayId;
}


export const QuoteCard = ({ quote, onDelete, onCancel, onStatusChange, onRestore, onNewVersion, isSelectionMode = false, isSelected = false, onSelect }: QuoteCardProps) => {
  const totalOperations = quote.operations?.length || 0;
  const subTotal = (quote.operations || []).reduce((acc, op) => {
    const laborCost = (op.laborRate || 0) * (op.laborHours || 0);
    const partsCost = (op.parts || []).reduce((pAcc, part) => pAcc + ((part.cost || 0) * (part.quantity || 1)), 0);
    return acc + laborCost + partsCost;
  }, 0);
  const totalCostWithGst = subTotal * 1.10;


  const creatorName = quote.user?.name || "Unknown";
  const creatorColorClass = getUserColor(quote.userId);

  const displayId = formatAndWrapTitle(formatQuoteIdForDisplay(quote));

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  }
  
  const isArchivedView = quote.status === 'Deleted';

  return (
    <Card className={cn("flex flex-col h-full hover:shadow-lg transition-shadow duration-300 relative", isArchivedView && "bg-muted/50")}>
       {isSelectionMode && onSelect && (
            <div className="absolute top-2 left-2 z-10">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelect(quote.id)}
                    aria-label={`Select quote ${quote.id}`}
                />
            </div>
        )}
      <CardHeader className={cn(isSelectionMode && 'pl-10')}>
         <div className="flex justify-between items-start">
            <div className="space-y-1">
              <Badge className={cn("text-xs font-semibold px-2 py-1 h-auto", quote.estimateType ? typeClassMap[quote.estimateType] : 'bg-gray-500/20')}>
                <Tag className="mr-1 h-3 w-3" /> {quote.estimateType}
              </Badge>
              <CardTitle className="font-headline text-lg leading-tight pt-1">{displayId}</CardTitle>
              <CardDescription>{quote.customer?.name || 'N/A'}</CardDescription>
              {quote.boat?.insuranceRef && (
                  <CardDescription className="font-medium text-xs pt-1">Ins Ref: {quote.boat.insuranceRef}</CardDescription>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
                <Badge className={cn("text-xs px-3 py-1", creatorColorClass)}>
                    {creatorName}
                </Badge>
                 <Select 
                  value={quote.status}
                  onValueChange={(newStatus: Quote['status']) => onStatusChange(quote.id, newStatus)}
                  disabled={isArchivedView}
                >
                    <SelectTrigger 
                        className={cn(
                            "text-xs font-semibold px-3 py-1 h-auto border rounded-full focus:ring-0 focus:ring-offset-0 w-auto",
                            statusClassMap[quote.status]
                        )}
                        onClick={handleSelectClick}
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent onClick={handleSelectClick}>
                        <SelectItem value="Work In Progress">Work In Progress</SelectItem>
                        <SelectItem value="Estimate">Estimate</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Complete">Complete</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
      </CardHeader>
      <CardContent className={cn("flex-1 space-y-3", isSelectionMode && 'pl-10')}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{quote.createdAt ? format(new Date(quote.createdAt), 'MMMM d, yyyy') : 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Ship className="w-4 h-4" />
          <span>{[quote.boat?.make, quote.boat?.model].filter(Boolean).join(' ') || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Wrench className="w-4 h-4" />
          <span>{totalOperations} Operation{totalOperations !== 1 ? 's' : ''}</span>
        </div>
      </CardContent>
      <CardFooter className={cn("flex justify-between items-center", isSelectionMode && 'pl-10')}>
        <span className="text-xl font-bold font-headline text-primary">
          {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(totalCostWithGst)}
        </span>
        <div className="flex items-center">
            {isArchivedView ? (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline"><ArchiveRestore className="mr-2 h-4 w-4"/>Restore</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Restore this quote?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will restore the quote to an 'Work In Progress' status and make it active again.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onRestore(quote.id)}>Restore</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                 </AlertDialog>
            ) : (
             <>
                <Button asChild variant="outline">
                  <Link href={`/quote/${quote.id}`}>View</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                       <DropdownMenuItem onSelect={() => onNewVersion(quote.id)}>
                          <GitBranch className="mr-2 h-4 w-4" />
                          Create New Version
                       </DropdownMenuItem>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel Quote
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This will mark the quote as "Cancelled". This can be undone later by restoring it.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Nevermind</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onCancel(quote.id)}>Yes, Cancel Quote</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        
                      <DropdownMenuSeparator />

                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This will move the quote to the bin. You can restore it later.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onDelete(quote.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
            </>
            )}
        </div>
      </CardFooter>
    </Card>
  );
};
