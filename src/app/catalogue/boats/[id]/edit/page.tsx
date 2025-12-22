
"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { getBoatModelById, saveBoatModel, getCatalogueMotors, getFactoryOptionCategories, getCatalogueFactoryOptions, getDealerFitBrands, getDealerFitCategories, getDealerFitParts, getRiggingKits, getCatalogueTrailers, getStaticLogo, getUserProfile, getCataloguePropellers, getDealerFitKits } from '@/lib/storage';
import type { BoatModel, CatalogueMotor, FactoryOption, FactoryOptionCategory, DealerFitPart, DealerFitBrand, DealerFitCategory, OptionTag, RiggingKit, Preconfiguration, CatalogueTrailer, BoatModelCompatibleTrailer, UserProfile, Propeller, BoatModelCompatibleMotor, DealerFitKit, ColorOption } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Trash2, PlusCircle, Upload, Image as ImageIcon, DollarSign, Settings, FileText, X, Eye, Loader2, Save, Star, ArrowRight, Search, GitMerge, ListPlus, Edit, Truck, Package } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { v4 as uuidv4 } from 'uuid';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getAuth, signOut } from 'firebase/auth';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const preconfigurationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Pre-configuration name is required.'),
  selectedMaterial: z.string().optional(),
  selectedColorName: z.string().optional(),
  selectedTrailerId: z.string().optional(),
  compatibleMotorIds: z.array(z.string()).optional(),
  compatibleRiggingKitIds: z.array(z.string()).optional(),
  compatibleFactoryOptionIds: z.array(z.string()).optional(),
  standardFactoryOptionIds: z.array(z.string()).optional(),
  compatibleDealerFitOptionIds: z.array(z.string()).optional(),
});


const modelSchema = z.object({
  name: z.string().min(1, 'Model name is required.'),
  materials: z.array(z.object({ value: z.string().min(1, 'Material name is required.') })).optional(),
  galleryImages: z.array(z.object({ url: z.string(), id: z.string(), file: z.instanceof(File).optional() })).optional(),
  consoleOptions: z.array(z.object({ 
      name: z.string().min(1, 'Console option name is required.'),
      price: z.coerce.number().min(0, 'Price must be a positive number.'),
      asStandard: z.boolean().optional(),
   })).optional(),
  colors: z.array(z.object({
    name: z.string().min(1, 'Color name is required.'),
    images: z.array(z.object({ url: z.string(), id: z.string(), file: z.instanceof(File).optional() })).optional(),
  })).optional(),
  standardFeatures: z.array(z.object({ value: z.string().min(1, 'Feature text is required.') })).optional(),
  specifications: z.array(z.object({
    name: z.string().min(1, 'Specification name is required.'),
    value: z.string().min(1, 'Specification value is required.'),
  })).optional(),
  pricing: z.array(z.object({
      material: z.string(),
      color: z.string(),
      price: z.coerce.number().min(0, "Price must be non-negative."),
      includesGst: z.boolean().optional(),
  })).optional(),
  compatibleMotors: z.array(z.object({
    motorId: z.string(),
    compatiblePropellerIds: z.array(z.string()).optional(),
    compatibleFactoryOptionIds: z.array(z.string()).optional(),
  })).optional(),
  compatibleRiggingKitIds: z.array(z.string()).optional(),
  compatibleTrailers: z.array(z.object({
    trailerId: z.string(),
    compatibleFactoryOptionIds: z.array(z.string()).optional(),
  })).optional(),
  compatibleFactoryOptionIds: z.array(z.string()).optional(),
  compatibleFactoryOptionCategoryIds: z.array(z.string()).optional(),
  standardFactoryOptionIds: z.array(z.string()).optional(),
  compatibleDealerFitOptionIds: z.array(z.string()).optional(),
  compatibleDealerFitKitIds: z.array(z.string()).optional(),
  keyDocuments: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, 'Document name is required.'),
    fileUrl: z.string().min(1, 'File is required.'),
    file: z.instanceof(File).optional(), // For handling the file before upload
  })).optional(),
  preconfigurations: z.array(preconfigurationSchema).optional(),
});

type ModelFormValues = z.infer<typeof modelSchema>;

const tagColors: Record<OptionTag, string> = {
  Boat: 'bg-blue-100 text-blue-800',
  Motor: 'bg-green-100 text-green-800',
  Trailer: 'bg-orange-100 text-orange-800',
  Misc: 'bg-gray-100 text-gray-800',
};


const PricingDialog = ({ isOpen, setIsOpen, model, onSave }: { isOpen: boolean, setIsOpen: (open: boolean) => void, model: ModelFormValues, onSave: (pricing: ModelFormValues['pricing']) => void }) => {
    const { toast } = useToast();
    const [pricing, setPricing] = useState(model.pricing || []);
    
    const variants = useMemo(() => {
        const { materials, colors } = model;
        if (!materials || !colors || materials.length === 0 || colors.length === 0) return [];
        
        const newVariants: { material: string, color: string }[] = [];
        materials.forEach(mat => {
            colors.forEach(col => {
                newVariants.push({ material: mat.value, color: col.name });
            });
        });
        return newVariants;
    }, [model]);

    useEffect(() => {
        setPricing(model.pricing || []);
    }, [model.pricing]);

    const getPrice = (material: string, color: string) => {
        return pricing.find(p => p.material === material && p.color === color)?.price || 0;
    }
    
    const getIncludesGst = (material: string, color: string) => {
        return pricing.find(p => p.material === material && p.color === color)?.includesGst || false;
    }

    const handlePricingChange = (material: string, color: string, field: 'price' | 'includesGst', value: number | boolean) => {
        setPricing(prev => {
            const existingIndex = prev.findIndex(p => p.material === material && p.color === color);
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], [field]: value };
                return updated;
            } else {
                 const newEntry = {
                    material,
                    color,
                    price: 0,
                    includesGst: false,
                 };
                if (field === 'price' && typeof value === 'number') {
                    newEntry.price = value;
                } else if (field === 'includesGst' && typeof value === 'boolean') {
                    newEntry.includesGst = value;
                }
                 return [...prev, newEntry];
            }
        });
    }
    
    const handleSelectAllGst = (checked: boolean) => {
        setPricing(prev => {
            const newPricing = [...prev];
            variants.forEach(({material, color}) => {
                const index = newPricing.findIndex(p => p.material === material && p.color === color);
                if (index > -1) {
                    newPricing[index].includesGst = checked;
                } else {
                    newPricing.push({ material, color, price: 0, includesGst: checked });
                }
            });
            return newPricing;
        });
    }

    const allGstSelected = useMemo(() => {
        if (variants.length === 0) return false;
        return variants.every(({ material, color }) => getIncludesGst(material, color));
    }, [variants, pricing]);


    const handleSave = () => {
        onSave(pricing);
        toast({ title: 'Pricing Saved', description: 'Variant prices have been updated.' });
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-4xl" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Edit Pricing Variants for {model.name}</DialogTitle>
                    <DialogDescription>
                        Set the price for each combination of material and color.
                    </DialogDescription>
                </DialogHeader>
                 <div className="flex items-center space-x-2 py-2">
                    <Checkbox
                        id="select-all-gst"
                        checked={allGstSelected}
                        onCheckedChange={(checked) => handleSelectAllGst(!!checked)}
                    />
                    <label
                        htmlFor="select-all-gst"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Price includes GST (Select All)
                    </label>
                </div>
                 <ScrollArea className="h-[55vh] -mx-6 px-6">
                    <div className="space-y-4">
                        {variants.length > 0 ? variants.map(({ material, color }) => (
                            <div key={`${material}-${color}`} className="grid grid-cols-12 items-center gap-4 p-2 border rounded-md">
                                <div className="col-span-4 font-medium">{material}</div>
                                <div className="col-span-4 font-medium">{color}</div>
                                <div className="col-span-3 flex items-center gap-2">
                                     <span className="text-muted-foreground">$</span>
                                     <Input
                                        type="number"
                                        placeholder="Enter price"
                                        value={getPrice(material, color)}
                                        onChange={(e) => handlePricingChange(material, color, 'price', e.target.valueAsNumber)}
                                        className="text-right"
                                    />
                                </div>
                                <div className="col-span-1 flex items-center justify-end">
                                    <Checkbox 
                                        checked={getIncludesGst(material, color)}
                                        onCheckedChange={(checked) => handlePricingChange(material, color, 'includesGst', !!checked)}
                                    />
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-muted-foreground py-8">Please define materials and colors first to create pricing variants.</p>
                        )}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Prices</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const DealerFitOptionsDialog = ({
    isOpen,
    setIsOpen,
    allBrands,
    allCategories,
    allParts,
    initialSelectedIds,
    onSave,
}: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    allBrands: DealerFitBrand[];
    allCategories: DealerFitCategory[];
    allParts: DealerFitPart[];
    initialSelectedIds: string[];
    onSave: (selectedIds: string[]) => void;
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set(initialSelectedIds));

    useEffect(() => {
        if(isOpen) {
            setSelectedIds(new Set(initialSelectedIds));
        }
    }, [isOpen, initialSelectedIds]);

    const filteredParts = useMemo(() => {
        if (!searchTerm) return allParts;
        const lowerSearch = searchTerm.toLowerCase();
        return allParts.filter(part =>
            part.name.toLowerCase().includes(lowerSearch) ||
            allCategories.find(c => c.id === part.categoryId)?.name.toLowerCase().includes(lowerSearch) ||
            allBrands.find(b => b.id === part.brandId)?.name.toLowerCase().includes(lowerSearch)
        );
    }, [searchTerm, allParts, allCategories, allBrands]);

    const handleToggle = (partId: string) => {
        const newIds = new Set(selectedIds);
        if (newIds.has(partId)) {
            newIds.delete(partId);
        } else {
            newIds.add(partId);
        }
        setSelectedIds(newIds);
    };

    const handleSave = () => {
        onSave(Array.from(selectedIds));
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-3xl" onOpenAutoFocus={e => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Manage Dealer Fit Options</DialogTitle>
                </DialogHeader>
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search parts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
                    {searchTerm && <Button variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2" onClick={() => setSearchTerm('')}><X className="h-4 w-4" /></Button>}
                </div>
                <ScrollArea className="h-[60vh] -mx-6 px-6">
                    {filteredParts.map(part => (
                        <div key={part.id} className="flex items-center space-x-3 py-2 border-b">
                            <Checkbox
                                id={`part-${part.id}`}
                                checked={selectedIds.has(part.id!)}
                                onCheckedChange={() => handleToggle(part.id!)}
                            />
                            <label htmlFor={`part-${part.id}`} className="flex-1 cursor-pointer">
                                <p className="font-medium">{part.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {allBrands.find(b => b.id === part.brandId)?.name || 'Unbranded'} &bull; {allCategories.find(c => c.id === part.categoryId)?.name || 'Uncategorized'}
                                </p>
                            </label>
                        </div>
                    ))}
                </ScrollArea>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save ({selectedIds.size})</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const DealerFitKitsDialog = ({
    isOpen,
    setIsOpen,
    allKits,
    initialSelectedIds,
    onSave,
}: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    allKits: DealerFitKit[];
    initialSelectedIds: string[];
    onSave: (selectedIds: string[]) => void;
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set(initialSelectedIds));

    useEffect(() => {
        if(isOpen) {
            setSelectedIds(new Set(initialSelectedIds));
        }
    }, [isOpen, initialSelectedIds]);

    const filteredKits = useMemo(() => {
        if (!searchTerm) return allKits;
        const lowerSearch = searchTerm.toLowerCase();
        return allKits.filter(kit => kit.name.toLowerCase().includes(lowerSearch));
    }, [searchTerm, allKits]);

    const handleToggle = (kitId: string) => {
        const newIds = new Set(selectedIds);
        if (newIds.has(kitId)) {
            newIds.delete(kitId);
        } else {
            newIds.add(kitId);
        }
        setSelectedIds(newIds);
    };

    const handleSave = () => {
        onSave(Array.from(selectedIds));
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl" onOpenAutoFocus={e => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Manage Dealer Fit Kit Bundles</DialogTitle>
                </DialogHeader>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search kits..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                    {searchTerm && <Button variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2" onClick={() => setSearchTerm('')}><X className="h-4 w-4" /></Button>}
                </div>
                <ScrollArea className="h-[60vh] -mx-6 px-6">
                    {filteredKits.map(kit => (
                        <div key={kit.id} className="flex items-center space-x-3 py-2 border-b">
                            <Checkbox
                                id={`kit-${kit.id}`}
                                checked={selectedIds.has(kit.id!)}
                                onCheckedChange={() => handleToggle(kit.id!)}
                            />
                            <label htmlFor={`kit-${kit.id}`} className="flex-1 cursor-pointer">
                                <p className="font-medium">{kit.name}</p>
                            </label>
                        </div>
                    ))}
                </ScrollArea>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save ({selectedIds.size})</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const RiggingKitsDialog = ({
    isOpen,
    setIsOpen,
    allKits,
    initialSelectedIds,
    onSave,
}: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    allKits: RiggingKit[];
    initialSelectedIds: string[];
    onSave: (selectedIds: string[]) => void;
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set(initialSelectedIds));

    useEffect(() => {
        if(isOpen) {
            setSelectedIds(new Set(initialSelectedIds));
        }
    }, [isOpen, initialSelectedIds]);

    const filteredKits = useMemo(() => {
        if (!searchTerm) return allKits;
        const lowerSearch = searchTerm.toLowerCase();
        return allKits.filter(kit => kit.name.toLowerCase().includes(lowerSearch));
    }, [searchTerm, allKits]);

    const handleToggle = (kitId: string) => {
        const newIds = new Set(selectedIds);
        if (newIds.has(kitId)) {
            newIds.delete(kitId);
        } else {
            newIds.add(kitId);
        }
        setSelectedIds(newIds);
    };

    const handleSave = () => {
        onSave(Array.from(selectedIds));
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl" onOpenAutoFocus={e => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Manage Rigging Kits</DialogTitle>
                </DialogHeader>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search kits..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                    {searchTerm && <Button variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2" onClick={() => setSearchTerm('')}><X className="h-4 w-4" /></Button>}
                </div>
                <ScrollArea className="h-[60vh] -mx-6 px-6">
                    {filteredKits.map(kit => (
                        <div key={kit.id} className="flex items-center space-x-3 py-2 border-b">
                            <Checkbox
                                id={`kit-${kit.id}`}
                                checked={selectedIds.has(kit.id!)}
                                onCheckedChange={() => handleToggle(kit.id!)}
                            />
                            <label htmlFor={`kit-${kit.id}`} className="flex-1 cursor-pointer">
                                <p className="font-medium">{kit.name}</p>
                            </label>
                        </div>
                    ))}
                </ScrollArea>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save ({selectedIds.size})</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const TrailerOptionsDialog = ({
    isOpen,
    setIsOpen,
    trailer,
    trailerFactoryOptions,
    initialSelectedIds,
    onSave,
}: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    trailer: CatalogueTrailer;
    trailerFactoryOptions: FactoryOption[];
    initialSelectedIds: string[];
    onSave: (selectedIds: string[]) => void;
}) => {
    const [selectedIds, setSelectedIds] = useState(new Set(initialSelectedIds));

    useEffect(() => {
        if(isOpen) setSelectedIds(new Set(initialSelectedIds));
    }, [isOpen, initialSelectedIds]);

    const handleToggle = (optionId: string) => {
        const newIds = new Set(selectedIds);
        if (newIds.has(optionId)) {
            newIds.delete(optionId);
        } else {
            newIds.add(optionId);
        }
        setSelectedIds(newIds);
    };

    const handleSave = () => {
        onSave(Array.from(selectedIds));
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Options for {trailer.name}</DialogTitle>
                    <DialogDescription>Select which trailer-specific factory options are available for this boat model.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[60vh] -mx-6 px-6">
                    <div className="space-y-2">
                        {trailerFactoryOptions.map(option => (
                            <div key={option.id} className="flex items-center space-x-3 p-2">
                                <Checkbox
                                    id={`trailer-opt-${option.id}`}
                                    checked={selectedIds.has(option.id!)}
                                    onCheckedChange={() => handleToggle(option.id!)}
                                />
                                <Label htmlFor={`trailer-opt-${option.id}`} className="flex-1 cursor-pointer">
                                    {option.name}
                                </Label>
                            </div>
                        ))}
                         {trailerFactoryOptions.length === 0 && <p className="text-center text-muted-foreground py-4">No factory options are tagged for 'Trailer'.</p>}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Options</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const MotorPropellerDialog = ({
    isOpen,
    setIsOpen,
    motor,
    allPropellers,
    initialSelectedIds,
    onSave,
}: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    motor: CatalogueMotor;
    allPropellers: Propeller[];
    initialSelectedIds: string[];
    onSave: (selectedIds: string[]) => void;
}) => {
    const [selectedIds, setSelectedIds] = useState(new Set(initialSelectedIds));

    useEffect(() => {
        if (isOpen) setSelectedIds(new Set(initialSelectedIds));
    }, [isOpen, initialSelectedIds]);
    
    const compatiblePropellers = useMemo(() => {
        return allPropellers.filter(p => p.compatibleMotorIds?.includes(motor.id!));
    }, [allPropellers, motor]);

    const handleToggle = (propId: string) => {
        const newIds = new Set(selectedIds);
        if (newIds.has(propId)) {
            newIds.delete(propId);
        } else {
            newIds.add(propId);
        }
        setSelectedIds(newIds);
    };

    const handleSave = () => {
        onSave(Array.from(selectedIds));
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Propellers for {motor.name}</DialogTitle>
                    <DialogDescription>Select which propellers are available for this boat model.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[60vh] -mx-6 px-6">
                    <div className="space-y-2">
                        {compatiblePropellers.map(prop => (
                            <div key={prop.id} className="flex items-center space-x-3 p-2">
                                <Checkbox
                                    id={`prop-${prop.id}`}
                                    checked={selectedIds.has(prop.id!)}
                                    onCheckedChange={() => handleToggle(prop.id!)}
                                />
                                <Label htmlFor={`prop-${prop.id}`} className="flex-1 cursor-pointer">
                                    {prop.name}
                                </Label>
                            </div>
                        ))}
                    </div>
                     {compatiblePropellers.length === 0 && <p className="text-center text-muted-foreground py-4">No propellers are marked as compatible with this motor in the catalogue.</p>}
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Propellers</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const MotorOptionsDialog = ({
    isOpen,
    setIsOpen,
    motor,
    motorFactoryOptions,
    initialSelectedIds,
    onSave,
    standardFactoryOptionIds,
    onToggleStandard
}: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    motor: CatalogueMotor;
    motorFactoryOptions: FactoryOption[];
    initialSelectedIds: string[];
    onSave: (selectedIds: string[]) => void;
    standardFactoryOptionIds: string[];
    onToggleStandard: (optionId: string) => void;
}) => {
    const [selectedIds, setSelectedIds] = useState(new Set(initialSelectedIds));

    useEffect(() => {
        if(isOpen) setSelectedIds(new Set(initialSelectedIds));
    }, [isOpen, initialSelectedIds]);

    const handleToggle = (optionId: string) => {
        const newIds = new Set(selectedIds);
        if (newIds.has(optionId)) {
            newIds.delete(optionId);
        } else {
            newIds.add(optionId);
        }
        setSelectedIds(newIds);
    };

    const handleSave = () => {
        onSave(Array.from(selectedIds));
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Options for {motor.name}</DialogTitle>
                    <DialogDescription>Select which motor-specific factory options are available for this boat model.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[60vh] -mx-6 px-6">
                    <div className="space-y-2">
                        {motorFactoryOptions.map(option => (
                            <div key={option.id} className="flex items-center justify-between p-2">
                                <div className="flex items-center space-x-3">
                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => onToggleStandard(option.id!)}>
                                        <Star className={cn("h-4 w-4", standardFactoryOptionIds.includes(option.id!) ? 'text-yellow-500 fill-yellow-400' : 'text-muted-foreground')} />
                                    </Button>
                                    <Checkbox
                                        id={`motor-opt-${option.id}`}
                                        checked={selectedIds.has(option.id!)}
                                        onCheckedChange={() => handleToggle(option.id!)}
                                    />
                                    <Label htmlFor={`motor-opt-${option.id}`} className="flex-1 cursor-pointer">
                                        {option.name}
                                    </Label>
                                </div>
                                {option.sellPrice > 0 && <span className="text-sm text-muted-foreground font-medium">{formatCurrency(option.sellPrice)}</span>}
                            </div>
                        ))}
                         {motorFactoryOptions.length === 0 && <p className="text-center text-muted-foreground py-4">No factory options are tagged for 'Motor'.</p>}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Options</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


const formatCurrency = (value: number) => {
    if (isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
}

function EditBoatModelPageContent() {
  const params = useParams();
  const modelId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  
  const [model, setModel] = useState<BoatModel | null>(null);
  const [allMotors, setAllMotors] = useState<CatalogueMotor[]>([]);
  const [allPropellers, setAllPropellers] = useState<Propeller[]>([]);
  const [allRiggingKits, setAllRiggingKits] = useState<RiggingKit[]>([]);
  const [allTrailers, setAllTrailers] = useState<CatalogueTrailer[]>([]);
  const [allFactoryCategories, setAllFactoryCategories] = useState<FactoryOptionCategory[]>([]);
  const [allFactoryOptions, setAllFactoryOptions] = useState<FactoryOption[]>([]);
  const [allDealerFitBrands, setAllDealerFitBrands] = useState<DealerFitBrand[]>([]);
  const [allDealerFitCategories, setAllDealerFitCategories] = useState<DealerFitCategory[]>([]);
  const [allDealerFitParts, setAllDealerFitParts] = useState<DealerFitPart[]>([]);
  const [allDealerFitKits, setAllDealerFitKits] = useState<DealerFitKit[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false);
  const [isDealerFitDialogOpen, setIsDealerFitDialogOpen] = useState(false);
  const [isDealerFitKitDialogOpen, setIsDealerFitKitDialogOpen] = useState(false);
  const [isRiggingKitDialogOpen, setIsRiggingKitDialogOpen] = useState(false);
  
  const [isPreconfigDialogOpen, setIsPreconfigDialogOpen] = useState(false);
  const [editingPreconfig, setEditingPreconfig] = useState<Partial<Preconfiguration> | null>(null);
  const [isTrailerOptionsDialogOpen, setIsTrailerOptionsDialogOpen] = useState(false);
  const [editingTrailerForOptions, setEditingTrailerForOptions] = useState<CatalogueTrailer | null>(null);
  const [isMotorPropellerDialogOpen, setIsMotorPropellerDialogOpen] = useState(false);
  const [editingMotorForProps, setEditingMotorForProps] = useState<CatalogueMotor | null>(null);
  const [isMotorOptionsDialogOpen, setIsMotorOptionsDialogOpen] = useState(false);
  const [editingMotorForOptions, setEditingMotorForOptions] = useState<CatalogueMotor | null>(null);


  const form = useForm<ModelFormValues>({
    resolver: zodResolver(modelSchema),
    defaultValues: {
      name: '',
      materials: [],
      galleryImages: [],
      colors: [],
      consoleOptions: [],
      standardFeatures: [],
      specifications: [],
      pricing: [],
      compatibleMotors: [],
      compatibleRiggingKitIds: [],
      compatibleTrailers: [],
      compatibleFactoryOptionIds: [],
      compatibleFactoryOptionCategoryIds: [],
      standardFactoryOptionIds: [],
      compatibleDealerFitOptionIds: [],
      compatibleDealerFitKitIds: [],
      keyDocuments: [],
      preconfigurations: [],
    },
  });

  const { fields: materialFields, append: appendMaterial, remove: removeMaterial } = useFieldArray({ control: form.control, name: "materials" });
  const { fields: galleryImageFields, append: appendGalleryImage, remove: removeGalleryImage } = useFieldArray({ control: form.control, name: "galleryImages" });
  const { fields: colorFields, append: appendColor, remove: removeColor } = useFieldArray({ control: form.control, name: "colors" });
  const { fields: consoleOptionFields, append: appendConsoleOption, remove: removeConsoleOption } = useFieldArray({ control: form.control, name: "consoleOptions" });
  const { fields: featureFields, append: appendFeature, remove: removeFeature } = useFieldArray({ control: form.control, name: "standardFeatures" });
  const { fields: specFields, append: appendSpec, remove: removeSpec } = useFieldArray({ control: form.control, name: "specifications" });
  const { fields: docFields, append: appendDoc, remove: removeDoc } = useFieldArray({ control: form.control, name: "keyDocuments" });
  const { fields: preconfigFields, append: appendPreconfig, remove: removePreconfig, update: updatePreconfig } = useFieldArray({ control: form.control, name: "preconfigurations" });
  
  useEffect(() => {
    if (modelId) {
      setIsLoading(true);
      Promise.all([
        getBoatModelById(modelId),
        getCatalogueMotors(),
        getCataloguePropellers(),
        getRiggingKits(),
        getCatalogueTrailers(),
        getFactoryOptionCategories(),
        getCatalogueFactoryOptions(),
        getDealerFitBrands(),
        getDealerFitCategories(),
        getDealerFitParts(),
        getDealerFitKits(),
      ]).then(([modelData, motorData, propData, riggingData, trailerData, factoryCatData, factoryOptData, dealerBrandData, dealerCatData, dealerPartData, dealerKitData]) => {
        if (modelData) {
          setModel(modelData);
          form.reset({
            name: modelData.name || '',
            materials: (modelData.materials || []).map(m => ({ value: m })),
            galleryImages: modelData.galleryImages || [],
            colors: (modelData.colors || []).map(c => ({ ...c, images: c.images || [] })),
            consoleOptions: modelData.consoleOptions || [],
            standardFeatures: (modelData.standardFeatures || []).map(f => ({ value: f })),
            specifications: modelData.specifications || [],
            pricing: modelData.pricing || [],
            compatibleMotors: modelData.compatibleMotors || [],
            compatibleRiggingKitIds: modelData.compatibleRiggingKitIds || [],
            compatibleTrailers: modelData.compatibleTrailers || [],
            compatibleFactoryOptionIds: modelData.compatibleFactoryOptionIds || [],
            compatibleFactoryOptionCategoryIds: modelData.compatibleFactoryOptionCategoryIds || [],
            standardFactoryOptionIds: modelData.standardFactoryOptionIds || [],
            compatibleDealerFitOptionIds: modelData.compatibleDealerFitOptionIds || [],
            compatibleDealerFitKitIds: modelData.compatibleDealerFitKitIds || [],
            keyDocuments: modelData.keyDocuments || [],
            preconfigurations: modelData.preconfigurations || [],
          });
        }
        setAllMotors(motorData);
        setAllPropellers(propData);
        setAllRiggingKits(riggingData);
        setAllTrailers(trailerData);
        setAllFactoryCategories(factoryCatData);
        setAllFactoryOptions(factoryOptData);
        setAllDealerFitBrands(dealerBrandData);
        setAllDealerFitCategories(dealerCatData);
        setAllDealerFitParts(dealerPartData);
        setAllDealerFitKits(dealerKitData);

        setIsLoading(false);
      });
    }
  }, [modelId, form]);

 const onSubmit = async (data: ModelFormValues) => {
    if (!modelId) return;
    setIsSaving(true);
    try {
        const { keyDocuments, colors, galleryImages, ...restOfData } = data;
        
        const processedDocuments = await Promise.all((keyDocuments || []).map(async (doc) => {
            if (doc.file) {
                setUploadingDocId(doc.id);
                // The actual upload is handled by the cloud function/backend, this is just for local state
                setUploadingDocId(null);
            }
            return doc;
        }));

        const updatedModelData: Partial<BoatModel> = {
            ...restOfData,
            id: modelId,
            materials: (data.materials || []).map(m => m.value),
            standardFeatures: (data.standardFeatures || []).map(f => f.value),
            galleryImages: galleryImages,
            colors: (colors || []).map(c => ({...c, images: c.images || [] })),
            keyDocuments: processedDocuments.map(({ file, ...doc }) => doc),
        };
        
        await saveBoatModel(updatedModelData);
        toast({ title: 'Model Saved', description: `"${data.name}" has been updated.` });
        window.location.reload();
    } catch (error) {
        console.error("Save failed:", error);
        toast({ variant: 'destructive', title: 'Save Failed', description: String(error) });
    } finally {
        setIsSaving(false);
        setUploadingDocId(null);
    }
};


  const handleFileUpload = (type: 'color' | 'doc' | 'gallery', index?: number) => {
    const key = index !== undefined ? `${type}-${index}` : type;
    fileInputRefs.current[key]?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, type: 'color' | 'doc' | 'gallery', index?: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (type === 'gallery') {
        const currentImages = form.getValues('galleryImages') || [];
        const newImage = { url: URL.createObjectURL(file), id: uuidv4(), file: file };
        form.setValue('galleryImages', [...currentImages, newImage], { shouldDirty: true, shouldValidate: true });
    } else if (type === 'color' && index !== undefined) {
        const currentImages = form.getValues(`colors.${index}.images`) || [];
        const newImage = { url: URL.createObjectURL(file), id: uuidv4(), file: file };
        form.setValue(`colors.${index}.images`, [...currentImages, newImage], { shouldDirty: true, shouldValidate: true });
    } else if (type === 'doc' && index !== undefined) {
        const docField = form.getValues(`keyDocuments.${index}`);
        form.setValue(`keyDocuments.${index}.file`, file, { shouldDirty: true });
        const tempUrl = URL.createObjectURL(file);
        form.setValue(`keyDocuments.${index}.fileUrl`, tempUrl, { shouldDirty: true });
        if (!form.getValues(`keyDocuments.${index}.name`)) {
            form.setValue(`keyDocuments.${index}.name`, file.name.replace(/\.[^/.]+$/, ""), { shouldDirty: true });
        }
    }

    event.target.value = '';
  };
  
  const removeColorImage = (colorIndex: number, imageId: string) => {
      const currentImages = form.getValues(`colors.${colorIndex}.images`) || [];
      form.setValue(`colors.${colorIndex}.images`, currentImages.filter(img => img.id !== imageId), { shouldDirty: true });
  }

  const handleToggleStandardOption = (optionId: string) => {
    const currentStandards = form.getValues('standardFactoryOptionIds') || [];
    const newStandards = currentStandards.includes(optionId)
        ? currentStandards.filter(id => id !== optionId)
        : [...currentStandards, optionId];
    form.setValue('standardFactoryOptionIds', newStandards, { shouldDirty: true });
  };
  
  const handleDealerFitSave = (selectedIds: string[]) => {
    form.setValue('compatibleDealerFitOptionIds', selectedIds, { shouldDirty: true });
    toast({ title: 'Compatibility Updated', description: `${selectedIds.length} dealer-fit options marked as compatible.` });
  };
  
  const handleDealerFitKitSave = (selectedIds: string[]) => {
    form.setValue('compatibleDealerFitKitIds', selectedIds, { shouldDirty: true });
    toast({ title: 'Compatibility Updated', description: `${selectedIds.length} dealer-fit kits marked as compatible.` });
  };

    const handleRiggingKitSave = (selectedIds: string[]) => {
        form.setValue('compatibleRiggingKitIds', selectedIds, { shouldDirty: true });
        toast({ title: 'Compatibility Updated', description: `${selectedIds.length} rigging kits marked as compatible.` });
    };

    const boatFactoryOptions = useMemo(() => {
        return allFactoryOptions.filter(opt => opt.tag === 'Boat');
    }, [allFactoryOptions]);

    const motorFactoryOptions = useMemo(() => allFactoryOptions.filter(opt => opt.tag === 'Motor'), [allFactoryOptions]);
    
    const trailerFactoryOptions = useMemo(() => allFactoryOptions.filter(opt => opt.tag === 'Trailer'), [allFactoryOptions]);

    const boatFactoryCategories = useMemo(() => {
        if (!modelId) return [];
        const boatTaggedCategories = allFactoryCategories.filter(cat => cat.tag === 'Boat');
        const linkedCategoryIds = new Set(form.getValues('compatibleFactoryOptionCategoryIds'));
        const linkedCategories = allFactoryCategories.filter(cat => linkedCategoryIds.has(cat.id!));
        const linkedOptionIds = new Set(form.getValues('compatibleFactoryOptionIds'));
        const linkedOptions = allFactoryOptions.filter(opt => linkedOptionIds.has(opt.id!));
        const categoriesOfLinkedOptions = allFactoryCategories.filter(cat =>
            linkedOptions.some(opt => opt.categoryId === cat.id)
        );
        const allRelevantCategories = [...boatTaggedCategories, ...linkedCategories, ...categoriesOfLinkedOptions];
        const uniqueCategories = Array.from(new Map(allRelevantCategories.map(cat => [cat.id, cat])).values());
        return uniqueCategories;

    }, [modelId, allFactoryCategories, allFactoryOptions, form.watch('compatibleFactoryOptionIds'), form.watch('compatibleFactoryOptionCategoryIds')]);

  const handleOpenPreconfigDialog = (config?: Preconfiguration) => {
    setEditingPreconfig(config || null);
    setIsPreconfigDialogOpen(true);
  };
  
  const handleSavePreconfig = (newConfigData: Partial<Preconfiguration>) => {
    if (editingPreconfig) {
        const index = preconfigFields.findIndex(f => f.id === editingPreconfig.id);
        if (index > -1) {
            updatePreconfig(index, {...editingPreconfig, ...newConfigData} as Preconfiguration);
        }
    } else {
        appendPreconfig({
            id: uuidv4(),
            name: newConfigData.name || `Pre-config ${preconfigFields.length + 1}`,
            selectedMaterial: newConfigData.selectedMaterial,
            selectedColorName: newConfigData.selectedColorName,
            selectedTrailerId: newConfigData.selectedTrailerId,
            compatibleMotorIds: newConfigData.compatibleMotorIds || [],
            compatibleRiggingKitIds: newConfigData.compatibleRiggingKitIds || [],
            compatibleFactoryOptionIds: newConfigData.compatibleFactoryOptionIds || [],
            standardFactoryOptionIds: newConfigData.standardFactoryOptionIds || [],
            compatibleDealerFitOptionIds: newConfigData.compatibleDealerFitOptionIds || [],
        });
    }
    toast({ title: 'Pre-configuration Saved' });
    setIsPreconfigDialogOpen(false);
    setEditingPreconfig(null);
  };

  const loadPreconfig = (config: Preconfiguration) => {
    form.setValue('compatibleMotors', (config.compatibleMotorIds || []).map(id => ({ motorId: id, compatiblePropellerIds: [], compatibleFactoryOptionIds: [] })), { shouldDirty: true });
    form.setValue('compatibleRiggingKitIds', config.compatibleRiggingKitIds || [], { shouldDirty: true });
    form.setValue('compatibleFactoryOptionIds', config.compatibleFactoryOptionIds || [], { shouldDirty: true });
    form.setValue('standardFactoryOptionIds', config.standardFactoryOptionIds || [], { shouldDirty: true });
    form.setValue('compatibleDealerFitOptionIds', config.compatibleDealerFitOptionIds || [], { shouldDirty: true });
    toast({ title: 'Pre-configuration Loaded', description: `Loaded settings from "${config.name}".`});
  };

  const handleDeletePreconfig = (id: string) => {
    const index = preconfigFields.findIndex(f => f.id === id);
    if (index > -1) {
        removePreconfig(index);
        toast({ title: 'Pre-configuration Deleted' });
    }
  };
  
    const handleTrailerCompatibilityChange = (trailerId: string, isChecked: boolean) => {
        const currentTrailers = form.getValues('compatibleTrailers') || [];
        if (isChecked) {
            if (!currentTrailers.some(t => t.trailerId === trailerId)) {
                form.setValue('compatibleTrailers', [...currentTrailers, { trailerId, compatibleFactoryOptionIds: [] }], { shouldDirty: true });
            }
        } else {
            form.setValue('compatibleTrailers', currentTrailers.filter(t => t.trailerId !== trailerId), { shouldDirty: true });
        }
    };
    
    const handleTrailerOptionsSave = (trailerId: string, optionIds: string[]) => {
        const currentTrailers = form.getValues('compatibleTrailers') || [];
        const trailerIndex = currentTrailers.findIndex(t => t.trailerId === trailerId);
        if (trailerIndex > -1) {
            const updatedTrailers = [...currentTrailers];
            updatedTrailers[trailerIndex].compatibleFactoryOptionIds = optionIds;
            form.setValue('compatibleTrailers', updatedTrailers, { shouldDirty: true });
        }
        toast({ title: 'Trailer Options Saved' });
    };

    const handleMotorCompatibilityChange = (motorId: string, isChecked: boolean) => {
        const currentMotors = form.getValues('compatibleMotors') || [];
        if (isChecked) {
            if (!currentMotors.some(m => m.motorId === motorId)) {
                form.setValue('compatibleMotors', [...currentMotors, { motorId: motorId, compatiblePropellerIds: [], compatibleFactoryOptionIds: [] }], { shouldDirty: true });
            }
        } else {
            form.setValue('compatibleMotors', currentMotors.filter(m => m.motorId !== motorId), { shouldDirty: true });
        }
    };

    const handlePropellerOptionsSave = (motorId: string, propIds: string[]) => {
        const currentMotors = form.getValues('compatibleMotors') || [];
        const motorIndex = currentMotors.findIndex(m => m.motorId === motorId);
        if (motorIndex > -1) {
            const updatedMotors = [...currentMotors];
            updatedMotors[motorIndex].compatiblePropellerIds = propIds;
            form.setValue('compatibleMotors', updatedMotors, { shouldDirty: true });
        }
        toast({ title: 'Propeller Options Saved' });
    };

    const handleMotorOptionsSave = (motorId: string, optionIds: string[]) => {
        const currentMotors = form.getValues('compatibleMotors') || [];
        const motorIndex = currentMotors.findIndex(m => m.motorId === motorId);
        if (motorIndex > -1) {
            const updatedMotors = [...currentMotors];
            updatedMotors[motorIndex].compatibleFactoryOptionIds = optionIds;
            form.setValue('compatibleMotors', updatedMotors, { shouldDirty: true });
        }
        toast({ title: 'Motor Options Saved' });
    };


  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Skeleton className="h-12 w-1/3 mb-8" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="flex flex-col h-screen">
        <Header>
            <Button asChild variant="outline"><Link href="/catalogue/boats"><ArrowLeft /> Back</Link></Button>
        </Header>
        <main className="flex-1 flex items-center justify-center">
            <p>Model not found.</p>
        </main>
      </div>
    );
  }
  
  const watchedFormData = form.watch();
  const selectedDealerFitParts = allDealerFitParts.filter(p => watchedFormData.compatibleDealerFitOptionIds?.includes(p.id!));
  const selectedDealerFitKits = allDealerFitKits.filter(k => watchedFormData.compatibleDealerFitKitIds?.includes(k.id!));
  const selectedRiggingKits = allRiggingKits.filter(kit => watchedFormData.compatibleRiggingKitIds?.includes(kit.id!));

  return (
    <div className="flex flex-col h-screen">
      <Header>
        <Button asChild variant="outline"><Link href="/catalogue/boats"><ArrowLeft /> Back</Link></Button>
        <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setIsPricingDialogOpen(true)}>
                <DollarSign /> Edit Pricing Variants
            </Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                {isSaving ? <><Loader2 className="animate-spin" /> Saving...</> : <><Save/> Save Changes</>}
            </Button>
        </div>
      </Header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <Form {...form}>
            <PreconfigDialog
                isOpen={isPreconfigDialogOpen}
                setIsOpen={setIsPreconfigDialogOpen}
                onSave={handleSavePreconfig}
                model={model}
                initialData={editingPreconfig}
                allMotors={allMotors}
                allRiggingKits={allRiggingKits}
                allTrailers={allTrailers}
                allFactoryOptions={allFactoryOptions}
                allDealerFitParts={allDealerFitParts}
                preconfigCount={preconfigFields.length}
            />
          <PricingDialog isOpen={isPricingDialogOpen} setIsOpen={setIsPricingDialogOpen} model={watchedFormData} onSave={(p) => form.setValue('pricing', p)} />
           <DealerFitOptionsDialog
                isOpen={isDealerFitDialogOpen}
                setIsOpen={setIsDealerFitDialogOpen}
                allBrands={allDealerFitBrands}
                allCategories={allDealerFitCategories}
                allParts={allDealerFitParts}
                initialSelectedIds={watchedFormData.compatibleDealerFitOptionIds || []}
                onSave={handleDealerFitSave}
            />
            <DealerFitKitsDialog
                isOpen={isDealerFitKitDialogOpen}
                setIsOpen={setIsDealerFitKitDialogOpen}
                allKits={allDealerFitKits}
                initialSelectedIds={watchedFormData.compatibleDealerFitKitIds || []}
                onSave={handleDealerFitKitSave}
            />
            <RiggingKitsDialog
                isOpen={isRiggingKitDialogOpen}
                setIsOpen={setIsRiggingKitDialogOpen}
                allKits={allRiggingKits}
                initialSelectedIds={watchedFormData.compatibleRiggingKitIds || []}
                onSave={handleRiggingKitSave}
            />
            {editingTrailerForOptions && (
                 <TrailerOptionsDialog
                    isOpen={isTrailerOptionsDialogOpen}
                    setIsOpen={setIsTrailerOptionsDialogOpen}
                    trailer={editingTrailerForOptions}
                    trailerFactoryOptions={trailerFactoryOptions}
                    initialSelectedIds={watchedFormData.compatibleTrailers?.find(t => t.trailerId === editingTrailerForOptions.id)?.compatibleFactoryOptionIds || []}
                    onSave={(optionIds) => handleTrailerOptionsSave(editingTrailerForOptions.id!, optionIds)}
                />
            )}
            {editingMotorForProps && (
                 <MotorPropellerDialog
                    isOpen={isMotorPropellerDialogOpen}
                    setIsOpen={setIsMotorPropellerDialogOpen}
                    motor={editingMotorForProps}
                    allPropellers={allPropellers}
                    initialSelectedIds={watchedFormData.compatibleMotors?.find(m => m.motorId === editingMotorForProps.id)?.compatiblePropellerIds || []}
                    onSave={(propIds) => handlePropellerOptionsSave(editingMotorForProps.id!, propIds)}
                />
            )}
            {editingMotorForOptions && (
                 <MotorOptionsDialog
                    isOpen={isMotorOptionsDialogOpen}
                    setIsOpen={setIsMotorOptionsDialogOpen}
                    motor={editingMotorForOptions}
                    motorFactoryOptions={motorFactoryOptions}
                    initialSelectedIds={watchedFormData.compatibleMotors?.find(m => m.motorId === editingMotorForOptions.id)?.compatibleFactoryOptionIds || []}
                    onSave={(optionIds) => handleMotorOptionsSave(editingMotorForOptions.id!, optionIds)}
                    standardFactoryOptionIds={watchedFormData.standardFactoryOptionIds || []}
                    onToggleStandard={handleToggleStandardOption}
                />
            )}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                     <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Edit Model: {model.name}</CardTitle>
                            <CardDescription>Update the details for this boat model.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Model Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2">
                     <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Pre-configurations</CardTitle>
                            <CardDescription>Manage predefined packages for this boat model to speed up quoting.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {preconfigFields.map((config, index) => (
                                <Card key={config.id} className="relative group">
                                    <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                                        <GitMerge className="h-8 w-8 text-muted-foreground" />
                                        <p className="font-semibold text-sm">{config.name}</p>
                                        <Button size="sm" variant="secondary" onClick={() => loadPreconfig(config as Preconfiguration)}>Load</Button>
                                    </CardContent>
                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleOpenPreconfigDialog(config as Preconfiguration)}><Edit className="h-3 w-3" /></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="h-3 w-3 text-destructive" /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Delete Pre-configuration?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete "{config.name}"?</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeletePreconfig(config.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </Card>
                            ))}
                             <Button type="button" variant="outline" className="h-full min-h-[140px] flex-col gap-2" onClick={() => handleOpenPreconfigDialog()}>
                                <PlusCircle/> Add Pre-configuration
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left column */}
                <div className="space-y-8">
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle>Materials</CardTitle>
                             <Button type="button" variant="outline" size="sm" onClick={() => appendMaterial({ value: ''})}><PlusCircle className="mr-2"/>Add Material</Button>
                        </CardHeader>
                        <CardContent className="space-y-2">
                             {materialFields.map((field, index) => (
                                <div key={field.id} className="flex items-center gap-2">
                                     <FormField control={form.control} name={`materials.${index}.value`} render={({ field }) => (
                                        <FormItem className="flex-1"><FormControl><Input {...field} /></FormControl></FormItem>
                                     )}/>
                                     <Button type="button" variant="ghost" size="icon" onClick={() => removeMaterial(index)}><Trash2 className="text-destructive"/></Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Gallery</CardTitle>
                            <CardDescription>General-purpose images for this model.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <input
                                type="file"
                                className="hidden"
                                ref={el => {fileInputRefs.current['gallery'] = el}}
                                onChange={(e) => handleFileChange(e, 'gallery')}
                                accept="image/*"
                                multiple
                            />
                            <div className="flex flex-wrap gap-2">
                                {galleryImageFields.map((image, index) => (
                                    <div key={image.id} className="relative group">
                                        <img src={image.url} alt="Gallery preview" className="h-24 w-24 object-cover rounded-md border" />
                                        <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100" onClick={() => removeGalleryImage(index)}><X className="h-4 w-4"/></Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" className="h-24 w-24" onClick={() => handleFileUpload('gallery')}>
                                    <ImageIcon className="text-muted-foreground"/>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle>Colors</CardTitle>
                             <Button type="button" variant="outline" size="sm" onClick={() => appendColor({ name: '', images: [] })}><PlusCircle className="mr-2"/>Add Color</Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             {colorFields.map((field, index) => (
                                <div key={field.id} className="flex flex-col gap-4 p-4 border rounded-md">
                                     <input
                                        type="file"
                                        className="hidden"
                                        ref={el => {fileInputRefs.current[`color-${index}`] = el}}
                                        onChange={(e) => handleFileChange(e, 'color', index)}
                                        accept="image/*"
                                    />
                                    <div className="flex justify-between items-start">
                                         <FormField control={form.control} name={`colors.${index}.name`} render={({ field }) => (
                                            <FormItem className="flex-1 mr-4"><FormLabel>Color Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                         )}/>
                                         <Button type="button" variant="ghost" size="icon" onClick={() => removeColor(index)}><Trash2 className="text-destructive"/></Button>
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel>Images</FormLabel>
                                        <div className="flex flex-wrap gap-2">
                                            {(watchedFormData.colors?.[index]?.images || []).map((image) => (
                                                <div key={image.id} className="relative group">
                                                    <img src={image.url} alt="Color preview" className="h-20 w-20 object-cover rounded-md border" />
                                                     <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100" onClick={() => removeColorImage(index, image.id)}><X className="h-4 w-4"/></Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" className="h-20 w-20" onClick={() => handleFileUpload('color', index)}>
                                                <ImageIcon className="text-muted-foreground"/>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle>Console Options</CardTitle>
                             <Button type="button" variant="outline" size="sm" onClick={() => appendConsoleOption({ name: '', price: 0, asStandard: false })}><PlusCircle className="mr-2"/>Add Option</Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {consoleOptionFields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-2 gap-4 items-center border p-3 rounded-md">
                                    <FormField control={form.control} name={`consoleOptions.${index}.name`} render={({ field }) => (
                                        <FormItem><FormLabel>Option Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                    )}/>
                                    <div className="flex items-end gap-2">
                                        <FormField control={form.control} name={`consoleOptions.${index}.price`} render={({ field }) => (
                                            <FormItem className="flex-1"><FormLabel>Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                        )}/>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeConsoleOption(index)}><Trash2 className="text-destructive"/></Button>
                                    </div>
                                    <div className="col-span-2">
                                        <FormField
                                            control={form.control}
                                            name={`consoleOptions.${index}.asStandard`}
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                     <FormControl>
                                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="cursor-pointer">Set as Standard Option</FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Settings/>Motors</CardTitle>
                            <CardDescription>Select motors and their specific options for this model.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {allMotors.map(motor => {
                                    const isCompatible = watchedFormData.compatibleMotors?.some(m => m.motorId === motor.id);
                                    const motorConfig = watchedFormData.compatibleMotors?.find(m => m.motorId === motor.id);
                                    const propCount = motorConfig?.compatiblePropellerIds?.length || 0;
                                    const optionCount = motorConfig?.compatibleFactoryOptionIds?.length || 0;
                                    
                                    return (
                                        <div key={motor.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                            <div className="flex items-center gap-3">
                                                <Checkbox 
                                                    id={`motor-${motor.id}`} 
                                                    checked={isCompatible}
                                                    onCheckedChange={(checked) => handleMotorCompatibilityChange(motor.id!, !!checked)}
                                                />
                                                <Label htmlFor={`motor-${motor.id}`} className="font-medium cursor-pointer">{motor.name}</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!isCompatible}
                                                    onClick={() => { setEditingMotorForProps(motor); setIsMotorPropellerDialogOpen(true); }}
                                                >
                                                    Propellers ({propCount})
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!isCompatible}
                                                    onClick={() => { setEditingMotorForOptions(motor); setIsMotorOptionsDialogOpen(true); }}
                                                >
                                                    Options ({optionCount})
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                                <CardTitle>Rigging Kits</CardTitle>
                                <CardDescription>Manage which rigging kits can be fitted to this boat model.</CardDescription>
                            </div>
                            <Button type="button" variant="secondary" onClick={() => setIsRiggingKitDialogOpen(true)}>
                                Manage Kits
                            </Button>
                        </CardHeader>
                        <CardContent>
                             <div className="space-y-2">
                                {selectedRiggingKits.length > 0 ? (
                                    selectedRiggingKits.map(kit => (
                                        <div key={kit.id} className="flex items-center space-x-2">
                                            <Checkbox id={`display-kit-${kit.id}`} checked disabled />
                                            <label htmlFor={`display-kit-${kit.id}`} className="text-sm">
                                                {kit.name}
                                            </label>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No rigging kits selected.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Truck/>Trailers</CardTitle>
                            <CardDescription>Select trailers and their specific factory options for this model.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {allTrailers.map(trailer => {
                                    const isCompatible = watchedFormData.compatibleTrailers?.some(t => t.trailerId === trailer.id);
                                    const trailerOptionsCount = watchedFormData.compatibleTrailers?.find(t => t.trailerId === trailer.id)?.compatibleFactoryOptionIds?.length || 0;
                                    return (
                                        <div key={trailer.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                            <div className="flex items-center gap-3">
                                                <Checkbox 
                                                    id={`trailer-${trailer.id}`} 
                                                    checked={isCompatible}
                                                    onCheckedChange={(checked) => handleTrailerCompatibilityChange(trailer.id!, !!checked)}
                                                />
                                                <Label htmlFor={`trailer-${trailer.id}`} className="font-medium cursor-pointer">{trailer.name}</Label>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={!isCompatible}
                                                onClick={() => { setEditingTrailerForOptions(trailer); setIsTrailerOptionsDialogOpen(true); }}
                                            >
                                                Manage Options ({trailerOptionsCount})
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-start justify-between">
                             <div>
                                <CardTitle>Factory Options</CardTitle>
                                <CardDescription>Select boat-specific options or entire categories compatible with this model.</CardDescription>
                            </div>
                            <Button asChild variant="link" className="text-sm">
                                <Link href="/catalogue/factory-options">
                                    Manage Options <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {boatFactoryCategories.map(cat => {
                                    const optionsInCategory = boatFactoryOptions.filter(opt => opt.categoryId === cat.id);
                                    if (optionsInCategory.length === 0) return null;

                                    return (
                                        <div key={cat.id} className="space-y-2">
                                            <h4 className="font-semibold">{cat.name}</h4>
                                            <div className="pl-4 space-y-2">
                                                {optionsInCategory.map(opt => (
                                                    <FormField
                                                        key={opt.id}
                                                        control={form.control}
                                                        name="compatibleFactoryOptionIds"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0">
                                                                 <div className="flex items-center space-x-3">
                                                                     <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleToggleStandardOption(opt.id!)}>
                                                                        <Star className={cn("h-4 w-4", (watchedFormData.standardFactoryOptionIds || []).includes(opt.id!) ? 'text-yellow-500 fill-yellow-400' : 'text-muted-foreground')} />
                                                                    </Button>
                                                                    <FormControl>
                                                                        <Checkbox
                                                                            checked={field.value?.includes(opt.id!)}
                                                                            onCheckedChange={(checked) => {
                                                                                return checked
                                                                                ? field.onChange([...(field.value || []), opt.id])
                                                                                : field.onChange((field.value || []).filter(value => value !== opt.id))
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                     <FormLabel className="font-normal cursor-pointer w-full flex items-center gap-2">
                                                                        {opt.name}
                                                                    </FormLabel>
                                                                </div>
                                                                {opt.sellPrice > 0 && <span className="text-sm text-muted-foreground font-medium">{formatCurrency(opt.sellPrice)}</span>}
                                                            </FormItem>
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            <Separator />
                                        </div>
                                    )
                                })}
                                <div>
                                    <h4 className="font-semibold mb-2">Uncategorized Options</h4>
                                    <div className="pl-4 space-y-2">
                                        {boatFactoryOptions.filter(o => !o.categoryId).map(opt => (
                                            <FormField
                                                key={opt.id}
                                                control={form.control}
                                                name="compatibleFactoryOptionIds"
                                                render={({ field }) => (
                                                     <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0">
                                                         <div className="flex items-center space-x-3">
                                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleToggleStandardOption(opt.id!)}>
                                                                <Star className={cn("h-4 w-4", (watchedFormData.standardFactoryOptionIds || []).includes(opt.id!) ? 'text-yellow-500 fill-yellow-400' : 'text-muted-foreground')} />
                                                            </Button>
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(opt.id!)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                        ? field.onChange([...(field.value || []), opt.id])
                                                                        : field.onChange((field.value || []).filter(value => value !== opt.id))
                                                                    }}
                                                                />
                                                            </FormControl>
                                                             <FormLabel className="font-normal cursor-pointer w-full flex items-center gap-2">
                                                                {opt.name}
                                                             </FormLabel>
                                                        </div>
                                                        {opt.sellPrice > 0 && <span className="text-sm text-muted-foreground font-medium">{formatCurrency(opt.sellPrice)}</span>}
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                 {/* Right column */}
                <div className="space-y-8">
                     <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle>Standard Features</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={() => appendFeature({ value: '' })}><PlusCircle className="mr-2"/>Add Feature</Button>
                        </CardHeader>
                        <CardContent>
                             <div className="space-y-2">
                                {featureFields.map((field, index) => (
                                    <div key={field.id} className="flex items-center gap-2">
                                        <FormField control={form.control} name={`standardFeatures.${index}.value`} render={({ field }) => (
                                            <FormItem className="flex-1"><FormControl><Input {...field} /></FormControl></FormItem>
                                        )}/>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeFeature(index)}><Trash2 className="text-destructive"/></Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle>Specifications</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={() => appendSpec({ name: '', value: '' })}><PlusCircle className="mr-2"/>Add Specification</Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             {specFields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-2 gap-4 items-center">
                                     <FormField control={form.control} name={`specifications.${index}.name`} render={({ field }) => (
                                        <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                     )}/>
                                     <div className="flex items-end gap-2">
                                        <FormField control={form.control} name={`specifications.${index}.value`} render={({ field }) => (
                                            <FormItem className="flex-1"><FormLabel>Value</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                        )}/>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeSpec(index)}><Trash2 className="text-destructive"/></Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle>Key Documents</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={() => appendDoc({id: uuidv4(), name: '', fileUrl: ''})}><PlusCircle className="mr-2"/>Add Document</Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {docFields.map((field, index) => (
                                <div key={field.id} className="flex flex-col gap-4 p-4 border rounded-md">
                                     <input
                                        type="file"
                                        className="hidden"
                                        ref={el => {fileInputRefs.current[`doc-${index}`] = el}}
                                        onChange={(e) => handleFileChange(e, 'doc', index)}
                                        accept=".pdf"
                                    />
                                    <div className="flex justify-between items-start">
                                        <FormField control={form.control} name={`keyDocuments.${index}.name`} render={({ field: nameField }) => (
                                            <FormItem className="flex-1 mr-4">
                                                <FormLabel>Document Name</FormLabel>
                                                <FormControl><Input {...nameField} /></FormControl>
                                            </FormItem>
                                        )}/>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeDoc(index)}>
                                            <Trash2 className="text-destructive" />
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel>Document File</FormLabel>
                                        <div className="flex items-center gap-2">
                                            {watchedFormData.keyDocuments?.[index]?.fileUrl ? (
                                                <Button asChild variant="secondary" size="sm">
                                                    <a href={watchedFormData.keyDocuments[index].fileUrl} target="_blank" rel="noopener noreferrer">
                                                        <Eye className="mr-2 h-4 w-4"/> View Uploaded PDF
                                                    </a>
                                                </Button>
                                            ) : (
                                                <Button type="button" variant="outline" size="sm" onClick={() => handleFileUpload('doc', index)} disabled={uploadingDocId === field.id}>
                                                    {uploadingDocId === field.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4"/>}
                                                    {uploadingDocId === field.id ? 'Uploading...' : 'Upload PDF'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(docFields.length === 0) && (
                                <p className="text-sm text-center text-muted-foreground py-4">No documents added.</p>
                            )}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                                <CardTitle>Dealer Fit Options</CardTitle>
                                <CardDescription>Manage which dealer-fit parts are compatible with this model.</CardDescription>
                            </div>
                            <Button type="button" variant="secondary" onClick={() => setIsDealerFitDialogOpen(true)}>
                                Manage Options
                            </Button>
                        </CardHeader>
                         <CardContent>
                             <div className="space-y-2">
                                {selectedDealerFitParts.length > 0 ? (
                                    selectedDealerFitParts.map(part => (
                                        <div key={part.id} className="flex items-center space-x-2">
                                            <Checkbox id={`display-part-${part.id}`} checked disabled />
                                            <label htmlFor={`display-part-${part.id}`} className="text-sm">
                                                {part.name}
                                            </label>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No dealer-fit options selected.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                                <CardTitle>Dealer Fit Option Bundles</CardTitle>
                                <CardDescription>Manage which dealer-fit kit bundles are compatible with this model.</CardDescription>
                            </div>
                            <Button type="button" variant="secondary" onClick={() => setIsDealerFitKitDialogOpen(true)}>
                                Manage Bundles
                            </Button>
                        </CardHeader>
                         <CardContent>
                             <div className="space-y-2">
                                {selectedDealerFitKits.length > 0 ? (
                                    selectedDealerFitKits.map(kit => (
                                        <div key={kit.id} className="flex items-center space-x-2">
                                            <Checkbox id={`display-kit-${kit.id}`} checked disabled />
                                            <label htmlFor={`display-kit-${kit.id}`} className="text-sm">
                                                {kit.name}
                                            </label>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No dealer-fit kits selected.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}

export default function EditBoatModelPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const auth = getAuth();
    const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
    const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
    const [logo, setLogo] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

     useEffect(() => {
        const fetchInitialData = async () => {
            if(user) {
                const [profile, staticLogo] = await Promise.all([
                    getUserProfile(user.uid),
                    getStaticLogo()
                ]);
                setCurrentUserProfile(profile);
                setLogo(staticLogo);
            }
        }
        fetchInitialData();
    }, [user]);

    const handleSignOut = async () => {
        await signOut(auth);
        router.push('/login');
    };

    if (authLoading || !user) {
        return (
            <SidebarProvider>
                <div className="flex flex-col h-screen">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        <Skeleton className="h-12 w-1/3 mb-8" />
                        <Skeleton className="h-96 w-full" />
                    </main>
                </div>
            </SidebarProvider>
        );
    }
    
    return (
        <SidebarProvider 
            logo={logo} 
            onSignOut={handleSignOut} 
            onProfileClick={() => setIsProfileDialogOpen(true)}
            currentUserProfile={currentUserProfile}
        >
            {currentUserProfile && (
                <UserProfileDialog 
                    isOpen={isProfileDialogOpen}
                    setIsOpen={setIsProfileDialogOpen}
                    userProfile={currentUserProfile}
                    onSave={() => {}}
                />
            )}
            <EditBoatModelPageContent />
        </SidebarProvider>
    );
}

const preconfigFormSchema = z.object({
  name: z.string().min(1, 'Configuration name is required.'),
  material: z.string().optional(),
  color: z.string().optional(),
  trailer: z.string().optional(),
  motor: z.string().optional(),
  rigging: z.string().optional(),
  factoryOptions: z.array(z.string()).optional(),
  dealerFitOptions: z.array(z.string()).optional(),
});
type PreconfigFormValues = z.infer<typeof preconfigFormSchema>;


const PreconfigDialog = ({ isOpen, setIsOpen, onSave, model, initialData, allMotors, allRiggingKits, allTrailers, allFactoryOptions, allDealerFitParts, preconfigCount }: {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onSave: (data: Partial<Preconfiguration>) => void;
    model: BoatModel;
    initialData: Partial<Preconfiguration> | null;
    allMotors: CatalogueMotor[];
    allRiggingKits: RiggingKit[];
    allTrailers: CatalogueTrailer[];
    allFactoryOptions: FactoryOption[];
    allDealerFitParts: DealerFitPart[];
    preconfigCount: number;
}) => {
    const form = useForm<PreconfigFormValues>({
        resolver: zodResolver(preconfigFormSchema),
    });
    
    useEffect(() => {
        if (isOpen) {
            form.reset({
                name: initialData?.name ?? `Pre-config ${preconfigCount + 1}`,
                material: initialData?.selectedMaterial,
                color: initialData?.selectedColorName,
                trailer: initialData?.selectedTrailerId || '__none__',
                motor: initialData?.compatibleMotorIds?.[0] || '__none__',
                rigging: initialData?.compatibleRiggingKitIds?.[0] || '__none__',
                factoryOptions: initialData?.compatibleFactoryOptionIds || [],
                dealerFitOptions: initialData?.compatibleDealerFitOptionIds || [],
            });
        }
    }, [isOpen, initialData, form, preconfigCount]);
    
    const onSubmit = (data: PreconfigFormValues) => {
        const preconfigData: Partial<Preconfiguration> = {
            name: data.name,
            selectedMaterial: data.material,
            selectedColorName: data.color,
            selectedTrailerId: data.trailer && data.trailer !== '__none__' ? data.trailer : undefined,
            compatibleMotorIds: data.motor && data.motor !== '__none__' ? [data.motor] : [],
            compatibleRiggingKitIds: data.rigging && data.rigging !== '__none__' ? [data.rigging] : [],
            compatibleFactoryOptionIds: data.factoryOptions,
            compatibleDealerFitOptionIds: data.dealerFitOptions,
        };
        onSave(preconfigData);
    };

    const compatibleMotors = useMemo(() => allMotors.filter(m => model.compatibleMotors?.some(cm => cm.motorId === m.id)), [allMotors, model]);
    const compatibleRiggingKits = useMemo(() => allRiggingKits.filter(k => model.compatibleRiggingKitIds?.includes(k.id!)), [allRiggingKits, model]);
    const compatibleFactoryOptions = useMemo(() => allFactoryOptions.filter(o => model.compatibleFactoryOptionIds?.includes(o.id!)), [allFactoryOptions, model]);
    const compatibleDealerFitOptions = useMemo(() => allDealerFitParts.filter(p => model.compatibleDealerFitOptionIds?.includes(p.id!)), [allDealerFitParts, model]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-4xl" onOpenAutoFocus={e => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit' : 'Create'} Pre-configuration</DialogTitle>
                    <DialogDescription>
                        Build a new pre-configured package by selecting from the options compatible with this boat model.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Configuration Name</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <ScrollArea className="h-[60vh] -mx-6 px-6">
                            <div className="space-y-6">
                                <Card>
                                     <CardHeader><CardTitle>Hull</CardTitle></CardHeader>
                                     <CardContent className="grid grid-cols-2 gap-4">
                                         <FormField control={form.control} name="material" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Material</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a material" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {(model.materials || []).map(mat => <SelectItem key={mat} value={mat}>{mat}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}/>
                                          <FormField control={form.control} name="color" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Color</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a color" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {(model.colors || []).map(col => <SelectItem key={col.name} value={col.name}>{col.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}/>
                                     </CardContent>
                                </Card>
                                <Card>
                                     <CardHeader><CardTitle>Trailer</CardTitle></CardHeader>
                                     <CardContent>
                                         <FormField control={form.control} name="trailer" render={({ field }) => (
                                            <FormItem>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a trailer" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="__none__">None</SelectItem>
                                                        {allTrailers.map(trailer => <SelectItem key={trailer.id} value={trailer.id!}>{trailer.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}/>
                                     </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle>Motor</CardTitle></CardHeader>
                                    <CardContent>
                                        <FormField control={form.control} name="motor" render={({ field }) => (
                                            <FormItem>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a motor" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="__none__">None</SelectItem>
                                                        {compatibleMotors.map(motor => <SelectItem key={motor.id} value={motor.id!}>{motor.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}/>
                                    </CardContent>
                                </Card>
                                 <Card>
                                    <CardHeader><CardTitle>Rigging Kit</CardTitle></CardHeader>
                                    <CardContent>
                                        <FormField control={form.control} name="rigging" render={({ field }) => (
                                            <FormItem>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a rigging kit" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="__none__">None</SelectItem>
                                                        {compatibleRiggingKits.map(kit => <SelectItem key={kit.id} value={kit.id!}>{kit.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}/>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle>Factory Fit Options</CardTitle></CardHeader>
                                    <CardContent>
                                        <FormField control={form.control} name="factoryOptions" render={() => (
                                            <FormItem>
                                                {compatibleFactoryOptions.map(option => (
                                                    <FormField key={option.id} control={form.control} name="factoryOptions" render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                            <FormControl><Checkbox checked={field.value?.includes(option.id!)} onCheckedChange={(checked) => {return checked ? field.onChange([...(field.value || []), option.id]) : field.onChange((field.value || []).filter(value => value !== option.id))}} /></FormControl>
                                                            <FormLabel className="font-normal">{option.name}</FormLabel>
                                                        </FormItem>
                                                    )} />
                                                ))}
                                            </FormItem>
                                        )}/>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle>Dealer Fit Options</CardTitle></CardHeader>
                                    <CardContent>
                                        <FormField control={form.control} name="dealerFitOptions" render={() => (
                                            <FormItem>
                                                {compatibleDealerFitOptions.map(part => (
                                                    <FormField key={part.id} control={form.control} name="dealerFitOptions" render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                            <FormControl><Checkbox checked={field.value?.includes(part.id!)} onCheckedChange={(checked) => {return checked ? field.onChange([...(field.value || []), part.id]) : field.onChange((field.value || []).filter(value => value !== part.id))}} /></FormControl>
                                                            <FormLabel className="font-normal">{part.name}</FormLabel>
                                                        </FormItem>
                                                    )} />
                                                ))}
                                            </FormItem>
                                        )}/>
                                    </CardContent>
                                </Card>
                            </div>
                        </ScrollArea>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit">Save Configuration</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

    