
"use client";

import React, { useState, useMemo } from 'react';
import type { DealerFitBrand, DealerFitCategory, DealerFitPart } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, X } from 'lucide-react';
import { Button } from '../ui/button';

interface DealerFitOptionsProps {
    allBrands: DealerFitBrand[];
    allCategories: DealerFitCategory[];
    allParts: DealerFitPart[];
    predefinedPartIds: string[];
    selectedPartIds: string[];
    onPartToggle: (partId: string) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
};

const PartItem = ({ part, brandName, categoryName, isSelected, onToggle }: { part: DealerFitPart, brandName: string, categoryName: string, isSelected: boolean, onToggle: () => void }) => {
    return (
        <div key={part.id} className="flex items-center space-x-3 py-2 border-b">
            <Checkbox
                id={`dfo-part-${part.id}`}
                checked={isSelected}
                onCheckedChange={onToggle}
            />
            <label htmlFor={`dfo-part-${part.id}`} className="flex-1 cursor-pointer">
                <p className="font-medium">{part.name}</p>
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                        {brandName} &bull; {categoryName}
                    </p>
                    <p className="font-semibold text-primary">{formatCurrency(part.sellPrice)}</p>
                </div>
            </label>
        </div>
    );
};

export const DealerFitOptions = ({ allBrands, allCategories, allParts, predefinedPartIds, selectedPartIds, onPartToggle }: DealerFitOptionsProps) => {
    const [searchTerm, setSearchTerm] = useState('');

    const brandMap = useMemo(() => new Map(allBrands.map(b => [b.id, b.name])), [allBrands]);
    const categoryMap = useMemo(() => new Map(allCategories.map(c => [c.id, c.name])), [allCategories]);

    const predefinedParts = useMemo(() => {
        const predefinedSet = new Set(predefinedPartIds);
        return allParts.filter(part => predefinedSet.has(part.id!));
    }, [allParts, predefinedPartIds]);

    const filteredParts = useMemo(() => {
        if (!searchTerm) return allParts;
        const lowerSearch = searchTerm.toLowerCase();
        return allParts.filter(part =>
            part.name.toLowerCase().includes(lowerSearch) ||
            brandMap.get(part.brandId!)?.toLowerCase().includes(lowerSearch) ||
            categoryMap.get(part.categoryId!)?.toLowerCase().includes(lowerSearch)
        );
    }, [searchTerm, allParts, brandMap, categoryMap]);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Dealer Fit Options</CardTitle>
                <CardDescription>Select any dealer-installed options for the package.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="predefined" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="predefined">Predefined</TabsTrigger>
                        <TabsTrigger value="all">All Options</TabsTrigger>
                    </TabsList>
                    <TabsContent value="predefined">
                        <ScrollArea className="h-96 w-full rounded-md border mt-4">
                            <div className="p-4">
                                {predefinedParts.length > 0 ? predefinedParts.map(part => (
                                    <PartItem
                                        key={part.id}
                                        part={part}
                                        brandName={brandMap.get(part.brandId!) || 'N/A'}
                                        categoryName={categoryMap.get(part.categoryId!) || 'N/A'}
                                        isSelected={selectedPartIds.includes(part.id!)}
                                        onToggle={() => onPartToggle(part.id!)}
                                    />
                                )) : (
                                    <p className="text-center text-muted-foreground py-8">No predefined options for this model.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="all">
                        <div className="relative mt-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search all parts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                            {searchTerm && <Button variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2" onClick={() => setSearchTerm('')}><X className="h-4 w-4" /></Button>}
                        </div>
                        <ScrollArea className="h-[22rem] w-full rounded-md border mt-2">
                            <div className="p-4">
                                {filteredParts.map(part => (
                                     <PartItem
                                        key={part.id}
                                        part={part}
                                        brandName={brandMap.get(part.brandId!) || 'N/A'}
                                        categoryName={categoryMap.get(part.categoryId!) || 'N/A'}
                                        isSelected={selectedPartIds.includes(part.id!)}
                                        onToggle={() => onPartToggle(part.id!)}
                                    />
                                ))}
                                {filteredParts.length === 0 && (
                                    <p className="text-center text-muted-foreground py-8">No results found.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};
