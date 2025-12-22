
"use client";

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { CatalogueTrailer } from '@/lib/types';
import { Card, CardContent } from '../ui/card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
}

interface TrailerOptionsProps {
    allTrailers: CatalogueTrailer[];
    selectedTrailer: CatalogueTrailer | null;
    onTrailerSelect: (trailerId: string) => void;
    trailerIncludesPreDelivery: boolean;
    setTrailerIncludesPreDelivery: (checked: boolean) => void;
    trailerIncludesRegistration: boolean;
    setTrailerIncludesRegistration: (checked: boolean) => void;
}

export const TrailerOptions = ({ allTrailers, selectedTrailer, onTrailerSelect, trailerIncludesPreDelivery, setTrailerIncludesPreDelivery, trailerIncludesRegistration, setTrailerIncludesRegistration }: TrailerOptionsProps) => {

    if (allTrailers.length === 0) {
        return <p className="p-4 text-center text-muted-foreground">No trailers available in the catalogue.</p>;
    }
    
    return (
        <Card>
            <CardContent className="p-4 space-y-2">
                <Collapsible
                    open={true} // Always open
                >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted font-semibold text-md cursor-default">
                        <span>Select Trailer</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="p-2">
                            <RadioGroup onValueChange={onTrailerSelect} value={selectedTrailer?.id || ''}>
                                <div className="grid grid-cols-1 gap-2 pt-2">
                                    {allTrailers.map(trailer => (
                                         <Label key={trailer.id} htmlFor={`trailer-${trailer.id}`} className="flex items-center justify-between gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent has-[:checked]:bg-primary/20 has-[:checked]:border-primary text-sm">
                                            <div className="flex items-center gap-4">
                                                <RadioGroupItem value={trailer.id!} id={`trailer-${trailer.id}`} />
                                                <span className="font-semibold">{trailer.name}</span>
                                            </div>
                                            <span className="font-semibold text-primary">{formatCurrency(trailer.price)}</span>
                                        </Label>
                                    ))}
                                </div>
                            </RadioGroup>
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                <Separator/>
                <div className="grid grid-cols-2 gap-4 p-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="trailer-pre-delivery" 
                            checked={trailerIncludesPreDelivery}
                            onCheckedChange={setTrailerIncludesPreDelivery}
                        />
                        <Label
                            htmlFor="trailer-pre-delivery"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Includes Pre Delivery
                        </Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="trailer-registration" 
                            checked={trailerIncludesRegistration}
                            onCheckedChange={setTrailerIncludesRegistration}
                        />
                        <Label
                            htmlFor="trailer-registration"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Includes Registration
                        </Label>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
