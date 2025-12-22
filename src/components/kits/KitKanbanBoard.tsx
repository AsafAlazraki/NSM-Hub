

"use client";

import React, { useState, useEffect } from 'react';
import type { Kit, KitStatus } from '@/lib/types';
import { KitKanbanColumn } from './KitKanbanColumn';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useToast } from '@/hooks/use-toast';

type KanbanColumn = 'Sales' | 'P&A' | 'Service' | 'Completed' | 'Archived';

const columns: KanbanColumn[] = [
    'Sales',
    'P&A',
    'Service',
    'Completed'
];

const archiveColumn: KanbanColumn[] = ['Archived'];

const statusToColumnMap: Record<KitStatus, KanbanColumn> = {
    'Created by Sales': 'Sales',
    'Awaiting checks': 'P&A',
    'Approved by P&A': 'P&A',
    'Awaiting Confirmation': 'Service',
    'Approved by Service': 'Service',
    'Completed': 'Completed',
    'Archived': 'Archived',
};

const columnToStatusMap: Record<KanbanColumn, KitStatus> = {
    'Sales': 'Created by Sales',
    'P&A': 'Awaiting checks',
    'Service': 'Awaiting Confirmation',
    'Completed': 'Completed',
    'Archived': 'Archived'
};

interface KitKanbanBoardProps {
    allKits: Kit[];
    onKitStatusChange: (kit: Kit) => void;
    onArchiveKit: (kit: Kit) => void;
    onRestoreKit: (kit: Kit) => void;
    isArchiveView?: boolean;
}

export const KitKanbanBoard = ({ allKits, onKitStatusChange, onArchiveKit, onRestoreKit, isArchiveView = false }: KitKanbanBoardProps) => {
    const { toast } = useToast();

    const [boardData, setBoardData] = useState<Record<KanbanColumn, Kit[]>>({
        'Sales': [],
        'P&A': [],
        'Service': [],
        'Completed': [],
        'Archived': [],
    });

    useEffect(() => {
        const newBoardData: Record<KanbanColumn, Kit[]> = {
            'Sales': [],
            'P&A': [],
            'Service': [],
            'Completed': [],
            'Archived': [],
        };
        allKits.forEach(kit => {
            const column = statusToColumnMap[kit.status];
            if (column && newBoardData[column]) {
                newBoardData[column].push(kit);
            }
        });
        setBoardData(newBoardData);
    }, [allKits]);

    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;

        const sourceColumnName = source.droppableId as KanbanColumn;
        const destColumnName = destination.droppableId as KanbanColumn;
        
        const movedKit = allKits.find(k => k.id === draggableId);
        if (!movedKit) return;

        // --- Dragging to Service Column Check ---
        if (destColumnName === 'Service' && movedKit.status !== 'Approved by P&A') {
             toast({
                variant: 'destructive',
                title: 'Cannot Move Kit',
                description: 'The kit must be approved by P&A before moving to Service.',
            });
            return; // Abort the drag operation
        }


        // --- Completion Logic Check ---
        if (destColumnName === 'Completed') {
            const requiredPoints = 3; 
            const hasEnoughPoints = (movedKit.statusHistory?.length || 0) >= requiredPoints;

            if (!hasEnoughPoints) {
                toast({
                    variant: 'destructive',
                    title: 'Cannot Complete Kit',
                    description: `The kit needs to be approved by all departments. It currently has ${movedKit.statusHistory?.length || 0} of ${requiredPoints} required approval points.`,
                });
                return; // Abort the drag operation
            }
        }
        
        // Optimistic UI update
        const sourceColumn = [...boardData[sourceColumnName]];
        const destColumn = sourceColumnName === destColumnName ? sourceColumn : [...boardData[destColumnName]];
        
        const [kitToMove] = sourceColumn.splice(source.index, 1);

        if (sourceColumnName === destColumnName) {
            destColumn.splice(destination.index, 0, kitToMove);
            const newBoardData = { ...boardData, [destColumnName]: destColumn };
            setBoardData(newBoardData);
        } else {
            destColumn.splice(destination.index, 0, kitToMove);
             const newBoardData = {
                ...boardData,
                [sourceColumnName]: sourceColumn,
                [destColumnName]: destColumn,
            };
            setBoardData(newBoardData);

            const newStatus = columnToStatusMap[destColumnName];
            if (newStatus) {
                const updatedKit = { 
                    ...kitToMove, 
                    status: newStatus,
                };
                onKitStatusChange(updatedKit);
            }
        }
    };
    
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null;
    }
    
    const displayColumns = isArchiveView ? archiveColumn : columns;


    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                {displayColumns.map(columnName => (
                    <KitKanbanColumn 
                        key={columnName} 
                        columnName={columnName}
                        kits={boardData[columnName]}
                        onArchiveKit={onArchiveKit}
                        onRestoreKit={onRestoreKit}
                        isArchiveView={isArchiveView}
                    />
                ))}
            </div>
        </DragDropContext>
    );
};
