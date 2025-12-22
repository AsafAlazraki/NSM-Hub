
"use client";

import type { Customer, Quote, BMTQuote } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User, Ship, Phone, Mail, MapPin, ArrowRight, MoreVertical, Trash2, FileText } from 'lucide-react';
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

interface CustomerCardProps {
    customer: Customer & { quoteCount?: number, lastActivity?: number, assetCount: number };
    onDeleteCustomer: (customerId: string) => void;
}

export const CustomerCard = ({ customer, onDeleteCustomer }: CustomerCardProps) => {
    const totalQuotes = customer.quoteCount || 0;
    const totalAssets = customer.assetCount || 0;
    const lastActivity = customer.lastActivity ? new Date(customer.lastActivity) : null;

    const getFullAddress = () => {
        if (!customer?.address) return null;
        const { street, suburb, state, postcode } = customer.address;
        if (!street && !suburb && !state && !postcode) return null;
        return [street, [suburb, state, postcode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    };

    const handleDelete = () => {
        if (customer.id) {
          onDeleteCustomer(customer.id);
        }
    }

    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 font-headline text-lg">
                            <User /> {customer.name}
                        </CardTitle>
                        <CardDescription>
                            {lastActivity ? `Last activity: ${lastActivity.toLocaleDateString()}` : 'No activity yet'}
                        </CardDescription>
                    </div>
                     <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Customer
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the customer "{customer.name}" and all of their associated quotes ({totalQuotes} quotes).
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>
                                    Yes, delete customer
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{customer.phone || 'N/A'}</span>
                </div>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{customer.email || 'N/A'}</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <span>{getFullAddress() || 'N/A'}</span>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1" title="Quotes">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">{totalQuotes}</span>
                    </div>
                    <div className="flex items-center gap-1" title="Assets">
                        <Ship className="h-4 w-4" />
                        <span className="font-medium">{totalAssets}</span>
                    </div>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href={`/sales-hub/customers/${encodeURIComponent(customer.id!)}`}>View Profile <ArrowRight className="ml-2 h-4 w-4"/></Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

    