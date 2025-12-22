
"use client";

import React, { useState, useEffect } from 'react';
import { useQuoteForm } from './QuoteCreationForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Edit, Save, User, Ship, Wrench, FileText, NotepadText } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SummaryItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-sm text-muted-foreground">{label}</p>
    <div className="font-medium whitespace-pre-wrap">{value || '-'}</div>
  </div>
);

const Section = ({ title, step, children }: { title: string; step: number; children: React.ReactNode }) => {
  const { setCurrentStep } = useQuoteForm();
  return (
    <Card className="bg-background/50">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="font-headline text-xl">{title}</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setCurrentStep(step)}>
          <Edit className="mr-2 h-4 w-4" /> Edit
        </Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default function StepQuoteSummary() {
  const { quoteData, handleBack, setCurrentStep, handleSave, isSaving, isEditMode } = useQuoteForm();
  
  const subTotal = (quoteData.operations || []).reduce((acc, op) => {
    const laborCost = (op.laborRate || 0) * (op.laborHours || 0);
    const partsCost = (op.parts || []).reduce((pAcc, part) => pAcc + (part.cost || 0) * (part.quantity || 1), 0);
    return acc + laborCost + partsCost;
  }, 0);

  const gstAmount = subTotal * 0.10;
  const totalCost = subTotal + gstAmount;

  const getFullAddress = () => {
    if (!quoteData.customer?.address) return '';
    const { street, suburb, state, postcode } = quoteData.customer.address;
    return [street, suburb, state, postcode].filter(Boolean).join(', ');
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-headline text-3xl font-bold">Quote Summary</h2>
        <p className="text-muted-foreground">Review all the details below before proceeding. The quote is being auto-saved in the background.</p>
      </div>
      
      <div className="space-y-6">
        <Section title="User Details" step={1}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryItem label="Name" value={quoteData.user?.name} />
            <SummaryItem label="Role" value={quoteData.user?.role} />
            <SummaryItem label="Phone" value={quoteData.user?.phone} />
            <SummaryItem label="Email" value={quoteData.user?.email} />
          </div>
        </Section>
        
        <Section title="Customer & Asset" step={2}>
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-semibold"><FileText className="w-4 h-4 text-primary"/>References</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pl-6">
                 <SummaryItem label="Job Card #" value={quoteData.user?.ref} />
                 <SummaryItem label="Insurance Reference" value={quoteData.boat?.insuranceRef} />
              </div>
          </div>
          <Separator className="my-4"/>
          <div className="space-y-4">
              <div className="flex items-center gap-2 font-semibold"><User className="w-4 h-4 text-primary"/>Customer</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pl-6">
                 <SummaryItem label="Name" value={quoteData.customer?.name} />
                 <SummaryItem label="Phone" value={quoteData.customer?.phone} />
                 <SummaryItem label="Email" value={quoteData.customer?.email} />
                 <div className="md:col-span-2">
                    <SummaryItem label="Address" value={getFullAddress()} />
                 </div>
              </div>
          </div>
          <Separator className="my-4"/>
          <div className="space-y-4">
              <div className="flex items-center gap-2 font-semibold"><Ship className="w-4 h-4 text-primary"/>Assets</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pl-6">
                 <SummaryItem label="Boat Make" value={quoteData.boat?.make} />
                 <SummaryItem label="Boat Model" value={quoteData.boat?.model} />
                 <SummaryItem label="Boat Registration" value={quoteData.boat?.registration} />
                 <SummaryItem label="Trailer Make" value={quoteData.trailer?.make} />
                 <SummaryItem label="Trailer Model" value={quoteData.trailer?.model} />
                 <SummaryItem label="Trailer Registration" value={quoteData.trailer?.registration} />
              </div>
                {quoteData.motors?.map((motor, index) => (
                    <div key={motor.id} className="mt-2 pl-6">
                        <p className="font-medium text-sm">Engine #{index + 1}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <SummaryItem label="Motor Make" value={motor.make} />
                            <SummaryItem label="Motor Model" value={motor.model} />
                            <SummaryItem label="Motor Serial" value={motor.serial} />
                        </div>
                    </div>
                ))}
          </div>
        </Section>
        
        <Section title="Operations" step={3}>
            {(quoteData.operations || []).map((op, index) => (
                <div key={op.id}>
                    <div className="flex items-center gap-2 font-semibold mb-2"><Wrench className="w-4 h-4 text-primary"/>Operation #{index+1}: {op.heading}</div>
                    <div className="pl-6 space-y-2">
                        {op.customerNotes && (
                          <div className="flex items-center gap-2">
                            <NotepadText className="w-4 h-4 text-blue-500" />
                            <SummaryItem label="Customer Notes (Internal)" value={op.customerNotes} />
                          </div>
                        )}
                        <SummaryItem label="Description" value={op.description || '-'} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <SummaryItem label="Labor" value={`${op.laborHours} hrs @ $${op.laborRate}/hr = $${((op.laborHours || 0) * (op.laborRate || 0)).toFixed(2)}`} />
                        </div>
                        {op.parts && op.parts.length > 0 && (
                            <div className="text-sm">
                                <p className="text-muted-foreground">Parts:</p>
                                <ul className="list-disc pl-5">
                                    {op.parts.map(p => <li key={p.id}>{p.quantity} x {p.name}: ${((p.cost || 0) * (p.quantity || 1)).toFixed(2)}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                   {index < (quoteData.operations || []).length - 1 && <Separator className="my-4"/>}
                </div>
            ))}
        </Section>
      </div>
      
      <Card className="mt-8">
        <CardContent className="p-6">
            <div className="flex justify-end">
                    <div className="w-full max-w-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium">${subTotal.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">GST (10%)</span>
                            <span className="font-medium">${gstAmount.toFixed(2)}</span>
                        </div>
                        <Separator/>
                        <div className="flex justify-between items-baseline">
                            <span className="text-lg font-bold font-headline">Total</span>
                            <span className="text-2xl font-bold font-headline text-primary">${totalCost.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between mt-8">
                    <Button type="button" variant="outline" onClick={handleBack} className="w-full sm:w-auto">Back</Button>
                    <Button type="button" onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving ? 'Saving...' : (isEditMode ? 'Update & Finalize' : 'Save & View Printable Quote')}
                    </Button>
                </div>
        </CardContent>
      </Card>
    </div>
  );
}
