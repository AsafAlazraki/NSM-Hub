
"use client";

import Link from 'next/link';
import { Button } from './ui/button';
import { Users, BookOpenCheck } from 'lucide-react';
import { Logo } from './Logo';
import { Sidebar } from './ui/sidebar';
import { useCrmSync } from '@/hooks/use-crm-sync';

const SyncStatus = () => {
    const { isSyncing, nextSyncInSeconds } = useCrmSync();
    const minutes = Math.floor(nextSyncInSeconds / 60);
    const seconds = nextSyncInSeconds % 60;
    const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isSyncing ? (
                <>
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span>Syncing...</span>
                </>
            ) : (
                <span>Next sync in {timeString}</span>
            )}
        </div>
    );
};

export const Header = ({ children }: { children?: React.ReactNode }) => {
  
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-2">
            <Sidebar/>
             <Link href="/" className="hidden font-bold text-lg md:block">
              NSM Everything Hub
            </Link>
            <SyncStatus />
        </div>
      <div className="flex items-center gap-4">
        {children}
      </div>
    </header>
  );
};

    