
"use client";

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { RiggingKit } from '@/lib/types';
import { Card, CardContent } from '../ui/card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
};

interface RiggingOptionsProps {
    riggingKits: RiggingKit[];
    selectedRiggingKit: RiggingKit | null;
    onKitSelect: (kitId: string) => void;
    riggingIncludesInstallation: boolean;
    setRiggingIncludesInstallation: (checked: boolean) => void;
}

export const RiggingOptions = ({
    riggingKits,
    selectedRiggingKit,
    onKitSelect,
    riggingIncludesInstallation,
    setRiggingIncludesInstallation,
}: RiggingOptionsProps) => {

    if (riggingKits.length === 0) {
        return <p className="p-4 text-center text-muted-foreground">No rigging kits available.</p>;
    }

    return (
        <Card>
            <CardContent className="p-4 space-y-2">
                <RadioGroup onValueChange={onKitSelect} value={selectedRiggingKit?.id || ''}>
                    <div className="grid grid-cols-1 gap-2 pt-2">
                        {riggingKits.map(kit => (
                            <Label key={kit.id} htmlFor={`kit-${kit.id}`} className="flex items-center justify-between gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent has-[:checked]:bg-primary/20 has-[:checked]:border-primary text-sm">
                                <div className="flex items-center gap-4">
                                    <RadioGroupItem value={kit.id!} id={`kit-${kit.id}`} />
                                    <span className="font-semibold">{kit.name}</span>
                                </div>
                                <span className="font-semibold text-primary">{formatCurrency(kit.sellPrice)}</span>
                            </Label>
                        ))}
                    </div>
                </RadioGroup>

                <Separator />
                <div className="flex items-center space-x-2 p-2">
                    <Checkbox
                        id="rigging-installation"
                        checked={riggingIncludesInstallation}
                        onCheckedChange={setRiggingIncludesInstallation}
                    />
                    <Label
                        htmlFor="rigging-installation"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Includes Installation
                    </Label>
                </div>
            </CardContent>
        </Card>
    );
};
