

"use client";

import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarProvider } from '@/components/ui/sidebar';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function Loading() {
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
