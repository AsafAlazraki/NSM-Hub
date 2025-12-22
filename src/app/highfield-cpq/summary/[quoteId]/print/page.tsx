
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { BMTQuote, BoatModel, CatalogueMotor, RiggingKit, CatalogueTrailer, FactoryOption, DealerFitPart, Customer, UserDetails, ColorOption, Propeller } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { getBmtQuoteById, getBoatModelById, getCatalogueMotors, getRiggingKits, getCatalogueTrailers, getCatalogueFactoryOptions, getDealerFitParts, getStaticLogo } from '@/lib/storage';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Printer, ArrowLeft, X } from 'lucide-react';
import { Logo, logoSvg } from '@/components/Logo';
import { Separator } from '@/components/ui/separator';
import { useParams } from 'next/navigation';

const formatCurrency = (value: number) => {
  if (isNaN(value)) return '$0.00';
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
};

const SummaryItem = ({ label, value, price, imageUrl, isSubItem = false }: { label: string; value?: React.ReactNode, price?: number, imageUrl?: string | null, isSubItem?: boolean }) => {
    const displayPrice = price !== undefined && price > 0 ? formatCurrency(price) : null;
    
    return (
        <div className={`flex justify-between items-start gap-4 py-1.5 ${isSubItem ? 'pl-4' : ''}`}>
            <div className="flex gap-3">
                 {imageUrl && (
                    <img src={imageUrl} alt={label} className="h-10 w-10 object-contain rounded-md border" />
                 )}
                <div>
                    <p className="font-medium text-sm">{label}</p>
                    {value && <p className="text-muted-foreground text-xs">{value}</p>}
                </div>
            </div>
            {displayPrice && (
                 <div className="text-right">
                    <p className="font-semibold text-sm">{displayPrice}</p>
                 </div>
            )}
        </div>
    );
};


export default function PrintBmtQuotePage() {
  const params = useParams();
  const quoteId = params.quoteId as string;
  const [quote, setQuote] = useState<BMTQuote | null>(null);
   const [catalogueData, setCatalogueData] = useState<{
        model: BoatModel | null;
        motors: CatalogueMotor[];
        riggingKits: RiggingKit[];
        trailers: CatalogueTrailer[];
        factoryOptions: FactoryOption[];
        dealerFitParts: DealerFitPart[];
    }>({ model: null, motors: [], riggingKits: [], trailers: [], factoryOptions: [], dealerFitParts: [] });

  const [logo, setLogo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (quoteId) {
        setIsLoading(true);
        try {
            const quoteData = await getBmtQuoteById(quoteId);
            if (!quoteData) {
                setQuote(null);
                setIsLoading(false);
                return;
            }
            setQuote(quoteData);

            const [
                model,
                motors,
                riggingKits,
                trailers,
                factoryOptions,
                dealerFitParts,
                logoData
            ] = await Promise.all([
                quoteData.selectedModelId ? getBoatModelById(quoteData.selectedModelId) : Promise.resolve(null),
                getCatalogueMotors(),
                getRiggingKits(),
                getCatalogueTrailers(),
                getCatalogueFactoryOptions(),
                getDealerFitParts(),
                getStaticLogo()
            ]);
            setCatalogueData({ model, motors, riggingKits, trailers, factoryOptions, dealerFitParts });
            setLogo(logoData);

        } catch (e) {
            console.error("Failed to load summary data", e);
        } finally {
            setIsLoading(false);
        }
      }
    };
    fetchData();
  }, [quoteId]);
  
    const {
        selectedHull,
        selectedConsole,
        selectedMotor,
        propeller,
        selectedRiggingKit,
        selectedTrailer,
        hullFactoryOptions,
        motorFactoryOptions,
        trailerFactoryOptions,
        selectedDealerFitOptions,
        totalPrice,
        subtotal,
        gst,
        selectedColor
    } = useMemo(() => {
        if (!quote || !catalogueData.model) return { totalPrice: 0, subtotal: 0, gst: 0, selectedHull: null, selectedConsole: null, selectedMotor: null, propeller: null, selectedRiggingKit: null, selectedTrailer: null, hullFactoryOptions: [], motorFactoryOptions: [], trailerFactoryOptions: [], selectedDealerFitOptions: [], selectedColor: null };
        
        const { model, motors, riggingKits, trailers, factoryOptions, dealerFitParts } = catalogueData;

        const selectedColor = model.colors?.find(c => c.name === quote.selectedColorName);
        const hullPricing = model.pricing?.find(p => p.material === quote.selectedMaterial && p.color === quote.selectedColorName);
        const hullPrice = hullPricing?.price || 0;
        const selectedHull = { name: `${quote.selectedMaterial} ${model.name}`, price: hullPrice, includesGst: hullPricing?.includesGst || false, imageUrl: selectedColor?.images?.[0]?.url };
        
        const selectedConsole = model.consoleOptions?.find(opt => opt.name === quote.selectedConsoleName);
        const selectedMotor = motors.find(m => m.id === quote.selectedMotorId);
        
        let propeller: Propeller | { name: 'N/A' } | null = null;
        if (quote.selectedPropellerId === 'N/A') {
            propeller = { name: 'N/A' };
        } else if (selectedMotor?.propellers) {
            propeller = selectedMotor.propellers.find(p => p.id === quote.selectedPropellerId) || null;
        }

        const selectedRiggingKit = riggingKits.find(kit => kit.id === quote.selectedRiggingKitId);
        const selectedTrailer = trailers.find(t => t.id === quote.selectedTrailerId);
        const allSelectedFactoryOptions = factoryOptions.filter(opt => quote.selectedFactoryOptionIds?.includes(opt.id!));
        
        const hullFactoryOptions = allSelectedFactoryOptions.filter(opt => opt.tag === 'Boat');
        const motorFactoryOptions = allSelectedFactoryOptions.filter(opt => opt.tag === 'Motor');
        const trailerFactoryOptions = allSelectedFactoryOptions.filter(opt => opt.tag === 'Trailer');
        
        const selectedDealerFitOptions = dealerFitParts.filter(part => quote.selectedDealerFitOptionIds?.includes(part.id!));
        
        let subtotal = 0;
        const addToSubtotal = (price: number = 0, includesGst: boolean = false) => {
            subtotal += includesGst ? (price / 1.1) : price;
        };
        
        const consolePrice = quote.pricing?.consolePrice || 0;
        addToSubtotal(consolePrice, true);

        if (selectedHull) addToSubtotal(selectedHull?.price, selectedHull?.includesGst);
        if (selectedMotor) addToSubtotal(selectedMotor.sellPrice, true);
        
        if (propeller && typeof propeller === 'object' && 'sellPrice' in propeller) {
            addToSubtotal((propeller as Propeller)?.sellPrice, true);
        }

        if(selectedRiggingKit) addToSubtotal(selectedRiggingKit.sellPrice, true);
        if(selectedTrailer) addToSubtotal(selectedTrailer.price, true);
        allSelectedFactoryOptions.forEach(opt => addToSubtotal(opt.sellPrice, true));
        selectedDealerFitOptions.forEach(part => addToSubtotal(part.sellPrice, true));

        if (quote.hullIncludesRegistration) subtotal += (200 / 1.1);

        const gst = subtotal * 0.1;
        const totalPrice = subtotal + gst;

        return {
            selectedHull,
            selectedConsole,
            selectedMotor,
            propeller,
            selectedRiggingKit,
            selectedTrailer,
            hullFactoryOptions,
            motorFactoryOptions,
            trailerFactoryOptions,
            selectedDealerFitOptions,
            totalPrice,
            subtotal,
            gst,
            selectedColor,
        };
    }, [quote, catalogueData]);
  
  const getFullAddress = (customer: Customer | undefined) => {
    if (!customer?.address) return null;
    const { street, suburb, state, postcode } = customer.address;
    if (!street && !suburb && !state && !postcode) return null;
    return (
      <>
        {street && <span>{street}<br/></span>}
        {[suburb, state, postcode].filter(Boolean).join(' ')}
      </>
    );
  };

  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-screen w-full" /></div>;
  }

  if (!quote) {
    return <div className="p-8 text-center">Quote not found.</div>;
  }


  return (
    <>
      <div className="no-print fixed top-4 left-1/2 -translate-x-1/2 flex justify-center gap-4 mb-8 z-50">
        <Button variant="outline" asChild>
          <Link href={`/highfield-cpq/summary/${quoteId}`}>
            <ArrowLeft /> Back to Summary
          </Link>
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2" /> Print or Save as PDF
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/"><X /> Close</Link>
        </Button>
      </div>
      <div className="max-w-4xl mx-auto bg-white p-8 font-body" id="printable-quote">
        <header className="flex justify-between items-start pb-4 border-b-4 border-primary">
          <div className="w-48">
            <Logo logo={logo} />
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold font-headline text-primary">{quote.brandName}</h1>
            <p className="font-semibold">BMT Package Quotation</p>
            <p className="text-sm text-muted-foreground">Date: {new Date(quote.createdAt).toLocaleDateString()}</p>
            <p className="text-sm text-muted-foreground">Quote ID: {quote.id.split('-')[0]}</p>
          </div>
        </header>

        <main className="mt-8">
            <section className="grid grid-cols-2 gap-8 mb-8">
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <h3 className="font-headline font-semibold text-primary border-b border-gray-200 pb-1 mb-2">Customer Details</h3>
                    <p><strong>Name:</strong> {quote.customer?.name || 'N/A'}</p>
                    {getFullAddress(quote.customer) && <p className="mt-1">{getFullAddress(quote.customer)}</p>}
                    <p><strong>Phone:</strong> {quote.customer?.phone || 'N/A'}</p>
                    <p><strong>Email:</strong> {quote.customer?.email || 'N/A'}</p>
                </div>
                 <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <h3 className="font-headline font-semibold text-primary border-b border-gray-200 pb-1 mb-2">Prepared By</h3>
                    <p><strong>{quote.user.name}</strong></p>
                    <p>{quote.user.role || 'Sales'}</p>
                    <p>{quote.user.phone}</p>
                    <p>{quote.user.email}</p>
                </div>
            </section>

             <section>
                <h2 className="text-xl font-headline font-semibold border-b-2 border-muted pb-2 mb-4">Package Configuration</h2>
                <div className="space-y-1 text-sm">
                    {selectedHull && <SummaryItem label="Hull" value={`${selectedHull.name} (${quote.selectedColorName})`} price={selectedHull.price} imageUrl={selectedHull?.imageUrl} />}
                    {quote.hullIncludesPreDelivery && <SummaryItem label="Hull Pre-Delivery" value="Included" isSubItem />}
                    {quote.hullIncludesRegistration && <SummaryItem label="Hull Registration" value="12 Months" price={200} isSubItem={true} />}
                    {selectedConsole && <SummaryItem label="Console" value={selectedConsole.name} price={selectedConsole.price} isSubItem={true}/>}
                    
                    {selectedMotor && <SummaryItem label="Motor" value={selectedMotor.name} price={selectedMotor.sellPrice} imageUrl={selectedMotor.imageUrl} />}
                    {quote.motorIncludesPreDelivery && <SummaryItem label="Motor Pre-Delivery & Install" value="Included" isSubItem={true} />}
                    {propeller && propeller.name !== 'N/A' && <SummaryItem label="Propeller" value={(propeller as Propeller)?.name} price={(propeller as Propeller)?.sellPrice} isSubItem={true} imageUrl={(propeller as Propeller)?.imageUrl}/>}
                    
                    {selectedRiggingKit && <SummaryItem label="Rigging Kit" value={selectedRiggingKit.name} price={selectedRiggingKit.sellPrice} imageUrl={selectedRiggingKit.imageUrl} />}
                    {quote.riggingIncludesInstallation && <SummaryItem label="Rigging Installation" value="Included" isSubItem={true} />}

                    {selectedTrailer && <SummaryItem label="Trailer" value={selectedTrailer.name} price={selectedTrailer.price} imageUrl={selectedTrailer.imageUrl} />}
                    {quote.trailerIncludesPreDelivery && <SummaryItem label="Trailer Pre-Delivery" value="Included" isSubItem={true} />}
                    {quote.trailerIncludesRegistration && <SummaryItem label="Trailer Registration" value="Included" isSubItem={true} />}
                    
                    {hullFactoryOptions.length > 0 && <h4 className="font-semibold pt-2">Hull Options:</h4>}
                    {hullFactoryOptions.map(opt => <SummaryItem key={opt.id} label={opt.name} price={opt.sellPrice} imageUrl={opt.imageUrl} isSubItem={true} />)}
                    
                    {motorFactoryOptions.length > 0 && <h4 className="font-semibold pt-2">Motor Options:</h4>}
                    {motorFactoryOptions.map(opt => <SummaryItem key={opt.id} label={opt.name} price={opt.sellPrice} imageUrl={opt.imageUrl} isSubItem={true} />)}

                    {trailerFactoryOptions.length > 0 && <h4 className="font-semibold pt-2">Trailer Options:</h4>}
                    {trailerFactoryOptions.map(opt => <SummaryItem key={opt.id} label={opt.name} price={opt.sellPrice} imageUrl={opt.imageUrl} isSubItem={true} />)}
                    

                    {selectedDealerFitOptions.length > 0 && <h4 className="font-semibold pt-2">Dealer Fit Options:</h4>}
                    {selectedDealerFitOptions.map(opt => <SummaryItem key={opt.id} label={opt.name} price={opt.sellPrice} imageUrl={opt.imageUrl} isSubItem={true} />)}
                </div>
            </section>

             <section className="mt-8">
                <div className="flex justify-end">
                    <div className="w-full max-w-sm space-y-2 text-sm">
                        <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                        <div className="flex justify-between"><span>GST (10%):</span><span>{formatCurrency(gst)}</span></div>
                        <Separator className="my-2 bg-foreground" />
                        <div className="flex justify-between font-bold text-lg text-primary"><span>Total Drive Away:</span><span>{formatCurrency(totalPrice)}</span></div>
                    </div>
                </div>
            </section>
        </main>
        
        <footer className="mt-12 pt-4 border-t text-center text-xs text-muted-foreground">
            <p>Thank you for your business! This quote is valid for 30 days.</p>
            <p>Northside Marine - {new Date().getFullYear()}</p>
        </footer>
      </div>
    </>
  );
}

    