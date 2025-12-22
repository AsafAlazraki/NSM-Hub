
"use client";

import React, { useEffect, useState } from 'react';
import type { CataloguePart, DealerFitPart } from '@/lib/types';
import { getDealerFitParts } from '@/lib/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

interface PartsCatalogueDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onAdd: (part: CataloguePart) => void;
}

export const PartsCatalogueDialog = ({ isOpen, setIsOpen, onAdd }: PartsCatalogueDialogProps) => {
  const [parts, setParts] = useState<DealerFitPart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getDealerFitParts().then(data => {
        setParts(data);
        setIsLoading(false);
      }).catch(err => {
        console.error("Failed to load dealer fit parts", err);
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  const handleSelect = (part: DealerFitPart) => {
    // Adapt DealerFitPart to CataloguePart for the onAdd function
    const cataloguePart: CataloguePart = {
        name: part.name,
        cost: part.sellPrice, // Assuming sellPrice from dealer fit should be cost in quote
        quantity: 1
    }
    onAdd(cataloguePart);
    setIsOpen(false);
    setSearchTerm('');
  };

  const filteredParts = parts.filter(part => 
    part.name && part.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Add from Parts Catalogue</DialogTitle>
          <DialogDescription>
            Select a part to add it to the operation. The 'Sell' price from the catalogue will be used as the 'Cost' in the quote.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
            <Input 
                placeholder="Search for a part..."
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
                    ) : filteredParts.length > 0 ? (
                        <div className="space-y-2">
                            {filteredParts.map((part) => (
                                <div
                                    key={part.id}
                                    onClick={() => handleSelect(part)}
                                    className="flex justify-between items-center p-2 rounded-md hover:bg-accent cursor-pointer"
                                >
                                    <p className="font-medium">{part.name}</p>
                                    <p className="font-semibold">
                                        ${(part.sellPrice || 0).toFixed(2)}
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
