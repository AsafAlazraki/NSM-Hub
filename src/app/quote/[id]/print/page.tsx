"use client";

import React, { useState, useEffect } from 'react';
import type { Quote, Operation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Ship, Wrench, Calendar, FileText, Printer, ArrowLeft, X } from 'lucide-react';
import { format } from 'date-fns';
import { logoSvg } from '@/components/Logo';
import { getQuoteById, getStaticLogo } from '@/lib/storage';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const formatQuoteId = (id: string) => {
  if (!id) return "QT ####";
  if (id.startsWith('QT')) {
    const numberPart = id.substring(2);
    return `QT ${numberPart}`;
  }
   if (id.startsWith('QUOTE-')) {
    return "Service Estimate";
  }
  return id;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
}

const calculateOperationSubtotal = (op: Operation) => {
    const laborCost = (op.laborHours || 0) * (op.laborRate || 0);
    const partsCost = (op.parts || []).reduce((sum, part) => sum + (part.cost || 0) * (part.quantity || 1), 0);
    return laborCost + partsCost;
};


export default function PrintQuotePage() {
  const params = useParams();
  const id = params.id as string;
  const [quote, setQuote] = useState<Quote | null | undefined>(undefined);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [logoForPdf, setLogoForPdf] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchQuoteAndLogo = async () => {
        if (user && id) {
            const [foundQuote, staticLogo] = await Promise.all([
                getQuoteById(id),
                getStaticLogo()
            ]);
            setQuote(foundQuote);
            setLogoForPdf(staticLogo);
        }
    }
    fetchQuoteAndLogo();
  }, [id, user]);

  if (quote === undefined || authLoading || !user) {
    return (
      <div className="bg-gray-100 min-h-screen p-4 sm:p-8">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          <Skeleton className="h-12 w-1/4 mb-4" />
          <Skeleton className="h-8 w-full mb-8" />
          <div className="grid grid-cols-2 gap-8 mb-8">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-8">
        <h1 className="text-2xl font-bold">Estimate not found</h1>
        <p className="text-muted-foreground">The estimate you are looking for does not exist or you do not have permission to view it.</p>
        <Button asChild className="mt-4">
          <Link href="/">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const subTotal = (quote.operations || []).reduce((acc, op) => {
    const laborCost = (op.laborRate || 0) * (op.laborHours || 0);
    const partsCost = (op.parts || []).reduce((pAcc, part) => pAcc + (part.cost || 0) * (part.quantity || 1), 0);
    return acc + laborCost + partsCost;
  }, 0);

  const gstAmount = subTotal * 0.10;
  const totalCost = subTotal + gstAmount;
  
  const getFullAddress = () => {
    if (!quote.customer?.address) return null;
    const { street, suburb, state, postcode } = quote.customer.address;
    if (!street && !suburb && !state && !postcode) return null;
    return (
      <>
        {street && <span>{street}<br/></span>}
        {[suburb, state, postcode].filter(Boolean).join(' ')}
      </>
    );
  };

  const isCustomerSectionVisible = 
    quote.customer?.name || 
    quote.customer?.phone || 
    quote.customer?.email ||
    (quote.customer?.address && (quote.customer.address.street || quote.customer.address.suburb || quote.customer.address.state || quote.customer.address.postcode));

  const isBoatSectionVisible = quote.boat?.make || quote.boat?.model || quote.boat?.registration;
  const isMotorSectionVisible = quote.motors?.length > 0;
  const isTrailerSectionVisible = quote.trailer?.make || quote.trailer?.model || quote.trailer?.registration;

  const isAssetDetailsVisible = isBoatSectionVisible || isMotorSectionVisible || isTrailerSectionVisible;
  
  const displayId = formatQuoteId(quote.id);
  const headingText = "Service Estimate";


  return (
    <>
      {/* No-print buttons */}
      <div className="no-print fixed top-4 left-1/2 -translate-x-1/2 flex justify-center gap-4 mb-8 z-50">
            <Button variant="outline" asChild>
              <Link href={`/quote/${quote.id}`}><ArrowLeft/> Back to Estimate View</Link>
          </Button>
          <Button onClick={() => window.print()}>
              <Printer className="mr-2"/> Print or Save as PDF
          </Button>
          <Button variant="secondary" asChild>
              <Link href="/"><X/> Close</Link>
          </Button>
      </div>
      <div className="max-w-4xl mx-auto bg-white p-8" id="printable-quote">
            {/* Header */}
            <div className="flex justify-between items-start pb-1 border-b-2 border-primary">
              <div>
                  <div className="max-w-[150px] max-h-[75px]">
                    {logoForPdf && !logoForPdf.startsWith('<svg') ? (
                        <img src={logoForPdf} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                        <div dangerouslySetInnerHTML={{ __html: logoForPdf || logoSvg }} />
                    )}
                  </div>
                  <div className="text-[9px] text-primary mt-1">
                      <p>www.northsidemarine.com.au</p>
                      <p>PH: 07 3265 8000 ABN 29 0098 576 12</p>
                  </div>
              </div>
              <div className="text-right text-sm">
                  <h1 className="font-headline text-2xl font-bold text-primary pb-1">{headingText}</h1>
                  <p><strong>Date:</strong> {quote.createdAt ? format(new Date(quote.createdAt), 'dd/MM/yyyy') : 'N/A'}</p>
                  <p><strong>Estimate #:</strong> {displayId}</p>
                  {quote.user?.ref && <p><strong>Job Card #:</strong> {quote.user.ref}</p>}
                  {quote.boat?.insuranceRef && <p><strong>Insurance Ref:</strong> {quote.boat.insuranceRef}</p>}
              </div>
          </div>

          {/* Customer & Asset Details */}
          {(isCustomerSectionVisible || isAssetDetailsVisible) && (
              <div className={cn("grid gap-4 mt-2", isCustomerSectionVisible && isAssetDetailsVisible ? "grid-cols-2" : "grid-cols-1")}>
                  {isCustomerSectionVisible && (
                      <div className="bg-gray-50 p-3 rounded-lg text-sm">
                          <h3 className="font-headline font-semibold text-primary border-b border-gray-200 pb-1 mb-2">Customer</h3>
                          {quote.customer?.name && <p className="font-semibold">{quote.customer.name}</p>}
                          {getFullAddress() && <p className="mt-1">{getFullAddress()}</p>}
                          {quote.customer?.phone && <p className="mt-1">{quote.customer.phone}</p>}
                          {quote.customer?.email && <p className="mt-1">{quote.customer.email}</p>}
                      </div>
                  )}
                    {isAssetDetailsVisible && (
                      <div className="bg-gray-50 p-3 rounded-lg text-sm">
                          <h3 className="font-headline font-semibold text-primary border-b border-gray-200 pb-1 mb-2">Asset Details</h3>
                          {isBoatSectionVisible && (
                              <div className="mb-2">
                                  <p><strong>Boat:</strong> {[quote.boat?.make, quote.boat?.model].filter(Boolean).join(' ')}</p>
                                  {quote.boat?.registration && <p><strong>Registration:</strong> {quote.boat.registration}</p>}
                              </div>
                          )}
                          {isMotorSectionVisible && (
                              <div className="mb-2">
                                  {(quote.motors || []).map((motor, index) => (
                                    <p key={motor.id}><strong>Motor {quote.motors.length > 1 ? index + 1 : ''}:</strong> {[motor.make, motor.model].filter(Boolean).join(' ')}</p>
                                ))}
                              </div>
                          )}
                          {isTrailerSectionVisible && (
                              <div>
                                  <p><strong>Trailer:</strong> {[quote.trailer?.make, quote.trailer?.model].filter(Boolean).join(' ')}</p>
                                  {quote.trailer?.registration && <p><strong>Trailer Registration:</strong> {quote.trailer.registration}</p>}
                              </div>
                          )}
                      </div>
                  )}
              </div>
          )}
          
          {/* Operations */}
          <div className="mt-2">
              <h3 className="font-headline text-xl font-semibold text-primary border-b border-gray-200 pb-2 mb-4">Service Details</h3>
              <div className="space-y-6">
                {(quote.operations || []).map((op, index) => (
                    <div key={op.id}>
                        <h4 className="font-semibold text-base">{index + 1}. {op.heading}</h4>
                        {op.description && (
                            <p className="text-gray-600 whitespace-pre-wrap pl-4 text-sm mt-1">{op.description}</p>
                        )}
                        <table className="w-full mt-2 text-sm">
                            <tbody>
                                <tr className="text-gray-700">
                                    <td className="py-1 pl-4 font-medium">Labor Cost</td>
                                    <td className="py-1 pr-2 text-right">{formatCurrency((op.laborHours || 0) * (op.laborRate || 0))}</td>
                                </tr>
                                {op.parts && op.parts.length > 0 && (
                                    <tr className="text-gray-700">
                                      <td colSpan={2} className="pt-2 pb-1 pl-4 font-medium">Parts:</td>
                                    </tr>
                                )}
                                {op.parts?.map(p => (
                                    <tr key={p.id} className="text-gray-700">
                                        <td className="py-1 pl-8">{p.quantity || 1} x {p.name || 'N/A'}</td>
                                        <td className="py-1 pr-2 text-right">{formatCurrency((p.cost || 0) * (p.quantity || 1))}</td>
                                    </tr>
                                ))}
                                <tr className="font-semibold text-base">
                                    <td className="pt-2 pb-1 pl-4 text-right">Subtotal:</td>
                                    <td className="pt-2 pb-1 pr-2 text-right border-t-2 border-b-2 border-gray-300 w-[120px]">{formatCurrency(calculateOperationSubtotal(op))}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ))}
              </div>
          </div>

          {/* Totals Section */}
          <div className="flex justify-between items-end mt-8">
              <div className="text-sm">
                  <h4 className="font-headline text-base font-semibold text-primary mb-1">Estimate created by:</h4>
                  <p><strong>{quote.user?.name || '-'}</strong></p>
                  {quote.user?.role && <p>{quote.user.role}</p>}
                  <p>{quote.user?.phone || '-'}</p>
                  <p>{quote.user?.email || '-'}</p>
              </div>
              <div className="w-full max-w-xs space-y-1">
                  <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatCurrency(subTotal)}</span>
                  </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">GST (10%)</span>
                      <span className="font-medium">{formatCurrency(gstAmount)}</span>
                  </div>
                  <div className="border-t-4 border-gray-800 my-2"></div>
                  <div className="flex justify-between items-baseline">
                      <span className="text-xl font-bold font-headline">Total:</span>
                      <span className="text-2xl font-bold font-headline text-primary">{formatCurrency(totalCost)}</span>
                  </div>
              </div>
          </div>
          
            {/* Footer */}
          <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t">
              Thank you for your business!
          </div>
      </div>
    </>
);
}
