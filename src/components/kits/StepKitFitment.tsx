

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useKitForm } from './KitCreationForm';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardDescription, CardHeader, CardContent } from '@/components/ui/card';
import { getBoatBrands, getBoatRanges, getBoatModels } from '@/lib/storage';
import type { BoatBrand, BoatRange, BoatModel, Kit } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, X } from 'lucide-react';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';

interface StepKitFitmentProps {
    kitData: Partial<Kit>;
}

export default function StepKitFitment({ kitData }: StepKitFitmentProps) {
  const { setKitData, handleSave, handleBack, isSaving } = useKitForm();
  
  const [isLoading, setIsLoading] = useState(true);
  const [brands, setBrands] = useState<BoatBrand[]>([]);
  const [ranges, setRanges] = useState<BoatRange[]>([]);
  const [models, setModels] = useState<BoatModel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(new Set(kitData.fitment?.models || []));

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [brandsData, rangesData, modelsData] = await Promise.all([
        getBoatBrands(),
        getBoatRanges(),
        getBoatModels(),
      ]);
      setBrands(brandsData);
      setRanges(rangesData);
      setModels(modelsData);
      setIsLoading(false);
    }
    fetchData();
  }, []);
  
  const modelsWithBrandAndRange = useMemo(() => {
    const rangeMap = new Map(ranges.map(r => [r.id, r]));
    const brandMap = new Map(brands.map(b => [b.id, b]));
    return models.map(model => {
        const range = rangeMap.get(model.rangeId);
        const brand = range ? brandMap.get(range.brandId) : undefined;
        return {
            ...model,
            rangeName: range?.name || 'N/A',
            brandName: brand?.name || 'N/A',
        }
    })
  }, [models, ranges, brands]);


  const filteredModels = useMemo(() => {
    if (!searchTerm) return modelsWithBrandAndRange;
    const lowerSearch = searchTerm.toLowerCase();
    return modelsWithBrandAndRange.filter(model =>
        model.name.toLowerCase().includes(lowerSearch) ||
        model.rangeName.toLowerCase().includes(lowerSearch) ||
        model.brandName.toLowerCase().includes(lowerSearch)
    );
  }, [searchTerm, modelsWithBrandAndRange]);
  
  const selectedModels = useMemo(() => {
    return modelsWithBrandAndRange.filter(m => selectedModelIds.has(m.id!));
  }, [selectedModelIds, modelsWithBrandAndRange]);


  const handleModelToggle = (modelId: string, isSelected: boolean) => {
    const newSelectedIds = new Set(selectedModelIds);
    if (isSelected) {
      newSelectedIds.add(modelId);
    } else {
      newSelectedIds.delete(modelId);
    }
    setSelectedModelIds(newSelectedIds);
  };
  
  const onSubmit = () => {
    setKitData(prev => ({
        ...prev,
        fitment: {
            // Ensure all properties of fitment are correctly initialized as string[]
            brands: prev.fitment?.brands || [],
            ranges: prev.fitment?.ranges || [],
            models: Array.from(selectedModelIds),
        }
    }));
    handleSave();
  };

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  return (
    <>
      <CardHeader className="p-0 mb-6">
        <CardTitle className="font-headline text-2xl">Boat Fitment</CardTitle>
        <CardDescription>
          Select the specific models this kit applies to from the list on the right.
        </CardDescription>
      </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Left Column: Selected Models */}
            <div className="flex flex-col gap-4">
                <h3 className="font-semibold text-lg">Selected Models ({selectedModels.length})</h3>
                <Card>
                    <CardContent className="p-4">
                        <ScrollArea className="h-96">
                            {selectedModels.length > 0 ? (
                                <div className="space-y-2">
                                    {selectedModels.map(model => (
                                        <div key={model.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                            <div>
                                                <p className="font-medium">{model.name}</p>
                                                <p className="text-sm text-muted-foreground">{model.brandName} &bull; {model.rangeName}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => handleModelToggle(model.id!, false)}>
                                                <X className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <p>Select models from the list on the right.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
            {/* Right Column: Available Models */}
            <div className="flex flex-col gap-4">
                <h3 className="font-semibold text-lg">Available Models</h3>
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search models by name, range or brand..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                    {searchTerm && (
                        <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6" onClick={() => setSearchTerm('')}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                 <ScrollArea className="h-[28rem] rounded-md border p-4">
                    {filteredModels.map(model => (
                        <div key={model.id} className="flex items-center space-x-3 py-2">
                            <Checkbox
                                id={`model-${model.id}`}
                                checked={selectedModelIds.has(model.id!)}
                                onCheckedChange={(checked) => handleModelToggle(model.id!, !!checked)}
                            />
                            <label htmlFor={`model-${model.id}`} className="flex-1 cursor-pointer">
                                <p className="font-medium">{model.name}</p>
                                <p className="text-sm text-muted-foreground">{model.brandName} &bull; {model.rangeName}</p>
                            </label>
                        </div>
                    ))}
                    {filteredModels.length === 0 && (
                        <div className="text-center text-muted-foreground py-4">
                            No results found.
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
        <div className="flex justify-between mt-8">
            <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
            <Button type="button" onClick={onSubmit} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Kit'}</Button>
        </div>
    </>
  );
}
