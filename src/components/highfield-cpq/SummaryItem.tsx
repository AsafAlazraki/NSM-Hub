

"use client";

import { cn } from "@/lib/utils";
import React from "react";

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
};

export const SummaryItem = ({ icon: Icon, label, value, price, includesGst, imageUrl, isSubItem = false }: { icon?: React.ElementType; label: string; value?: React.ReactNode, price?: number, includesGst?: boolean, imageUrl?: string | null, isSubItem?: boolean }) => {
    const displayPrice = price !== undefined ? formatCurrency(price) : null;
    
    return (
        <div className={cn("flex justify-between items-start gap-4", !Icon && isSubItem && "pl-12", !Icon && !isSubItem && "pl-6")}>
            <div className="flex items-start gap-3">
                {Icon && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5 shrink-0">
                    <Icon className="h-5 w-5" />
                    </div>
                )}
                 {imageUrl && !Icon && (
                    <img src={imageUrl} alt={label} className="h-8 w-8 object-contain rounded-md border mt-0.5 shrink-0" />
                 )}
                <div>
                    <p className="font-medium text-sm">{label}</p>
                    {value && <p className="text-muted-foreground text-sm">{value}</p>}
                </div>
            </div>
            {displayPrice && (
                 <div className="text-right">
                    <p className="font-semibold">{displayPrice}</p>
                    {includesGst && <p className="text-xs text-muted-foreground">inc. GST</p>}
                 </div>
            )}
        </div>
    );
};
