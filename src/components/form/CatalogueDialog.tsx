
"use client";

import React, { useEffect, useState } from 'react';
import type { CatalogueOperation } from '@/lib/types';
import { getCatalogueOperations } from '@/lib/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CatalogueDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onAdd: (operations: CatalogueOperation[]) => void;
}

export const CatalogueDialog = ({ isOpen, setIsOpen, onAdd }: CatalogueDialogProps) => {
  const [operations, setOperations] = useState<CatalogueOperation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getCatalogueOperations().then(data => {
        setOperations(data);
        setIsLoading(false);
      }).catch(err => {
        console.error("Failed to load catalogue operations", err);
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  const handleSelect = (operation: CatalogueOperation) => {
    onAdd([operation]); // onAdd expects an array
    setIsOpen(false);
    setSearchTerm('');
  };

  const filteredOperations = operations.filter(op => 
    op.heading && op.heading.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const calculateTotalCost = (op: CatalogueOperation) => {
    const laborCost = (op.laborHours || 0) * (op.laborRate || 0);
    const partsCost = (op.parts || []).reduce((sum, part) => sum + (part.cost || 0) * (part.quantity || 1), 0);
    return laborCost + partsCost;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Add from Operation Catalogue</DialogTitle>
          <DialogDescription>
            Select an operation to add it to the quote.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
            <Input 
                placeholder="Search for an operation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ScrollArea className="h-72 w-full rounded-md border">
                 <div className="p-4">
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    ) : filteredOperations.length > 0 ? (
                        <div className="space-y-2">
                            {filteredOperations.map((op) => (
                                <div
                                    key={op.heading}
                                    onClick={() => handleSelect(op)}
                                    className="flex justify-between items-center p-2 rounded-md hover:bg-accent cursor-pointer"
                                >
                                    <div>
                                        <p className="font-medium">{op.heading}</p>
                                        <p className="text-sm text-muted-foreground">
                                           {op.parts?.length || 0} part{op.parts?.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <p className="font-semibold">
                                        ${calculateTotalCost(op).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-4">
                            No results found.
                        </div>
                    )}
                 </div>
            </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
