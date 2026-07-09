
"use client";

import React, { useState } from 'react';
import { useChecklistForm } from './ChecklistCreationForm';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, PlusCircle, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ChecklistItem } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const DraggableChecklistItem = ({
  item,
  index,
  level,
  path,
  onUpdate,
  onRemove,
  onAddChild,
}: {
  item: ChecklistItem;
  index: number;
  level: number;
  path: string;
  onUpdate: (path: string, field: 'text' | 'instructions', value: string) => void;
  onRemove: (path: string) => void;
  onAddChild: (path: string) => void;
}) => {
  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="rounded-lg bg-muted/50 p-3"
        >
          <div className="flex items-start gap-2">
            <div {...provided.dragHandleProps} className="pt-2 cursor-grab">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-2">
              <Input
                placeholder={`Item ${index + 1} text...`}
                value={item.text}
                onChange={(e) => onUpdate(path, 'text', e.target.value)}
                className="font-medium"
              />
              <Textarea
                placeholder="Instructions (optional)..."
                value={item.instructions}
                onChange={(e) => onUpdate(path, 'instructions', e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(path)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
              {level < 1 && ( // Only allow one level of nesting
                <Button type="button" variant="ghost" size="icon" onClick={() => onAddChild(path)}>
                  <PlusCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {item.children && item.children.length > 0 && (
            <div className="pl-8 mt-2">
                <ChecklistDropZone 
                    items={item.children} 
                    droppableId={`children-of-${item.id}`} 
                    level={level + 1}
                    path={path}
                    onUpdate={onUpdate}
                    onRemove={onRemove}
                    onAddChild={onAddChild}
                />
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};


const ChecklistDropZone = ({ items, droppableId, level, path, onUpdate, onRemove, onAddChild }: { items: ChecklistItem[], droppableId: string, level: number, path: string, onUpdate: any, onRemove: any, onAddChild: any }) => {
    return (
        <Droppable droppableId={droppableId} type={level === 0 ? 'toplevel' : 'child'}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-3 p-2 rounded-md transition-colors"
                    style={{ backgroundColor: snapshot.isDraggingOver ? 'hsl(var(--primary) / 0.1)' : 'transparent' }}
                >
                    {items.map((item, index) => (
                         <DraggableChecklistItem
                            key={item.id}
                            item={item}
                            index={index}
                            level={level}
                            path={path ? `${path}.children.${index}` : `${index}`}
                            onUpdate={onUpdate}
                            onRemove={onRemove}
                            onAddChild={onAddChild}
                        />
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    )
}

export default function StepChecklistItems() {
  const { checklistData, setChecklistData, handleNext, handleBack, handleSave, isSaving } = useChecklistForm();

  const handleUpdateItem = (path: string, field: 'text' | 'instructions', value: string) => {
    setChecklistData(prev => {
        const newItems = JSON.parse(JSON.stringify(prev.items));
        let currentLevel: any = newItems;
        const pathParts = path.split('.');
        
        pathParts.forEach((part, index) => {
            if (index === pathParts.length - 1) {
                currentLevel[part][field] = value;
            } else {
                currentLevel = currentLevel[part];
            }
        });
        return { ...prev, items: newItems };
    });
  };

  const handleRemoveItem = (path: string) => {
    setChecklistData(prev => {
        const newItems = JSON.parse(JSON.stringify(prev.items));
        const pathParts = path.split('.');
        const indexToRemove = parseInt(pathParts.pop()!, 10);
        
        let parent = newItems;
        if (pathParts.length > 0) {
            parent = pathParts.reduce((acc: any, part) => acc[part], { children: newItems }).children;
        }

        parent.splice(indexToRemove, 1);
        return { ...prev, items: newItems };
    });
  };

  const handleAddItem = (path?: string) => {
    const newItem: ChecklistItem = { id: uuidv4(), text: '', instructions: '', children: [] };
    setChecklistData(prev => {
        const newItems = JSON.parse(JSON.stringify(prev.items || []));
        if (!path) { // Add to top level
            newItems.push(newItem);
        } else {
             const pathParts = path.split('.');
             const parent = pathParts.reduce((acc: any, part) => acc[part], { children: newItems });
             if(!parent.children) parent.children = [];
             parent.children.push(newItem);
        }
        return { ...prev, items: newItems };
    });
  };

  const onDragEnd = (result: any) => {
     const { source, destination, type } = result;

    if (!destination) return;

    setChecklistData(prev => {
        const newItems = JSON.parse(JSON.stringify(prev.items || []));

        // Find source and destination parents
        let sourceParent = newItems;
        if(source.droppableId !== 'toplevel') {
            const pathParts = source.droppableId.replace('children-of-', '').split('.');
            sourceParent = pathParts.reduce((acc: any, part: string) => acc[part], { children: newItems }).children;
        }

        const [removed] = sourceParent.splice(source.index, 1);
        
        let destParent = newItems;
        if(destination.droppableId !== 'toplevel') {
            const pathParts = destination.droppableId.replace('children-of-', '').split('.');
            destParent = pathParts.reduce((acc: any, part: string) => acc[part], { children: newItems }).children;
        }
        
        destParent.splice(destination.index, 0, removed);
        
        return {...prev, items: newItems };
    });
  };

  return (
    <>
      <CardHeader className="p-0 mb-6">
        <CardTitle className="font-headline text-2xl">Build Checklist</CardTitle>
        <CardDescription>
          Add, remove, and reorder items for your checklist.
        </CardDescription>
      </CardHeader>
        <div className="flex justify-end mb-4">
            <Button type="button" variant="outline" onClick={() => handleAddItem()}>
                <PlusCircle className="mr-2" /> Add Top-Level Item
            </Button>
        </div>
        <DragDropContext onDragEnd={onDragEnd}>
            <ChecklistDropZone 
                items={checklistData.items || []}
                droppableId="toplevel"
                level={0}
                path=""
                onUpdate={handleUpdateItem}
                onRemove={handleRemoveItem}
                onAddChild={(path: string) => handleAddItem(path)}
            />
        </DragDropContext>
      <div className="flex justify-between mt-8">
        <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
        <Button type="button" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Checklist'}</Button>
      </div>
    </>
  );
}

    