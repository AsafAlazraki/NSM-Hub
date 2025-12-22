
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { FactoryOption, FactoryOptionCategory, OptionTag } from "@/lib/types";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Star } from "lucide-react";

interface FactoryFitOptionsProps {
    hullOptions: FactoryOption[];
    motorOptions: FactoryOption[];
    trailerOptions: FactoryOption[];
    hullCategories: FactoryOptionCategory[];
    motorCategories: FactoryOptionCategory[];
    trailerCategories: FactoryOptionCategory[];
    standardOptionIds: string[];
    selectedOptionIds: string[];
    onOptionToggle: (optionId: string) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
}

const OptionCard = ({ option, isStandard, isChecked, onToggle }: { option: FactoryOption, isStandard: boolean, isChecked: boolean, onToggle: () => void }) => {
    return (
        <Label
            htmlFor={`option-${option.id}`}
            className={cn(
                "flex items-center justify-between gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent",
                isChecked && "bg-primary/20 border-primary",
                isStandard && "cursor-not-allowed opacity-70"
            )}
        >
            <div className="flex items-center gap-4">
                <Checkbox
                    id={`option-${option.id}`}
                    checked={isChecked}
                    disabled={isStandard}
                    onCheckedChange={onToggle}
                />
                <span className="font-medium text-sm">
                    {option.name}
                </span>
            </div>
            {isStandard ? (
                <Badge variant="outline" className="flex items-center gap-1">
                    <Star className="h-3 w-3" /> Standard
                </Badge>
            ) : (
                <span className="font-semibold text-sm text-primary">{formatCurrency(option.sellPrice)}</span>
            )}
        </Label>
    );
}

const OptionCategoryGroup = ({ category, options, standardOptionIds, selectedOptionIds, onOptionToggle }: {
    category: FactoryOptionCategory;
    options: FactoryOption[];
    standardOptionIds: string[];
    selectedOptionIds: string[];
    onOptionToggle: (optionId: string) => void;
}) => {
    const optionsInCategory = options.filter(opt => opt.categoryId === category.id);
    if (optionsInCategory.length === 0) return null;

    return (
        <div key={category.id}>
            <h4 className="font-semibold text-md mb-2">{category.name}</h4>
            <div className="space-y-2">
                {optionsInCategory.map(option => {
                    const isStandard = standardOptionIds.includes(option.id!);
                    const isChecked = isStandard || selectedOptionIds.includes(option.id!);
                    return (
                        <OptionCard
                            key={option.id}
                            option={option}
                            isStandard={isStandard}
                            isChecked={isChecked}
                            onToggle={() => onOptionToggle(option.id!)}
                        />
                    );
                })}
            </div>
        </div>
    );
};

const OptionsTabContent = ({ title, options, categories, standardOptionIds, selectedOptionIds, onOptionToggle }: {
    title: string;
    options: FactoryOption[];
    categories: FactoryOptionCategory[];
    standardOptionIds: string[];
    selectedOptionIds: string[];
    onOptionToggle: (optionId: string) => void;
}) => {
    const uncategorizedOptions = options.filter(opt => !opt.categoryId);
    const categorizedOptionsExist = options.some(opt => opt.categoryId);

    return (
        <CardContent className="space-y-4 pt-6">
            {options.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">No {title.toLowerCase()} options are compatible.</p>
            ) : (
                <>
                    {categories.map(category => (
                        <OptionCategoryGroup
                            key={category.id}
                            category={category}
                            options={options}
                            standardOptionIds={standardOptionIds}
                            selectedOptionIds={selectedOptionIds}
                            onOptionToggle={onOptionToggle}
                        />
                    ))}

                    {uncategorizedOptions.length > 0 && (
                        <div>
                            {categorizedOptionsExist && <Separator className="my-4" />}
                            <h4 className="font-semibold text-md mb-2">Uncategorized Options</h4>
                            <div className="space-y-2">
                                {uncategorizedOptions.map(option => {
                                    const isStandard = standardOptionIds.includes(option.id!);
                                    const isChecked = isStandard || selectedOptionIds.includes(option.id!);
                                    return (
                                        <OptionCard
                                            key={option.id}
                                            option={option}
                                            isStandard={isStandard}
                                            isChecked={isChecked}
                                            onToggle={() => onOptionToggle(option.id!)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}
        </CardContent>
    );
};


export const FactoryFitOptions = ({ hullOptions, motorOptions, trailerOptions, hullCategories, motorCategories, trailerCategories, standardOptionIds, selectedOptionIds, onOptionToggle }: FactoryFitOptionsProps) => {

    return (
        <Card>
            <CardHeader>
                <CardTitle>Factory Fit Options</CardTitle>
                <CardDescription>Select optional extras for each part of the package.</CardDescription>
            </CardHeader>
             <CardContent>
                <Tabs defaultValue="hull" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="hull">Hull</TabsTrigger>
                        <TabsTrigger value="motor">Motor</TabsTrigger>
                        <TabsTrigger value="trailer">Trailer</TabsTrigger>
                    </TabsList>
                    <TabsContent value="hull">
                         <OptionsTabContent
                            title="Hull"
                            options={hullOptions}
                            categories={hullCategories}
                            standardOptionIds={standardOptionIds}
                            selectedOptionIds={selectedOptionIds}
                            onOptionToggle={onOptionToggle}
                        />
                    </TabsContent>
                    <TabsContent value="motor">
                         <OptionsTabContent
                            title="Motor"
                            options={motorOptions}
                            categories={motorCategories}
                            standardOptionIds={standardOptionIds}
                            selectedOptionIds={selectedOptionIds}
                            onOptionToggle={onOptionToggle}
                        />
                    </TabsContent>
                    <TabsContent value="trailer">
                        <OptionsTabContent
                            title="Trailer"
                            options={trailerOptions}
                            categories={trailerCategories}
                            standardOptionIds={standardOptionIds}
                            selectedOptionIds={selectedOptionIds}
                            onOptionToggle={onOptionToggle}
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}

    
