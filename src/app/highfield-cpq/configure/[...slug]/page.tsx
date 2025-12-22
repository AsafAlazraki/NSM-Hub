
"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, List, Ship, Palette, Sparkles, Check, ChevronDown, Sheet as SheetIcon, ImageIcon, Wrench, PlusCircle, Trash2, Upload, FileText, Eye, Loader2, Save } from 'lucide-react';
import { getBoatBrands, getBoatModels, getBoatModelById, getBoatRanges, getCatalogueMotors, getRiggingKits, getCatalogueTrailers, getBmtQuoteById, saveBmtQuote, getUserProfile, getFactoryOptionCategories, getCatalogueFactoryOptions, getDealerFitBrands, getDealerFitCategories, getDealerFitParts, getStaticLogo } from '@/lib/storage';
import type { BoatBrand, BoatRange, BoatModel, CatalogueMotor, Propeller, RiggingKit, CatalogueTrailer, BMTQuote, UserDetails, FactoryOptionCategory, FactoryOption, OptionTag, DealerFitBrand, DealerFitCategory, DealerFitPart, UserProfile, ColorOption } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ConfigurationStepper } from '@/components/highfield-cpq/ConfigurationStepper';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { HullOptions } from '@/components/highfield-cpq/HullOptions';
import { ConsoleOptions } from '@/components/highfield-cpq/ConsoleOptions';
import { MotorOptions } from '@/components/highfield-cpq/MotorOptions';
import { RiggingOptions } from '@/components/highfield-cpq/RiggingOptions';
import { TrailerOptions } from '@/components/highfield-cpq/TrailerOptions';
import { FactoryFitOptions } from '@/components/highfield-cpq/FactoryFitOptions';
import { DealerFitOptions } from '@/components/highfield-cpq/DealerFitOptions';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { getAuth, signOut } from 'firebase/auth';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UserProfileDialog } from '@/components/UserProfileDialog';


type HullSubStep = 'hull-range' | 'hull-model' | 'hull-material' | 'hull-color';

interface BasePackageSelectorProps {
    models: BoatModel[];
    ranges: BoatRange[];
    allMotors: CatalogueMotor[];
    allTrailers: CatalogueTrailer[];
    selectedRangeId: string | null;
    selectedModelId: string | null;
    handleRangeSelection: (rangeId: string) => void;
    handleModelSelection: (modelId: string) => void;
    selectedColor: ColorOption | null;
    handleColorChange: (colorName: string) => void;
    selectedModel: BoatModel | null;
    selectedMaterial: string | null;
    handleMaterialChange: (material: string) => void;
    selectedConsole: { name: string; price: number; asStandard?: boolean } | null;
    handleConsoleSelection: (consoleName: string) => void;
    hullIncludesPreDelivery: boolean;
    setHullIncludesPreDelivery: (checked: boolean) => void;
    hullIncludesRegistration: boolean;
    setHullIncludesRegistration: (checked: boolean) => void;
    motorIncludesPreDelivery: boolean;
    setMotorIncludesPreDelivery: (checked: boolean) => void;
    selectedMotor: CatalogueMotor | null;
    handleMotorSelection: (motorId: string) => void;
    selectedPropeller: Propeller | 'N/A' | null;
    handlePropellerSelection: (propId: string) => void;
    allRiggingKits: RiggingKit[];
    selectedRiggingKit: RiggingKit | null;
    handleRiggingKitSelection: (kitId: string) => void;
    selectedTrailer: CatalogueTrailer | null;
    handleTrailerSelection: (trailerId: string) => void;
    trailerIncludesPreDelivery: boolean;
    setTrailerIncludesPreDelivery: (checked: boolean) => void;
    trailerIncludesRegistration: boolean;
    setTrailerIncludesRegistration: (checked: boolean) => void;
    riggingIncludesInstallation: boolean;
    setRiggingIncludesInstallation: (checked: boolean) => void;
}


const BasePackageSelector = ({ models, ranges, allMotors, allTrailers, selectedRangeId, selectedModelId, handleRangeSelection, handleModelSelection, selectedColor, handleColorChange, selectedModel, selectedMaterial, handleMaterialChange, selectedConsole, handleConsoleSelection, hullIncludesPreDelivery, setHullIncludesPreDelivery, hullIncludesRegistration, setHullIncludesRegistration, motorIncludesPreDelivery, setMotorIncludesPreDelivery, selectedMotor, handleMotorSelection, selectedPropeller, handlePropellerSelection, allRiggingKits, selectedRiggingKit, handleRiggingKitSelection, selectedTrailer, handleTrailerSelection, trailerIncludesPreDelivery, setTrailerIncludesPreDelivery, trailerIncludesRegistration, setTrailerIncludesRegistration, riggingIncludesInstallation, setRiggingIncludesInstallation }: BasePackageSelectorProps) => {
    const [activeHullStep, setActiveHullStep] = useState<HullSubStep | null>('hull-range');
    const [activeTab, setActiveTab] = useState('hull');
    
    const handleLocalRangeSelection = (rangeId: string) => {
        handleRangeSelection(rangeId);
        setActiveHullStep('hull-model');
    }

    const handleLocalModelSelection = (modelId: string) => {
        handleModelSelection(modelId);
        const model = models.find(m => m.id === modelId);
        if (model?.materials && model.materials.length > 0) {
            setActiveHullStep('hull-material');
        } else {
            setActiveHullStep('hull-color');
        }
    }
    
    const handleLocalMaterialChange = (material: string) => {
        handleMaterialChange(material);
        setActiveHullStep('hull-color');
    }
    
    const handleLocalColorChange = (colorName: string) => {
        handleColorChange(colorName);
        setActiveHullStep(null); // Collapse the hull section after color selection
    }

    const compatibleMotors = useMemo(() => {
        if (!selectedModel || !selectedModel.compatibleMotors) return [];
        const compatibleMotorIds = new Set(selectedModel.compatibleMotors.map(m => m.motorId));
        return allMotors.filter(m => compatibleMotorIds.has(m.id!));
    }, [selectedModel, allMotors]);

    const compatibleRiggingKits = useMemo(() => {
        if (!selectedModel || !selectedModel.compatibleRiggingKitIds) return [];
        return allRiggingKits.filter(kit => selectedModel.compatibleRiggingKitIds?.includes(kit.id!));
    }, [selectedModel, allRiggingKits]);
    
    const compatibleTrailers = useMemo(() => {
        if (!selectedModel || !selectedModel.compatibleTrailers) return allTrailers; // Fallback to all if not defined
        const compatibleTrailerIds = new Set(selectedModel.compatibleTrailers.map(t => t.trailerId));
        return allTrailers.filter(t => compatibleTrailerIds.has(t.id!));
    }, [selectedModel, allTrailers]);


    return (
        <Card>
            <CardHeader>
                <CardTitle>Base Package</CardTitle>
                <CardDescription>Configure the main components of the boat.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="hull">Hull</TabsTrigger>
                        <TabsTrigger value="console" disabled={!selectedModel || !selectedColor}>Console</TabsTrigger>
                        <TabsTrigger value="motor" disabled={!selectedModel || !selectedColor}>Motor</TabsTrigger>
                        <TabsTrigger value="rigging" disabled={!selectedModel || !selectedColor}>Rigging</TabsTrigger>
                        <TabsTrigger value="trailer" disabled={!selectedModel || !selectedColor}>Trailer</TabsTrigger>
                    </TabsList>
                    <TabsContent value="hull">
                         <HullOptions 
                            models={models}
                            ranges={ranges}
                            selectedRangeId={selectedRangeId}
                            selectedModelId={selectedModelId}
                            handleRangeSelection={handleLocalRangeSelection}
                            handleModelSelection={handleLocalModelSelection}
                            selectedColor={selectedColor}
                            handleColorChange={handleLocalColorChange}
                            selectedModel={selectedModel}
                            selectedMaterial={selectedMaterial}
                            handleMaterialChange={handleLocalMaterialChange}
                            activeHullStep={activeHullStep}
                            setActiveHullStep={setActiveHullStep}
                            hullIncludesPreDelivery={hullIncludesPreDelivery}
                            setHullIncludesPreDelivery={setHullIncludesPreDelivery}
                            hullIncludesRegistration={hullIncludesRegistration}
                            setHullIncludesRegistration={setHullIncludesRegistration}
                         />
                    </TabsContent>
                    <TabsContent value="console">
                        <ConsoleOptions
                            selectedModel={selectedModel}
                            selectedConsole={selectedConsole}
                            handleConsoleSelection={handleConsoleSelection}
                        />
                    </TabsContent>
                    <TabsContent value="motor">
                         <MotorOptions 
                            compatibleMotors={compatibleMotors}
                            selectedMotor={selectedMotor}
                            handleMotorSelection={handleMotorSelection}
                            selectedPropeller={selectedPropeller}
                            handlePropellerSelection={handlePropellerSelection}
                            motorIncludesPreDelivery={motorIncludesPreDelivery}
                            setMotorIncludesPreDelivery={setMotorIncludesPreDelivery}
                         />
                    </TabsContent>
                     <TabsContent value="rigging">
                         <RiggingOptions 
                            riggingKits={compatibleRiggingKits}
                            selectedRiggingKit={selectedRiggingKit}
                            onKitSelect={handleRiggingKitSelection}
                            riggingIncludesInstallation={riggingIncludesInstallation}
                            setRiggingIncludesInstallation={setRiggingIncludesInstallation}
                         />
                    </TabsContent>
                    <TabsContent value="trailer">
                        <TrailerOptions
                            allTrailers={compatibleTrailers}
                            selectedTrailer={selectedTrailer}
                            onTrailerSelect={handleTrailerSelection}
                            trailerIncludesPreDelivery={trailerIncludesPreDelivery}
                            setTrailerIncludesPreDelivery={setTrailerIncludesPreDelivery}
                            trailerIncludesRegistration={trailerIncludesRegistration}
                            setTrailerIncludesRegistration={setTrailerIncludesRegistration}
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}

type GalleryImage = {
    id: string;
    src: string;
    alt: string;
    category: InteractionCategory | 'dealer-fit-option' | 'factory-option' | 'gallery' | 'propeller';
};

type InteractionCategory = 'hull' | 'motor' | 'trailer' | 'factory-option' | 'dealer-fit-option' | 'gallery' | 'propeller';

function ConfigureBoatPageContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    
    // --- Data Fetching State ---
    const [brand, setBrand] = useState<BoatBrand | null>(null);
    const [ranges, setRanges] = useState<BoatRange[]>([]);
    const [models, setModels] = useState<BoatModel[]>([]);
    const [allMotors, setAllMotors] = useState<CatalogueMotor[]>([]);
    const [allRiggingKits, setAllRiggingKits] = useState<RiggingKit[]>([]);
    const [allTrailers, setAllTrailers] = useState<CatalogueTrailer[]>([]);
    const [allFactoryCategories, setAllFactoryCategories] = useState<FactoryOptionCategory[]>([]);
    const [allFactoryOptions, setAllFactoryOptions] = useState<FactoryOption[]>([]);
    const [allDealerFitBrands, setAllDealerFitBrands] = useState<DealerFitBrand[]>([]);
    const [allDealerFitCategories, setAllDealerFitCategories] = useState<DealerFitCategory[]>([]);
    const [allDealerFitParts, setAllDealerFitParts] = useState<DealerFitPart[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- CPQ Quote State ---
    const [bmtQuote, setBmtQuote] = useState<BMTQuote | null>(null);
    const quoteId = useMemo(() => searchParams.get('quoteId'), [searchParams]);
    const fromUrl = useMemo(() => searchParams.get('from'), [searchParams]);


    // Derived values from params
    const [brandId, modelIdFromUrl, step] = useMemo(() => {
        const slug = params.slug as string[];
        return [slug[0], slug[1] || null, (slug[2] || 'base-package') as 'base-package' | 'factory-fit' | 'dealer-fit' | 'summary'];
    }, [params.slug]);

    // --- Selections ---
    const selectedRangeId = bmtQuote?.selectedRangeId || null;
    const selectedModelId = bmtQuote?.selectedModelId || modelIdFromUrl;
    const selectedMaterial = bmtQuote?.selectedMaterial || null;
    const selectedColorName = bmtQuote?.selectedColorName || null;
    const selectedConsoleName = bmtQuote?.selectedConsoleName || null;
    const selectedMotorId = bmtQuote?.selectedMotorId || null;
    const selectedPropellerId = bmtQuote?.selectedPropellerId || null;
    const selectedRiggingKitId = bmtQuote?.selectedRiggingKitId || null;
    const selectedTrailerId = bmtQuote?.selectedTrailerId || null;
    const selectedFactoryOptionIds = bmtQuote?.selectedFactoryOptionIds || [];
    const selectedDealerFitOptionIds = bmtQuote?.selectedDealerFitOptionIds || [];
    
    const hullIncludesPreDelivery = bmtQuote?.hullIncludesPreDelivery ?? false;
    const hullIncludesRegistration = bmtQuote?.hullIncludesRegistration ?? false;
    const motorIncludesPreDelivery = bmtQuote?.motorIncludesPreDelivery ?? false;
    const riggingIncludesInstallation = bmtQuote?.riggingIncludesInstallation ?? false;
    const trailerIncludesPreDelivery = bmtQuote?.trailerIncludesPreDelivery ?? false;
    const trailerIncludesRegistration = bmtQuote?.trailerIncludesRegistration ?? false;
    
    // --- Memoized Selections for UI ---
    const selectedModel = useMemo(() => models.find(m => m.id === selectedModelId) || null, [models, selectedModelId]);
    const selectedColor = useMemo(() => selectedModel?.colors?.find(c => c.name === selectedColorName) || null, [selectedModel, selectedColorName]);
    const selectedConsole = useMemo(() => selectedModel?.consoleOptions?.find(c => c.name === selectedConsoleName) || null, [selectedModel, selectedConsoleName]);
    const selectedMotor = useMemo(() => allMotors.find(m => m.id === selectedMotorId) || null, [allMotors, selectedMotorId]);
    const selectedPropeller = useMemo(() => {
        if (selectedPropellerId === 'N/A') return 'N/A';
        return selectedMotor?.propellers?.find(p => p.id === selectedPropellerId) || null;
    }, [selectedMotor, selectedPropellerId]);
    const selectedRiggingKit = useMemo(() => allRiggingKits.find(k => k.id === selectedRiggingKitId) || null, [allRiggingKits, selectedRiggingKitId]);
    const selectedTrailer = useMemo(() => allTrailers.find(t => t.id === selectedTrailerId) || null, [allTrailers, selectedTrailerId]);

    // --- Gallery State ---
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [lastInteractedItem, setLastInteractedItem] = useState<{ category: InteractionCategory; id?: string } | null>(null);

    // --- Initial Data Loading ---
    useEffect(() => {
        const fetchInitialData = async () => {
            if (brandId && user) {
                setIsLoading(true);
                try {
                    const [
                        allBrands, allRanges, allModels, allMotors, allRigging, allTrailers, 
                        allFactoryCats, allFactoryOpts,
                        allDealerBrands, allDealerCats, allDealerParts
                    ] = await Promise.all([
                        getBoatBrands(), getBoatRanges(), getBoatModels(), getCatalogueMotors(), getRiggingKits(), getCatalogueTrailers(), 
                        getFactoryOptionCategories(), getCatalogueFactoryOptions(),
                        getDealerFitBrands(), getDealerFitCategories(), getDealerFitParts()
                    ]);

                    const currentBrand = allBrands.find(b => b.id === brandId) || null;
                    setBrand(currentBrand);
                    setAllMotors(allMotors);
                    setAllRiggingKits(allRigging);
                    setAllTrailers(allTrailers);
                    setAllFactoryCategories(allFactoryCats);
                    setAllFactoryOptions(allFactoryOpts);
                    setAllDealerFitBrands(allDealerBrands);
                    setAllDealerFitCategories(allDealerCats);
                    setAllDealerFitParts(allDealerParts);

                    if (currentBrand) {
                        const brandRanges = allRanges.filter(r => r.brandId === brandId);
                        setRanges(brandRanges);

                        const rangeIds = new Set(brandRanges.map(r => r.id!));
                        const resolvedModels = (await Promise.all(allModels.filter(m => rangeIds.has(m.rangeId!)).map(m => getBoatModelById(m.id!)))).filter((m): m is BoatModel => m !== null);
                        setModels(resolvedModels);
                    }

                    if (quoteId) {
                        const existingQuote = await getBmtQuoteById(quoteId);
                        if (existingQuote) setBmtQuote(existingQuote);
                    } else {
                        const userProfile = await getUserProfile(user.uid);
                        const newQuote: BMTQuote = {
                            id: uuidv4(),
                            userId: user.uid,
                            user: {
                                ref: '',
                                name: userProfile?.name || user.displayName || '',
                                email: userProfile?.email || user.email || '',
                                phone: userProfile?.phone || '',
                                role: userProfile?.role || ''
                            },
                            brandId: brandId,
                            brandName: currentBrand?.name || '',
                            status: 'Draft',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            selectedRangeId: null, selectedModelId: modelIdFromUrl, selectedMaterial: null, selectedColorName: null, selectedConsoleName: null, selectedMotorId: null, selectedPropellerId: null, selectedRiggingKitId: null, selectedTrailerId: null, selectedFactoryOptionIds: [], selectedDealerFitOptionIds: [],
                            selectedControlId: null, selectedGaugeId: null,
                            hullIncludesPreDelivery: false, hullIncludesRegistration: false, motorIncludesPreDelivery: false, riggingIncludesInstallation: false, trailerIncludesPreDelivery: false, trailerIncludesRegistration: false,
                            pricing: { hullPrice: 0, consolePrice: 0, motorPrice: 0, propellerPrice: 0, riggingKitPrice: 0, trailerPrice: 0 },
                        };
                        setBmtQuote(newQuote);
                        router.replace(`/highfield-cpq/configure/${brandId}/${modelIdFromUrl || ''}?quoteId=${newQuote.id}`, { scroll: false });
                    }
                } catch (error) {
                    console.error("Error fetching CPQ data:", error);
                    toast({ variant: 'destructive', title: "Data Error", description: "Failed to load configuration data."});
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchInitialData();
    }, [brandId, user, quoteId, modelIdFromUrl, toast, router]);

    // --- Autosave ---
    useEffect(() => {
        if (bmtQuote && bmtQuote.status === 'Draft') {
            const handler = setTimeout(() => {
                saveBmtQuote(bmtQuote);
            }, 1000); // Save 1 second after the last change
            return () => clearTimeout(handler);
        }
    }, [bmtQuote]);
    
    // --- Pricing Snapshot Updates ---
    useEffect(() => {
        if (bmtQuote && selectedModel) {
            const pricing = selectedModel.pricing?.find(p => p.material === selectedMaterial && p.color === selectedColorName);
            const hullPrice = pricing?.price || 0;
            if (bmtQuote.pricing.hullPrice !== hullPrice) {
                updateQuote({ pricing: { ...bmtQuote.pricing, hullPrice } });
            }
        }
    }, [selectedMaterial, selectedColorName, selectedModel, bmtQuote]);

    useEffect(() => {
        if (bmtQuote) {
            const consolePrice = selectedConsole?.price || 0;
            if (bmtQuote.pricing.consolePrice !== consolePrice) {
                updateQuote({ pricing: { ...bmtQuote.pricing, consolePrice } });
            }
        }
    }, [selectedConsole, bmtQuote]);

    useEffect(() => {
        if (bmtQuote) {
            const motorPrice = selectedMotor?.sellPrice || 0;
            if (bmtQuote.pricing.motorPrice !== motorPrice) {
                updateQuote({ pricing: { ...bmtQuote.pricing, motorPrice } });
            }
        }
    }, [selectedMotor, bmtQuote]);
    
    useEffect(() => {
        if (bmtQuote) {
            const propPrice = (typeof selectedPropeller === 'object' && selectedPropeller && 'sellPrice' in selectedPropeller) ? selectedPropeller.sellPrice : 0;
            if (bmtQuote.pricing.propellerPrice !== propPrice) {
                updateQuote({ pricing: { ...bmtQuote.pricing, propellerPrice: propPrice } });
            }
        }
    }, [selectedPropeller, bmtQuote]);
    

    useEffect(() => {
        if (bmtQuote) {
            const riggingPrice = selectedRiggingKit?.sellPrice || 0;
            if (bmtQuote.pricing.riggingKitPrice !== riggingPrice) {
                updateQuote({ pricing: { ...bmtQuote.pricing, riggingKitPrice: riggingPrice } });
            }
        }
    }, [selectedRiggingKit, bmtQuote]);
    
    useEffect(() => {
        if (bmtQuote) {
            const trailerPrice = selectedTrailer?.price || 0;
            if (bmtQuote.pricing.trailerPrice !== trailerPrice) {
                updateQuote({ pricing: { ...bmtQuote.pricing, trailerPrice: trailerPrice } });
            }
        }
    }, [selectedTrailer, bmtQuote]);


    // --- Handlers for Selections ---
    const updateQuote = (updates: Partial<BMTQuote>) => {
        setBmtQuote(prev => prev ? { ...prev, ...updates } : null);
    };
    
    // Wrapped handlers
    const handleRangeSelection = (rangeId: string) => updateQuote({ selectedRangeId: rangeId, selectedModelId: null, selectedMaterial: null, selectedColorName: null, selectedConsoleName: null, selectedMotorId: null, selectedPropellerId: null, selectedRiggingKitId: null, selectedTrailerId: null });
    const handleModelSelection = (modelId: string) => updateQuote({ selectedModelId: modelId, selectedMaterial: null, selectedColorName: null, selectedConsoleName: null, selectedMotorId: null, selectedPropellerId: null, selectedRiggingKitId: null, selectedTrailerId: null });
    const handleMaterialChange = (material: string) => updateQuote({ selectedMaterial: material });
    const handleColorChange = (colorName: string) => { updateQuote({ selectedColorName: colorName }); setLastInteractedItem({ category: 'hull' }); };
    const handleConsoleSelection = (consoleName: string) => updateQuote({ selectedConsoleName: consoleName });
    const handleMotorSelection = (motorId: string) => { updateQuote({ selectedMotorId: motorId, selectedPropellerId: null }); setLastInteractedItem({ category: 'motor' }); };
    const handlePropellerSelection = (propId: string) => { updateQuote({ selectedPropellerId: propId }); setLastInteractedItem({ category: 'propeller', id: propId }); };
    const handleRiggingKitSelection = (kitId: string) => { updateQuote({ selectedRiggingKitId: kitId }); };
    const handleTrailerSelection = (trailerId: string) => { updateQuote({ selectedTrailerId: trailerId }); setLastInteractedItem({ category: 'trailer' }); };
    
    const handleFactoryOptionToggle = (optionId: string) => {
        const currentIds = bmtQuote?.selectedFactoryOptionIds || [];
        const isSelected = currentIds.includes(optionId);
        const newIds = isSelected
            ? currentIds.filter(id => id !== optionId)
            : [...currentIds, optionId];
        updateQuote({ selectedFactoryOptionIds: newIds });

        if (!isSelected) {
            const option = allFactoryOptions.find(opt => opt.id === optionId);
            if (option?.imageUrl) {
                setLastInteractedItem({ category: 'factory-option', id: option.id });
            }
        }
    };

    const handleDealerFitOptionToggle = (optionId: string) => {
        const currentIds = bmtQuote?.selectedDealerFitOptionIds || [];
        const isSelected = currentIds.includes(optionId);
        const newIds = isSelected
            ? currentIds.filter(id => id !== optionId)
            : [...currentIds, optionId];
        updateQuote({ selectedDealerFitOptionIds: newIds });

        if (!isSelected) {
            const part = allDealerFitParts.find(p => p.id === optionId);
            if (part?.imageUrl) {
                setLastInteractedItem({ category: 'dealer-fit-option', id: part.id });
            }
        }
    };

    const setHullIncludesPreDelivery = (checked: boolean) => updateQuote({ hullIncludesPreDelivery: checked });
    const setHullIncludesRegistration = (checked: boolean) => updateQuote({ hullIncludesRegistration: checked });
    const setMotorIncludesPreDelivery = (checked: boolean) => updateQuote({ motorIncludesPreDelivery: checked });
    const setRiggingIncludesInstallation = (checked: boolean) => updateQuote({ riggingIncludesInstallation: checked });
    const setTrailerIncludesPreDelivery = (checked: boolean) => updateQuote({ trailerIncludesPreDelivery: checked });
    const setTrailerIncludesRegistration = (checked: boolean) => updateQuote({ trailerIncludesRegistration: checked });

    // --- Gallery Logic ---
    const galleryImages = useMemo(() => {
        const newGallery: GalleryImage[] = [];

        // Hull images
        if (selectedColor && selectedModel?.colors) {
            const colorData = selectedModel.colors.find(c => c.name === selectedColor.name);
            if (colorData?.images) {
                colorData.images.forEach(img => newGallery.push({ id: `hull-${img.id}`, src: img.url, alt: `${selectedModel.name} - ${colorData.name}`, category: 'hull' }));
            }
        }
        
        // General gallery images
        if (selectedModel?.galleryImages) {
            selectedModel.galleryImages.forEach(img => newGallery.push({ id: `gallery-${img.id}`, src: img.url, alt: selectedModel.name, category: 'gallery' }));
        }

        // Motor image
        if (selectedMotor?.imageUrl) newGallery.push({ id: 'motor', src: selectedMotor.imageUrl, alt: selectedMotor.name, category: 'motor' });

        // Propeller image
        if (typeof selectedPropeller === 'object' && selectedPropeller && selectedPropeller.imageUrl) {
            newGallery.push({ id: `propeller-${selectedPropeller.id}`, src: selectedPropeller.imageUrl, alt: selectedPropeller.name, category: 'propeller' });
        }


        // Trailer image
        if (selectedTrailer?.imageUrl) newGallery.push({ id: 'trailer', src: selectedTrailer.imageUrl, alt: selectedTrailer.name, category: 'trailer' });
        
        // Factory option images
        selectedFactoryOptionIds.forEach(optionId => {
            const option = allFactoryOptions.find(opt => opt.id === optionId);
            if (option?.imageUrl) {
                newGallery.push({ id: `factory-${option.id}`, src: option.imageUrl, alt: option.name, category: 'factory-option' });
            }
        });

        // Dealer fit option images
        selectedDealerFitOptionIds.forEach(optionId => {
            const part = allDealerFitParts.find(p => p.id === optionId);
            if (part?.imageUrl) {
                newGallery.push({ id: `dealer-fit-${part.id}`, src: part.imageUrl, alt: part.name, category: 'dealer-fit-option' });
            }
        });


        return newGallery;
    }, [selectedColor, selectedModel, selectedMotor, selectedPropeller, selectedTrailer, selectedFactoryOptionIds, allFactoryOptions, selectedDealerFitOptionIds, allDealerFitParts]);

    useEffect(() => {
        if (!carouselApi || galleryImages.length === 0 || !lastInteractedItem) return;
        
        let imageIdToFind: string | undefined;

        switch (lastInteractedItem.category) {
            case 'hull':
                imageIdToFind = galleryImages.find(img => img.category === 'hull')?.id;
                break;
            case 'motor':
                imageIdToFind = 'motor';
                break;
             case 'propeller':
                imageIdToFind = `propeller-${lastInteractedItem.id}`;
                break;
            case 'trailer':
                imageIdToFind = 'trailer';
                break;
            case 'factory-option':
                imageIdToFind = `factory-${lastInteractedItem.id}`;
                break;
            case 'dealer-fit-option':
                imageIdToFind = `dealer-fit-${lastInteractedItem.id}`;
                break;
        }

        if (imageIdToFind) {
            const imageIndex = galleryImages.findIndex(img => img.id === imageIdToFind);
            if (imageIndex > -1) {
                 setTimeout(() => carouselApi.scrollTo(imageIndex, true), 50);
            }
        }

        setLastInteractedItem(null); // Reset after focusing
    }, [galleryImages, carouselApi, lastInteractedItem]);

    useEffect(() => {
        if (!carouselApi) return;
        const onSelect = () => setCurrentSlide(carouselApi.selectedScrollSnap());
        carouselApi.on("select", onSelect);
        return () => { carouselApi.off("select", onSelect) };
    }, [carouselApi]);

    const onDotButtonClick = useCallback((index: number) => {
        if (!carouselApi) return;
        carouselApi.scrollTo(index);
    }, [carouselApi]);


    // --- Navigation ---
    const handleNext = () => {
        if (selectedModelId) {
            const currentStepIndex = STEPS.findIndex(s => s.id === step);
            if (currentStepIndex < STEPS.length - 1) {
                const nextStep = STEPS[currentStepIndex + 1];
                router.push(`/highfield-cpq/configure/${brandId}/${selectedModelId}/${nextStep.path}?quoteId=${quoteId}`);
            }
        } else {
            toast({ variant: 'destructive', title: "Selection Incomplete", description: "Please select a model before proceeding." });
        }
    };

    const handleBack = () => {
        const currentStepIndex = STEPS.findIndex(s => s.id === step);
        if (currentStepIndex > 0) {
            const prevStep = STEPS[currentStepIndex - 1];
            router.push(`/highfield-cpq/configure/${brandId}/${selectedModelId}/${prevStep.path}?quoteId=${quoteId}`);
        }
    };
    
    // --- COMPATIBILITY LOGIC ---
    const hullFactoryOptions = useMemo(() => {
        if (!selectedModel) return [];
        const modelOptionIds = new Set(selectedModel.compatibleFactoryOptionIds || []);
        const categoryOptionIds = allFactoryCategories
            .filter(cat => selectedModel.compatibleFactoryOptionCategoryIds?.includes(cat.id!))
            .flatMap(cat => allFactoryOptions.filter(opt => opt.categoryId === cat.id).map(opt => opt.id!));
        
        const allCompatibleIds = new Set([...modelOptionIds, ...categoryOptionIds]);

        return allFactoryOptions.filter(opt => allCompatibleIds.has(opt.id!) && opt.tag === 'Boat');
    }, [selectedModel, allFactoryOptions, allFactoryCategories]);
    
     const motorFactoryOptions = useMemo(() => {
        if (!selectedMotor) return [];
        const compatibleMotor = selectedModel?.compatibleMotors?.find(m => m.motorId === selectedMotor.id);
        if (!compatibleMotor) return [];

        const optionIds = new Set(compatibleMotor.compatibleFactoryOptionIds || []);

        return allFactoryOptions.filter(opt =>
            opt.tag === 'Motor' && optionIds.has(opt.id!)
        );
    }, [selectedMotor, selectedModel, allFactoryOptions]);

    const trailerFactoryOptions = useMemo(() => {
        if (!selectedTrailer || !selectedModel || !selectedModel.compatibleTrailers) return [];
        const trailerConfig = selectedModel.compatibleTrailers.find(t => t.trailerId === selectedTrailer.id);
        if (!trailerConfig) return [];
        const optionIds = new Set(trailerConfig.compatibleFactoryOptionIds || []);
        return allFactoryOptions.filter(opt => opt.tag === 'Trailer' && optionIds.has(opt.id!));
    }, [selectedTrailer, selectedModel, allFactoryOptions]);

    const hullFactoryCategories = useMemo(() => {
        const categoryIds = new Set(hullFactoryOptions.map(o => o.categoryId));
        return allFactoryCategories.filter(cat => categoryIds.has(cat.id!));
    }, [hullFactoryOptions, allFactoryCategories]);

    const motorFactoryCategories = useMemo(() => {
        const categoryIds = new Set(motorFactoryOptions.map(o => o.categoryId));
        return allFactoryCategories.filter(cat => categoryIds.has(cat.id!));
    }, [motorFactoryOptions, allFactoryCategories]);

    const trailerCategories = useMemo(() => {
        const categoryIds = new Set(trailerFactoryOptions.map(o => o.categoryId));
        return allFactoryCategories.filter(cat => categoryIds.has(cat.id!));
    }, [trailerFactoryOptions, allFactoryCategories]);


    // Effect for handling redirection on the summary step.
    useEffect(() => {
        if (step === 'summary') {
            if (quoteId && selectedModelId) {
                router.push(`/highfield-cpq/summary/${quoteId}`);
            }
        }
    }, [step, quoteId, selectedModelId, router]);


    const renderStepContent = () => {
        switch(step) {
            case 'base-package':
                return <BasePackageSelector 
                    models={models} ranges={ranges} allMotors={allMotors}
                    allTrailers={allTrailers}
                    selectedRangeId={selectedRangeId} handleRangeSelection={handleRangeSelection}
                    selectedModelId={selectedModelId} handleModelSelection={handleModelSelection}
                    selectedMaterial={selectedMaterial} handleMaterialChange={handleMaterialChange}
                    selectedColor={selectedColor} handleColorChange={handleColorChange}
                    selectedModel={selectedModel}
                    selectedConsole={selectedConsole} handleConsoleSelection={handleConsoleSelection}
                    selectedMotor={selectedMotor} handleMotorSelection={handleMotorSelection}
                    selectedPropeller={selectedPropeller} handlePropellerSelection={handlePropellerSelection}
                    selectedRiggingKit={selectedRiggingKit} handleRiggingKitSelection={handleRiggingKitSelection}
                    selectedTrailer={selectedTrailer} handleTrailerSelection={handleTrailerSelection}
                    allRiggingKits={allRiggingKits}
                    hullIncludesPreDelivery={hullIncludesPreDelivery} setHullIncludesPreDelivery={setHullIncludesPreDelivery}
                    hullIncludesRegistration={hullIncludesRegistration} setHullIncludesRegistration={setHullIncludesRegistration}
                    motorIncludesPreDelivery={motorIncludesPreDelivery} setMotorIncludesPreDelivery={setMotorIncludesPreDelivery}
                    riggingIncludesInstallation={riggingIncludesInstallation} setRiggingIncludesInstallation={setRiggingIncludesInstallation}
                    trailerIncludesPreDelivery={trailerIncludesPreDelivery} setTrailerIncludesPreDelivery={setTrailerIncludesPreDelivery}
                    trailerIncludesRegistration={trailerIncludesRegistration} setTrailerIncludesRegistration={setTrailerIncludesRegistration}
                />;
            case 'factory-fit':
                 return <FactoryFitOptions 
                    hullOptions={hullFactoryOptions}
                    hullCategories={hullFactoryCategories}
                    motorOptions={motorFactoryOptions}
                    motorCategories={motorFactoryCategories}
                    trailerOptions={trailerFactoryOptions}
                    trailerCategories={trailerCategories}
                    standardOptionIds={selectedModel?.standardFactoryOptionIds || []}
                    selectedOptionIds={selectedFactoryOptionIds}
                    onOptionToggle={handleFactoryOptionToggle}
                 />;
            case 'dealer-fit':
                 return <DealerFitOptions
                    allBrands={allDealerFitBrands}
                    allCategories={allDealerFitCategories}
                    allParts={allDealerFitParts}
                    predefinedPartIds={selectedModel?.compatibleDealerFitOptionIds || []}
                    selectedPartIds={selectedDealerFitOptionIds}
                    onPartToggle={handleDealerFitOptionToggle}
                 />;
            case 'summary':
                // This step now redirects via a useEffect. You can show a loading indicator.
                return <div>Redirecting to summary...</div>;
            default:
                return <div>Step not found</div>;
        }
    }
    
    // --- Render Logic ---
    if (isLoading || authLoading || !bmtQuote) {
        return (
            <div className="flex flex-col h-screen">
                <Header>
                    <Button asChild variant="outline">
                        <Link href="/highfield-cpq"><ArrowLeft /> Back to CPQ</Link>
                    </Button>
                </Header>
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <Skeleton className="h-12 w-full mb-8" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-48 w-full" />
                        </div>
                        <div className="lg:col-span-2">
                            <Skeleton className="h-96 w-full" />
                        </div>
                    </div>
                </main>
            </div>
        )
    }
    
    if (!brand) {
        return (
            <div className="flex flex-col h-screen">
                <Header><Button asChild variant="outline"><Link href="/highfield-cpq"><ArrowLeft /> Back to CPQ</Link></Button></Header>
                 <main className="flex-1 flex items-center justify-center"><p>Brand not found.</p></main>
            </div>
        )
    }
    
    const STEPS: { id: string, name: string, path: string }[] = [
        { id: 'base-package', name: 'Base Package', path: 'base-package' },
        { id: 'factory-fit', name: 'Factory Fit Options', path: 'factory-fit' },
        { id: 'dealer-fit', name: 'Dealer Fit Options', path: 'dealer-fit' },
        { id: 'summary', name: 'Summary', path: 'summary' },
    ];
    
    const backHref = fromUrl || '/highfield-cpq';
    const backText = fromUrl ? "Back to Summary" : "Back to CPQ";


    return (
        <div className="flex flex-col h-screen">
            <Header>
                 <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                        <Link href={backHref}><ArrowLeft /> {backText}</Link>
                    </Button>
                    {step !== 'base-package' && (
                        <Button variant="outline" onClick={handleBack}><ArrowLeft /> Back</Button>
                    )}
                </div>
                 <Button onClick={handleNext} disabled={!selectedModelId || (step==='base-package' && (!selectedColor || !selectedMaterial))}>Next Step <ArrowRight /></Button>
            </Header>
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-8">
                    <ConfigurationStepper brandId={brandId} modelId={selectedModelId} quoteId={quoteId} currentStep={step} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                     <div className="lg:col-span-3 space-y-8">
                         <Card>
                            <CardContent className="p-4">
                                <Carousel setApi={setCarouselApi} className="w-full relative">
                                    <CarouselContent>
                                        {galleryImages.length > 0 ? (
                                            galleryImages.map((image) => (
                                                <CarouselItem key={image.id}>
                                                    <div className="aspect-video w-full relative bg-muted rounded-lg">
                                                        <Image
                                                            src={image.src}
                                                            alt={image.alt}
                                                            fill
                                                            className="rounded-lg object-contain"
                                                        />
                                                    </div>
                                                </CarouselItem>
                                            ))
                                        ) : (
                                             <CarouselItem>
                                                <div className="aspect-video w-full relative bg-muted rounded-lg flex flex-col items-center justify-center text-center p-4">
                                                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                                    <p className="mt-4 text-muted-foreground">Select a range, model, material, and colour to view image.</p>
                                                </div>
                                            </CarouselItem>
                                        )}
                                    </CarouselContent>
                                     {galleryImages.length > 1 && (
                                        <>
                                            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10" />
                                            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10" />
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex space-x-2">
                                                {galleryImages.map((_, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => onDotButtonClick(index)}
                                                        className={cn(
                                                            'h-2 w-2 rounded-full bg-primary transition-all',
                                                            currentSlide === index ? 'w-4 bg-primary' : 'bg-primary/50'
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </Carousel>
                                <Separator className="my-6" />
                                <div className="grid grid-cols-2 gap-4">
                                    {(selectedModel?.standardFeatures && selectedModel.standardFeatures.length > 0) && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className="w-full justify-center p-4 h-auto">
                                                    <List className="mr-2"/>View Hull Standard Features
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-xl">
                                                <DialogHeader>
                                                    <DialogTitle className="font-headline text-2xl">Standard Features: {selectedModel.name}</DialogTitle>
                                                </DialogHeader>
                                                <div className="max-h-[60vh] overflow-y-auto p-1">
                                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 list-none p-4">
                                                        {selectedModel.standardFeatures.map((feature, index) => (
                                                            <li key={index} className="flex items-start gap-3">
                                                                <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                                                <span>{feature}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                    {(selectedModel?.specifications && selectedModel.specifications.length > 0) && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className="w-full justify-center p-4 h-auto">
                                                    <SheetIcon className="mr-2"/>View Hull Specifications
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-xl">
                                                <DialogHeader>
                                                    <DialogTitle className="font-headline text-2xl">Specifications: {selectedModel.name}</DialogTitle>
                                                </DialogHeader>
                                                <div className="max-h-[60vh] overflow-y-auto p-1">
                                                    <Table className="mt-4">
                                                        <TableBody>
                                                            {selectedModel.specifications.map((spec, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell className="font-medium w-1/2">{spec.name}</TableCell>
                                                                    <TableCell>{spec.value}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                    {(selectedMotor?.specifications && selectedMotor.specifications.length > 0) && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className="w-full justify-center p-4 h-auto">
                                                    <SheetIcon className="mr-2"/>View Motor Specifications
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-xl">
                                                <DialogHeader>
                                                    <DialogTitle className="font-headline text-2xl">Specifications: {selectedMotor.name}</DialogTitle>
                                                </DialogHeader>
                                                <div className="max-h-[60vh] overflow-y-auto p-1">
                                                    <Table className="mt-4">
                                                        <TableBody>
                                                            {selectedMotor.specifications.map((spec, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell className="font-medium w-1/2">{spec.name}</TableCell>
                                                                    <TableCell>{spec.value}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                     {(selectedTrailer?.specifications && selectedTrailer.specifications.length > 0) && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className="w-full justify-center p-4 h-auto">
                                                    <SheetIcon className="mr-2"/>View Trailer Specifications
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-xl">
                                                <DialogHeader>
                                                    <DialogTitle className="font-headline text-2xl">Specifications: {selectedTrailer.name}</DialogTitle>
                                                </DialogHeader>
                                                <div className="max-h-[60vh] overflow-y-auto p-1">
                                                    <Table className="mt-4">
                                                        <TableBody>
                                                            {selectedTrailer.specifications.map((spec, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell className="font-medium w-1/2">{spec.name}</TableCell>
                                                                    <TableCell>{spec.value}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                     <div className="lg:col-span-2 space-y-8">
                        {renderStepContent()}
                         {selectedModel?.keyDocuments && selectedModel.keyDocuments.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Key Documents</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-2">
                                    {selectedModel.keyDocuments.map((doc) => (
                                        <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="block group">
                                            <Card className="hover:border-primary hover:shadow-lg transition-all">
                                                <CardContent className="p-3 flex flex-col items-center justify-center text-center space-y-1">
                                                    <FileText className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                                    <p className="text-xs font-medium leading-tight">{doc.name}</p>
                                                </CardContent>
                                            </Card>
                                        </a>
                                    ))}
                                </CardContent>
                            </Card>
                         )}
                    </div>
                </div>
            </main>
        </div>
    );
}


export default function ConfigureBoatPage() {
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
                    <Header>
                        <Button asChild variant="outline">
                            <Link href="/highfield-cpq"><ArrowLeft /> Back to CPQ</Link>
                        </Button>
                    </Header>
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        <Skeleton className="h-12 w-full mb-8" />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 space-y-6">
                                <Skeleton className="h-32 w-full" />
                                <Skeleton className="h-48 w-full" />
                            </div>
                            <div className="lg:col-span-2">
                                <Skeleton className="h-96 w-full" />
                            </div>
                        </div>
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
            <ConfigureBoatPageContent />
        </SidebarProvider>
    );
}

