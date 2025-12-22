

"use client";

import type { Kit, KitStatus, BoatBrand, BoatRange, BoatModel, UserDetails } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Ship, Package, MoreVertical, Trash2, Settings, Edit, ArchiveRestore } from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import Link from 'next/link';

interface KitCardProps {
  kit: Kit;
  index: number;
  onArchiveKit?: (kit: Kit) => void;
  onRestoreKit?: (kit: Kit) => void;
  isArchiveView?: boolean;
}

const statusClassMap: Record<KitStatus, string> = {
    'Created by Sales': 'bg-blue-500/20 text-blue-700 border-blue-500/30',
    'Awaiting checks': 'bg-purple-500/20 text-purple-700 border-purple-500/30',
    'Approved by P&A': 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
    'Awaiting Confirmation': 'bg-orange-400/20 text-orange-600 border-orange-400/30',
    'Approved by Service': 'bg-orange-500/20 text-orange-700 border-orange-500/30',
    'Completed': 'bg-green-500/20 text-green-700 border-green-500/30',
    'Archived': 'bg-gray-500/20 text-gray-700 border-gray-500/30',
};

export const KitCard = ({ kit, index, onArchiveKit, onRestoreKit, isArchiveView = false }: KitCardProps) => {

    const totalPartsCost = useMemo(() => {
        return (kit.parts || []).reduce((total, part) => total + (part.sellPrice || 0), 0);
    }, [kit.parts]);

    const fitmentCount = kit.fitment?.models?.length || 0;

    const isViewable = ['Awaiting checks', 'Awaiting Confirmation', 'Approved by Service', 'Completed'].includes(kit.status);


    return (
        <Draggable draggableId={kit.id} index={index} isDragDisabled={isArchiveView}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="mb-4"
                >
                    <Card className={cn(
                        "hover:shadow-md transition-shadow",
                        snapshot.isDragging && "shadow-xl border-primary"
                    )}>
                        <CardHeader className="pb-2">
                             <div className="flex justify-between items-center mb-2">
                                <Badge className={cn("text-xs", statusClassMap[kit.status])}>{kit.status}</Badge>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/kits/${kit.id}`}>
                                                <Edit className="mr-2 h-4 w-4" /> View / Edit
                                            </Link>
                                        </DropdownMenuItem>
                                        {!isArchiveView && onArchiveKit && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Archive
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will move the kit "{kit.name}" to the archive. You can restore it later.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => onArchiveKit(kit)}>Archive</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <CardTitle className="text-base font-bold leading-tight">{kit.name}</CardTitle>
                            <CardDescription className="text-xs pt-1">
                                Created on {format(new Date(kit.createdAt), 'dd/MM/yyyy')} by {kit.user.name}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="py-2 text-sm space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Package className="w-4 h-4" />
                                <span>{kit.parts?.length || 0} Parts</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Ship className="w-4 h-4" />
                                <span>Fits {fitmentCount} Models</span>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center pt-2">
                             <span className="text-lg font-bold font-headline text-primary">
                                {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(totalPartsCost)}
                            </span>
                            {isArchiveView && onRestoreKit && (
                                <Button variant="outline" size="sm" onClick={() => onRestoreKit(kit)}>
                                    <ArchiveRestore className="mr-2 h-4 w-4" /> Restore
                                </Button>
                            )}
                             {isViewable && !isArchiveView && (
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/kits/${kit.id}`}>View</Link>
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            )}
        </Draggable>
    )
}
