
"use client";

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { BoatModel } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Check } from 'lucide-react';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
}

interface ConsoleOptionsProps {
    selectedModel: BoatModel | null;
    selectedConsole: BoatModel['consoleOptions'][0] | null;
    handleConsoleSelection: (consoleName: string) => void;
}

export const ConsoleOptions = ({ selectedModel, selectedConsole, handleConsoleSelection }: ConsoleOptionsProps) => {
    const standardOption = selectedModel?.consoleOptions?.find(opt => opt.asStandard);

    if (!selectedModel) {
        return <p className="p-4 text-center text-muted-foreground">Please select a model first.</p>;
    }
    
    if (standardOption) {
        return (
             <Card>
                <CardHeader>
                     <CardTitle>{standardOption.name}</CardTitle>
                     <CardDescription>This console is included as standard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/10">
                        <div className="flex items-center gap-2">
                             <Check className="text-primary"/>
                             <span className="font-semibold">{standardOption.name}</span>
                        </div>
                        <Badge variant="outline">Standard</Badge>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const availableOptions = selectedModel.consoleOptions || [];

    if (availableOptions.length === 0) {
        return <p className="p-4 text-center text-muted-foreground">No console options available for this model.</p>;
    }


    return (
         <RadioGroup onValueChange={handleConsoleSelection} value={selectedConsole?.name || ''}>
            <div className="grid grid-cols-1 gap-4 pt-2">
                {availableOptions.map(option => (
                    <Label key={option.name} htmlFor={`console-${option.name}`} className="flex items-center justify-between gap-2 p-4 border rounded-lg cursor-pointer hover:bg-accent has-[:checked]:bg-primary/20 has-[:checked]:border-primary">
                        <div className="flex items-center gap-4">
                            <RadioGroupItem value={option.name} id={`console-${option.name}`} />
                            <span className="font-semibold">{option.name}</span>
                        </div>
                        <span className="font-semibold text-primary">{formatCurrency(option.price)}</span>
                    </Label>
                ))}
            </div>
        </RadioGroup>
    );
};
