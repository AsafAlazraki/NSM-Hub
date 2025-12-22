

"use client";

import type { Kit, KitStatus } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { KitCard } from './KitCard';
import { Droppable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';

type KanbanColumn = 'Sales' | 'P&A' | 'Service' | 'Completed' | 'Archived';

interface KitKanbanColumnProps {
    columnName: KanbanColumn;
    kits: Kit[];
    onArchiveKit: (kit: Kit) => void;
    onRestoreKit: (kit: Kit) => void;
    isArchiveView: boolean;
}

const columnStyles: Record<KanbanColumn, { bg: string, text: string, border: string }> = {
    'Sales': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-t-blue-500' },
    'P&A': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-t-yellow-500' },
    'Service': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-t-orange-500' },
    'Completed': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-t-green-500' },
    'Archived': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-t-gray-500' },
};


export const KitKanbanColumn = ({ columnName, kits, onArchiveKit, onRestoreKit, isArchiveView }: KitKanbanColumnProps) => {
    const style = columnStyles[columnName];

    return (
        <Droppable droppableId={columnName} isDropDisabled={isArchiveView}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(isArchiveView && "col-span-full")}
                >
                    <Card className={cn(
                        "border-t-4 transition-colors", 
                        style.border,
                        snapshot.isDraggingOver ? 'bg-primary/10' : style.bg
                        )}>
                        <CardHeader>
                            <CardTitle className={`text-lg font-semibold ${style.text}`}>{columnName} ({kits.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 min-h-[200px] p-2">
                            {kits.length > 0 ? (
                                kits.map((kit, index) => (
                                    <KitCard 
                                        key={kit.id} 
                                        kit={kit} 
                                        index={index}
                                        onArchiveKit={onArchiveKit}
                                        onRestoreKit={onRestoreKit}
                                        isArchiveView={isArchiveView}
                                    />
                                ))
                            ) : (
                                <div className="flex items-center justify-center h-full p-4">
                                    <p className="text-sm text-muted-foreground">Drop kits here</p>
                                </div>
                            )}
                            {provided.placeholder}
                        </CardContent>
                    </Card>
                </div>
            )}
        </Droppable>
    );
}
