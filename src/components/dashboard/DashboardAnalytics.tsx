

"use client";

import { useMemo, useEffect, useState } from 'react';
import type { Quote } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, BarChart, FileText, Sparkles } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { getQuotes } from '@/lib/storage';
import { useAuth } from '@/hooks/use-auth';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const SmallMetricCard = ({ title, value, icon: Icon, subtext }: { title: string, value: string, icon: React.ElementType, subtext: string }) => (
    <Card>
        <CardContent className="p-4">
            <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-xl font-bold">{value}</p>
                </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 ml-1">{subtext}</p>
        </CardContent>
    </Card>
);

type ActiveQuoteStatus = 'Draft' | 'Estimate' | 'Work In Progress' | 'Pending' | 'Approved' | 'Complete';

export const DashboardAnalytics = () => {
    const { user } = useAuth();
    const [quotes, setQuotes] = useState<Quote[]>([]);
    
    useEffect(() => {
        if(user) {
            getQuotes()
                .then(setQuotes)
                .catch(err => console.error("Failed to fetch quotes for analytics", err))
        }
    }, [user]);

    const analyticsData = useMemo(() => {
        if (!quotes) return {
            totalApprovedValue: 0,
            pendingCount: 0,
            totalCount: 0,
            statusCounts: [],
            averageQuoteValue: 0,
            topService: 'N/A',
        };
        
        const historyIds = new Set<string>();
        quotes.forEach(quote => {
          (quote.history || []).forEach(id => historyIds.add(id));
        });

        const EXCLUDED_STATUSES = ['Deleted', 'Cancelled', 'Archived'];
        const activeQuotes = quotes.filter(q => !historyIds.has(q.id) && !EXCLUDED_STATUSES.includes(q.status));

        const quoteTotals = activeQuotes.map(q => {
            const subTotal = (q.operations || []).reduce((acc, op) => {
                const laborCost = (op.laborRate || 0) * (op.laborHours || 0);
                const partsCost = (op.parts || []).reduce((pAcc, part) => pAcc + ((part.cost || 0) * (part.quantity || 1)), 0);
                return acc + laborCost + partsCost;
            }, 0);
            return subTotal * 1.10;
        });

        const totalApprovedValue = activeQuotes
            .filter(q => q.status === 'Approved')
            .reduce((sum, q) => {
                 const subTotal = (q.operations || []).reduce((acc, op) => {
                    const laborCost = (op.laborRate || 0) * (op.laborHours || 0);
                    const partsCost = (op.parts || []).reduce((pAcc, part) => pAcc + ((part.cost || 0) * (part.quantity || 1)), 0);
                    return sum + laborCost + partsCost;
                }, 0);
                return sum + (subTotal * 1.10);
            }, 0);
            
        const totalQuoteValue = quoteTotals.reduce((sum, total) => sum + total, 0);
        const averageQuoteValue = activeQuotes.length > 0 ? totalQuoteValue / activeQuotes.length : 0;
        
        const totalCount = activeQuotes.length;
        
        const statusOrder: ActiveQuoteStatus[] = ['Draft', 'Estimate', 'Work In Progress', 'Pending', 'Approved', 'Complete'];
        const statusCounts: { name: string; count: number; fill: string }[] = statusOrder.map(status => ({
            name: status,
            count: activeQuotes.filter(q => q.status === status).length,
            fill: `hsl(var(--chart-${statusOrder.indexOf(status) + 1}))`
        }));
        
        const operationHeadings = activeQuotes.flatMap(q => q.operations?.map(op => op.heading) || []);
        const headingCounts = operationHeadings.reduce((acc, heading) => {
            acc[heading] = (acc[heading] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topService = Object.keys(headingCounts).length > 0 
            ? Object.entries(headingCounts).sort((a, b) => b[1] - a[1])[0][0] 
            : 'N/A';

        return { totalApprovedValue, totalCount, statusCounts, averageQuoteValue, topService };
    }, [quotes]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <SmallMetricCard 
                title="Approved Quote Value" 
                value={formatCurrency(analyticsData.totalApprovedValue)} 
                icon={DollarSign}
                subtext="Total value of all approved quotes"
            />
             <SmallMetricCard 
                title="Average Quote Value" 
                value={formatCurrency(analyticsData.averageQuoteValue)} 
                icon={FileText}
                subtext="Average value across all quotes"
            />
            <SmallMetricCard 
                title="AI Insight: Top Service" 
                value={analyticsData.topService}
                icon={Sparkles}
                subtext="Most frequently quoted service"
            />
             <SmallMetricCard 
                title="Total Active Quotes" 
                value={String(analyticsData.totalCount)} 
                icon={FileText}
                subtext="All non-archived quotes"
            />
        </div>
    )
}
