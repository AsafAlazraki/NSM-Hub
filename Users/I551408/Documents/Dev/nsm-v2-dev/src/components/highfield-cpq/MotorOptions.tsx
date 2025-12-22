
"use client";

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { CatalogueMotor, Propeller, BoatModel } from '@/lib/types';
import { Card, CardContent } from '../ui/card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { useState, useEffect } from 'react';

const formatCurrency = (value: number) => {
    if (isNaN(value)) return '$0.00'
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
}

interface MotorOptionsProps {
    compatibleMotors: CatalogueMotor[];
    selectedMotor: CatalogueMotor | null;
    handleMotorSelection: (motorId: string) => void;
    selectedPropeller: Propeller | 'N/A' | null;
    handlePropellerSelection: (propId: string) => void;
    motorIncludesPreDelivery: boolean;
    setMotorIncludesPreDelivery: (checked: boolean) => void;
}

export const MotorOptions = ({ compatibleMotors, selectedMotor, handleMotorSelection, selectedPropeller, handlePropellerSelection, motorIncludesPreDelivery, setMotorIncludesPreDelivery }: MotorOptionsProps) => {
    const [activeStep, setActiveStep] = useState<'motor' | 'propeller' | null>('motor');

    useEffect(() => {
        // If a motor is selected but no prop, keep prop section open.
        if (selectedMotor && !selectedPropeller) {
            setActiveStep('propeller');
        } else if (selectedMotor && selectedPropeller) {
             setActiveStep(null); // All done, collapse all
        } else {
            setActiveStep('motor'); // Default to motor selection
        }
    }, [selectedMotor, selectedPropeller]);


    const handleLocalMotorSelection = (motorId: string) => {
        handleMotorSelection(motorId);
        setActiveStep('propeller');
    };

    const handleLocalPropellerSelection = (propId: string) => {
        handlePropellerSelection(propId);
        setActiveStep(null);
    };

    if (compatibleMotors.length === 0) {
        return <p className="p-4 text-center text-muted-foreground">No compatible motors for this model.</p>;
    }
    
    const selectedPropellerId = typeof selectedPropeller === 'object' && selectedPropeller !== null ? selectedPropeller.id : selectedPropeller;

    return (
        <Card>
            <CardContent className="p-4 space-y-2">
                <Collapsible
                    open={activeStep === 'motor'}
                    onOpenChange={(isOpen) => setActiveStep(isOpen ? 'motor' : null)}
                >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted font-semibold text-md">
                        <span>Select Motor</span>
                        <ChevronDown className={cn("h-5 w-5 transition-transform", activeStep === 'motor' && "rotate-180")} />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="p-2">
                            <RadioGroup onValueChange={handleLocalMotorSelection} value={selectedMotor?.id || ''}>
                                <div className="grid grid-cols-1 gap-2 pt-2">
                                    {compatibleMotors.map(motor => (
                                        <Label key={motor.id} htmlFor={`motor-${motor.id}`} className="flex items-center justify-between gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent has-[:checked]:bg-primary/20 has-[:checked]:border-primary text-sm">
                                            <div className="flex items-center gap-4">
                                                <RadioGroupItem value={motor.id!} id={`motor-${motor.id}`} />
                                                <div>
                                                    <span className="font-semibold">{motor.name}</span>
                                                    {motor.includesPreDelivery && <Badge variant="secondary" className="ml-2">Incl. PD</Badge>}
                                                </div>
                                            </div>
                                            <span className="font-semibold text-primary">{formatCurrency(motor.sellPrice)}</span>
                                        </Label>
                                    ))}
                                </div>
                            </RadioGroup>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
                
                {selectedMotor && (
                    <Collapsible
                        open={activeStep === 'propeller'}
                        onOpenChange={(isOpen) => setActiveStep(isOpen ? 'propeller' : null)}
                        disabled={!selectedMotor}
                    >
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted font-semibold text-md disabled:opacity-50" disabled={!selectedMotor}>
                        <span>Select Propeller</span>
                        <ChevronDown className={cn("h-5 w-5 transition-transform", activeStep === 'propeller' && "rotate-180")} />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="p-2">
                                <RadioGroup 
                                    onValueChange={handleLocalPropellerSelection} 
                                    value={selectedPropellerId || ''}
                                >
                                    <div className="grid grid-cols-1 gap-2 pt-2">
                                        <Label htmlFor="prop-na" className="flex items-center justify-between gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent has-[:checked]:bg-primary/20 has-[:checked]:border-primary text-sm">
                                            <div className="flex items-center gap-4">
                                                <RadioGroupItem value="N/A" id="prop-na" />
                                                <span className="font-semibold">N/A (No Propeller)</span>
                                            </div>
                                            <span className="font-semibold text-primary">{formatCurrency(0)}</span>
                                        </Label>
                                        {(selectedMotor.propellers || []).map(prop => (
                                            <Label key={prop.id} htmlFor={`prop-${prop.id}`} className="flex items-center justify-between gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent has-[:checked]:bg-primary/20 has-[:checked]:border-primary text-sm">
                                                <div className="flex items-center gap-4">
                                                    <RadioGroupItem value={prop.id!} id={`prop-${prop.id}`} />
                                                    <span className="font-semibold">{prop.name}</span>
                                                </div>
                                                <span className="font-semibold text-primary">{formatCurrency(prop.sellPrice)}</span>
                                            </Label>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                )}
                <Separator/>
                <div className="flex items-center space-x-2 p-2">
                    <Checkbox 
                        id="motor-pre-delivery" 
                        checked={motorIncludesPreDelivery}
                        onCheckedChange={setMotorIncludesPreDelivery}
                    />
                    <Label
                        htmlFor="motor-pre-delivery"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Includes Pre Delivery & Install
                    </Label>
                </div>
            </CardContent>
        </Card>
    );
};
