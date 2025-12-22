
"use client";

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { BoatModel, BoatRange } from '@/lib/types';
import { Card, CardContent } from '../ui/card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
}

export const HullOptions = ({ 
    models, 
    ranges, 
    selectedRangeId, 
    selectedModelId, 
    handleRangeSelection, 
    handleModelSelection, 
    selectedColor, 
    handleColorChange, 
    selectedModel, 
    selectedMaterial, 
    handleMaterialChange,
    activeHullStep,
    setActiveHullStep,
    hullIncludesPreDelivery,
    setHullIncludesPreDelivery,
    hullIncludesRegistration,
    setHullIncludesRegistration,
}) => {
    const modelsForSelectedRange = selectedRangeId ? models.filter(m => m.rangeId === selectedRangeId) : [];

    const handleOpenChange = (step: 'hull-range' | 'hull-model' | 'hull-material' | 'hull-color', isOpen: boolean) => {
        if (isOpen) {
            setActiveHullStep(step);
        } else {
            // If the user is closing the currently active step, we can set active step to none.
            if (activeHullStep === step) {
                setActiveHullStep(null);
            }
        }
    };


    return (
        <Card>
            <CardContent className="p-4 space-y-2">
                 <Collapsible
                    open={activeHullStep === 'hull-range'}
                    onOpenChange={(isOpen) => handleOpenChange('hull-range', isOpen)}
                 >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted font-semibold text-md">
                        <span>Select Range</span>
                        <ChevronDown className={cn("h-5 w-5 transition-transform", activeHullStep === 'hull-range' && "rotate-180")} />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="p-2">
                             <RadioGroup onValueChange={handleRangeSelection} value={selectedRangeId || ''}>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                                    {ranges.map(range => (
                                        <Label key={range.id} htmlFor={`range-${range.id}`} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent has-[:checked]:bg-primary/20 has-[:checked]:border-primary text-sm"><RadioGroupItem value={range.id!} id={`range-${range.id}`} /><span>{range.name}</span></Label>
                                    ))}
                                </div>
                            </RadioGroup>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
                 <Collapsible
                    open={activeHullStep === 'hull-model'}
                    onOpenChange={(isOpen) => handleOpenChange('hull-model', isOpen)}
                    disabled={!selectedRangeId}
                 >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted font-semibold text-md disabled:opacity-50" disabled={!selectedRangeId}>
                        <span>Select Model</span>
                        <ChevronDown className={cn("h-5 w-5 transition-transform", activeHullStep === 'hull-model' && "rotate-180")} />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="p-2">
                             <RadioGroup onValueChange={handleModelSelection} value={selectedModelId || ''} disabled={!selectedRangeId}>
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    {modelsForSelectedRange.map(model => (
                                        <Label key={model.id} htmlFor={`model-${model.id}`} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent has-[:checked]:bg-primary/20 has-[:checked]:border-primary text-sm"><RadioGroupItem value={model.id!} id={`model-${model.id}`} /><span>{model.name}</span></Label>
                                    ))}
                                </div>
                                {selectedRangeId && modelsForSelectedRange.length === 0 && <p className="text-muted-foreground text-center text-sm pt-2">No models in this range.</p>}
                            </RadioGroup>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
                {selectedModel && (selectedModel.materials && selectedModel.materials.length > 0) && (
                    <Collapsible
                        open={activeHullStep === 'hull-material'}
                        onOpenChange={(isOpen) => handleOpenChange('hull-material', isOpen)}
                        disabled={!selectedModelId}
                    >
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted font-semibold text-md disabled:opacity-50" disabled={!selectedModelId}>
                           <span>Select Material</span>
                           <ChevronDown className={cn("h-5 w-5 transition-transform", activeHullStep === 'hull-material' && "rotate-180")} />
                        </CollapsibleTrigger>
                         <CollapsibleContent>
                            <div className="p-2">
                                <RadioGroup onValueChange={handleMaterialChange} value={selectedMaterial || ''}>
                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                        {selectedModel.materials.map(material => (
                                            <Label key={material} htmlFor={`material-${material}`} className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-accent has-[:checked]:bg-primary/20 has-[:checked]:border-primary"><RadioGroupItem value={material} id={`material-${material}`} /><span>{material}</span></Label>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                )}
                 {selectedModel && (selectedModel.colors && selectedModel.colors.length > 0) && (
                     <Collapsible
                        open={activeHullStep === 'hull-color'}
                        onOpenChange={(isOpen) => handleOpenChange('hull-color', isOpen)}
                        disabled={!selectedModelId || !selectedMaterial}
                    >
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted font-semibold text-md disabled:opacity-50" disabled={!selectedModelId || !selectedMaterial}>
                           <span>Select Colour</span>
                           <ChevronDown className={cn("h-5 w-5 transition-transform", activeHullStep === 'hull-color' && "rotate-180")} />
                        </CollapsibleTrigger>
                         <CollapsibleContent>
                            <div className="p-2">
                                 <RadioGroup onValueChange={handleColorChange} value={selectedColor?.name || ''}>
                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                        {selectedModel.colors.map(color => (
                                            <Label key={color.name} htmlFor={`color-${color.name}`} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent has-[:checked]:bg-primary/20 has-[:checked]:border-primary text-sm"><RadioGroupItem value={color.name} id={`color-${color.name}`} /><span>{color.name}</span></Label>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                )}
                 <Separator/>
                <div className="grid grid-cols-2 gap-4 p-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="hull-pre-delivery" 
                            checked={hullIncludesPreDelivery}
                            onCheckedChange={setHullIncludesPreDelivery}
                        />
                        <Label
                            htmlFor="hull-pre-delivery"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Includes Pre Delivery
                        </Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="hull-registration" 
                            checked={hullIncludesRegistration}
                            onCheckedChange={setHullIncludesRegistration}
                        />
                         <Label
                            htmlFor="hull-registration"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Includes Registration ({formatCurrency(200)})
                        </Label>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
