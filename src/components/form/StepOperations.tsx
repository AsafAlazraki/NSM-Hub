
"use client";

import { useQuoteForm } from './QuoteCreationForm';
import { Button } from '@/components/ui/button';
import { CardTitle, CardDescription, CardHeader } from '@/components/ui/card';
import type { Operation, CatalogueOperation } from '@/lib/types';
import { PlusCircle, ArrowRight, ArrowLeft, BookMarked } from 'lucide-react';
import { OperationForm } from './OperationForm';
import { CatalogueDialog } from './CatalogueDialog';
import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { MoreVertical, Trash2, Edit } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '../ui/alert-dialog';


export default function StepOperations() {
  const { quoteData, setQuoteData, handleNext, handleBack } = useQuoteForm();
  const operations = quoteData.operations || [];
  const [isCatalogueDialogOpen, setIsCatalogueDialogOpen] = useState(false);
  
  const [editingOperationId, setEditingOperationId] = useState<string | null>(null);
  const [newOperations, setNewOperations] = useState<Partial<Operation>[]>([]);


  const handleAddNewOperation = () => {
    const newOpTemplate: Partial<Operation> = {
      id: `new-op-${Date.now()}-${Math.random()}`,
      heading: '',
      customerNotes: '',
      description: '',
      laborRate: 144.54,
      laborHours: 0,
      parts: [],
    };
    setNewOperations(prev => [...prev, newOpTemplate]);
  };

  const handleSaveNewOperation = (operationData: Operation) => {
    setQuoteData(prev => ({
        ...prev,
        operations: [...(prev.operations || []), operationData]
    }));
    // Remove the form for the saved operation from the newOperations array
    setNewOperations(prev => prev.filter(op => op.id !== operationData.id));
  };
  
  const handleCancelNewOperation = (opId: string) => {
    setNewOperations(prev => prev.filter(op => op.id !== opId));
  }

  const handleUpdateOperation = (operationData: Operation) => {
    setQuoteData(prev => ({
        ...prev,
        operations: (prev.operations || []).map(op => op.id === operationData.id ? operationData : op)
    }));
    setEditingOperationId(null); // Hide form after update
  };
  
  const handleAddFromCatalogue = (catalogueOps: CatalogueOperation[]) => {
    const newOpsFromCatalogue: Operation[] = catalogueOps.map(catOp => ({
      id: `op-${Date.now()}-${Math.random()}`,
      heading: catOp.heading,
      description: catOp.description,
      customerNotes: '', // Add empty customer notes
      laborRate: catOp.laborRate,
      laborHours: catOp.laborHours,
      parts: (catOp.parts || []).map(p => ({...p, id: `part-${Date.now()}-${Math.random()}`}))
    }));
    setQuoteData(prev => ({...prev, operations: [...(prev.operations || []), ...newOpsFromCatalogue]}));
  };

  const removeOperation = (opId: string) => {
    setQuoteData(prev => ({
      ...prev,
      operations: (prev.operations || []).filter(op => op.id !== opId),
    }));
  };
  
  const getOperationSubtotal = (op: Operation) => {
    const laborCost = (op.laborHours || 0) * (op.laborRate || 0);
    const partsCost = (op.parts || []).reduce((sum, part) => sum + ((part.cost || 0) * (part.quantity || 1)), 0);
    return laborCost + partsCost;
  }

  const isAnyFormOpen = newOperations.length > 0 || editingOperationId !== null;

  return (
    <>
       <CatalogueDialog
        isOpen={isCatalogueDialogOpen}
        setIsOpen={setIsCatalogueDialogOpen}
        onAdd={handleAddFromCatalogue}
      />
      <CardHeader className="p-0 mb-6">
        <CardTitle className="font-headline text-2xl">Service Operations</CardTitle>
        <CardDescription>
          Add labor and parts for each service operation. You can create a new one or add from your catalogue.
        </CardDescription>
      </CardHeader>
      
       <div className="flex gap-4 mb-6">
          <Button variant="outline" onClick={handleAddNewOperation}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Operation
          </Button>
          <Button variant="secondary" onClick={() => setIsCatalogueDialogOpen(true)}>
            <BookMarked className="mr-2 h-4 w-4" />
            Add from Catalogue
          </Button>
      </div>

      <div className="space-y-4">
        {operations.map((op, index) => (
            editingOperationId === op.id ? (
                <OperationForm
                    key={op.id}
                    initialData={op}
                    onSave={handleUpdateOperation}
                    onCancel={() => setEditingOperationId(null)}
                />
            ) : (
                <Card key={op.id} className="bg-background/50">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold">{index + 1}. {op.heading}</p>
                                {op.customerNotes && <p className="text-sm text-blue-600 mt-1 italic">Note: {op.customerNotes}</p>}
                                <p className="text-sm text-muted-foreground mt-2">
                                    <strong>Labor:</strong> {op.laborHours || 0} hrs @ ${op.laborRate || 0}/hr
                                </p>
                            </div>
                            <div className="flex items-center">
                                <p className="font-semibold mr-2">${getOperationSubtotal(op).toFixed(2)}</p>
                                <AlertDialog>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" disabled={isAnyFormOpen}>
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setEditingOperationId(op.id)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the operation "{op.heading}".
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => removeOperation(op.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )
        ))}
        {operations.length === 0 && newOperations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
                <p>No operations added yet.</p>
            </div>
        )}

        {/* Render forms for new operations */}
        {newOperations.map((op) => (
             <OperationForm 
                key={op.id}
                initialData={op}
                onSave={handleSaveNewOperation}
                onCancel={() => handleCancelNewOperation(op.id!)}
              />
        ))}
      </div>
      
      <div className="flex justify-between mt-8">
        <Button type="button" variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button type="button" onClick={handleNext} disabled={isAnyFormOpen}>
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </>
  );
}
