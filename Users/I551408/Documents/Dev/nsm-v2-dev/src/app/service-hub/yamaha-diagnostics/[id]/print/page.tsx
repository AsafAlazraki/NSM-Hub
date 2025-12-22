
"use client";

import React, { useState, useEffect } from 'react';
import type { DiagnosticReport } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { getDiagnosticReportById } from '@/lib/storage';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Printer, ArrowLeft, X } from 'lucide-react';

export default function PrintDiagnosticReportPage() {
  const params = useParams();
  const id = params.id as string;
  const [report, setReport] = useState<DiagnosticReport | null | undefined>(undefined);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchReport = async () => {
        if (user && id) {
            const foundReport = await getDiagnosticReportById(id);
            setReport(foundReport);
        }
    }
    fetchReport();
  }, [id, user]);


  if (report === undefined || authLoading || !user) {
    return (
      <div className="bg-gray-100 min-h-screen p-4 sm:p-8">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          <Skeleton className="h-screen w-full" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-8">
        <h1 className="text-2xl font-bold">Report not found</h1>
        <p className="text-muted-foreground">The report you are looking for does not exist.</p>
        <Button asChild className="mt-4">
          <Link href="/">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="no-print fixed top-4 left-1/2 -translate-x-1/2 flex justify-center gap-4 mb-8 z-50">
            <Button variant="outline" asChild>
              <Link href={`/service-hub/yamaha-diagnostics/${report.id}`}><ArrowLeft/> Back to Report View</Link>
          </Button>
          <Button onClick={() => window.print()}>
              <Printer className="mr-2"/> Print or Save as PDF
          </Button>
          <Button variant="secondary" asChild>
              <Link href="/"><X/> Close</Link>
          </Button>
      </div>
      <div className="max-w-4xl mx-auto bg-white" id="printable-quote">
            <iframe src={report.reportContent} className="w-full h-screen border-none" title={`Diagnostic Report for ${report.customer.name}`} />
      </div>
    </>
);
}
