
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useKitForm } from './KitCreationForm';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardDescription, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { getDealerFitCategories, getDealerFitParts } from '@/lib/storage';
import type { DealerFitCategory, DealerFitPart } from '@/lib/types';
import { Search, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function StepKitParts() {
    const { kitData, setKitData, handleNext, handleBack } = useKitForm();
    
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState<DealerFitCategory[]>([]);
    const [allParts, setAllParts] = useState<DealerFitPart[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            const [categoriesData, partsData] = await Promise.all([
                getDealerFitCategories(),
                getDealerFitParts(),
            ]);
            setCategories(categoriesData);
            setAllParts(partsData);
            setIsLoading(false);
        }
        fetchData();
    }, []);

    const selectedPartIds = useMemo(() => new Set(kitData.parts?.map(p => p.id)), [kitData.parts]);

    const handlePartToggle = (part: DealerFitPart, isSelected: boolean) => {
        if (isSelected) {
            setKitData(prev => ({
                ...prev,
                parts: [...(prev.parts || []), part],
            }));
        } else {
            setKitData(prev => ({
                ...prev,
                parts: (prev.parts || []).filter(p => p.id !== part.id),
            }));
        }
    };
    
    const unselectPart = (partId: string) => {
         setKitData(prev => ({
            ...prev,
            parts: (prev.parts || []).filter(p => p.id !== partId),
        }));
    }

    const filteredParts = useMemo(() => {
        if (!searchTerm) return allParts;
        const lowerSearch = searchTerm.toLowerCase();

        const categoryMatches = categories
            .filter(c => c.name.toLowerCase().includes(lowerSearch))
            .map(c => c.id);

        return allParts.filter(part =>
            part.name.toLowerCase().includes(lowerSearch) ||
            (part.supplier && part.supplier.toLowerCase().includes(lowerSearch)) ||
            (part.code && part.code.toLowerCase().includes(lowerSearch)) ||
            (part.categoryId && categoryMatches.includes(part.categoryId))
        );
    }, [searchTerm, allParts, categories]);

    const totalKitCost = useMemo(() => {
        return (kitData.parts || []).reduce((total, part) => total + (part.sellPrice || 0), 0);
    }, [kitData.parts]);


    if (isLoading) {
        return <Skeleton className="h-[400px] w-full" />;
    }

    return (
        <>
            <CardHeader className="p-0 mb-6">
                <CardTitle className="font-headline text-2xl">Design Kit Parts</CardTitle>
                <CardDescription>
                    Select parts from your catalogue to include in this kit.
                </CardDescription>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Selected Parts */}
                <div className="flex flex-col gap-4">
                    <h3 className="font-semibold text-lg">Selected Parts ({kitData.parts?.length || 0})</h3>
                     <Card>
                        <CardContent className="p-4">
                             <ScrollArea className="h-96">
                                {(kitData.parts?.length || 0) > 0 ? (
                                    <div className="space-y-2">
                                        {kitData.parts?.map(part => (
                                            <div key={part.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                                <div>
                                                    <p className="font-medium">{part.name}</p>
                                                    <p className="text-sm text-muted-foreground">${(part.sellPrice || 0).toFixed(2)}</p>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => unselectPart(part.id!)}>
                                                    <X className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        <p>Select parts from the list on the right.</p>
                                    </div>
                                )}
                            </ScrollArea>
                            <Separator className="my-4"/>
                            <div className="flex justify-between items-center font-bold text-lg px-2">
                                <span>Total Kit Cost:</span>
                                <span>${totalKitCost.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {/* Right Column: Available Parts */}
                <div className="flex flex-col gap-4">
                    <h3 className="font-semibold text-lg">Available Parts</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search parts by name, code, supplier or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                        {searchTerm && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                                onClick={() => setSearchTerm('')}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <ScrollArea className="h-[28rem] rounded-md border p-4">
                        {filteredParts.map(part => (
                            <div key={part.id} className="flex items-center space-x-3 py-2">
                                <Checkbox
                                    id={`part-${part.id}`}
                                    checked={selectedPartIds.has(part.id!)}
                                    onCheckedChange={(checked) => handlePartToggle(part, !!checked)}
                                />
                                <label htmlFor={`part-${part.id}`} className="flex-1 cursor-pointer">
                                    <p className="font-medium">{part.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {part.code} &bull; ${(part.sellPrice || 0).toFixed(2)}
                                    </p>
                                </label>
                            </div>
                        ))}
                         {filteredParts.length === 0 && (
                            <div className="text-center text-muted-foreground py-4">
                                No results found.
                            </div>
                         )}
                    </ScrollArea>
                </div>
            </div>
             <div className="flex justify-between mt-8">
                <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
                <Button type="button" onClick={handleNext}>Next</Button>
            </div>
        </>
    );
}
