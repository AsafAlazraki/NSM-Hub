
"use client";

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

type Step = 'base-package' | 'factory-fit' | 'dealer-fit' | 'summary';

const STEPS: { id: Step, name: string, path: string }[] = [
    { id: 'base-package', name: 'Base Package', path: 'base-package' },
    { id: 'factory-fit', name: 'Factory Fit Options', path: 'factory-fit' },
    { id: 'dealer-fit', name: 'Dealer Fit Options', path: 'dealer-fit' },
    { id: 'summary', name: 'Summary', path: 'summary' },
];

interface ConfigurationStepperProps {
    brandId: string;
    modelId: string | null;
    quoteId: string | null;
    currentStep: Step;
}

export const ConfigurationStepper = ({ brandId, modelId, quoteId, currentStep }: ConfigurationStepperProps) => {
    const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

    return (
        <nav aria-label="Progress">
            <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
                {STEPS.map((step, stepIdx) => {
                    const isCompleted = stepIdx < currentStepIndex;
                    const isCurrent = stepIdx === currentStepIndex;
                    
                    const isClickable = !!(modelId && quoteId);
                    
                    let href = '#';
                    if (isClickable) {
                        if (step.id === 'summary') {
                            href = `/highfield-cpq/summary/${quoteId}`;
                        } else {
                            href = `/highfield-cpq/configure/${brandId}/${modelId}/${step.path}?quoteId=${quoteId}`;
                        }
                    }

                    const LinkComponent = isClickable ? Link : 'div';

                    const StepContent = () => (
                        <>
                            <span className={cn(
                                "text-sm font-medium", 
                                isCompleted || isCurrent ? 'text-primary' : 'text-muted-foreground',
                                isClickable && "group-hover:text-primary/80"
                            )}>{step.name}</span>
                            <span className={cn("text-sm", isClickable ? "group-hover:text-primary/80" : "text-muted-foreground")}>Step {stepIdx + 1}</span>
                        </>
                    );
                    
                    return (
                        <li key={step.name} className="md:flex-1">
                             <LinkComponent
                                href={href}
                                className={cn(
                                    "group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4",
                                    isCompleted || isCurrent ? "border-primary" : "border-border",
                                    isClickable ? "hover:border-primary/70" : "cursor-not-allowed"
                                )}
                                aria-current={isCurrent ? "step" : undefined}
                                onClick={(e) => !isClickable && e.preventDefault()}
                            >
                                <StepContent />
                            </LinkComponent>
                        </li>
                    )
                })}
            </ol>
        </nav>
    );
};

    