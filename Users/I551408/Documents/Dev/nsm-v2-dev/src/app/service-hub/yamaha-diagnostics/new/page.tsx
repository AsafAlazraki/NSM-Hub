
"use client";

import { Header } from "@/components/Header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ReportCreationForm } from "@/components/yamaha-diagnostics/ReportCreationForm";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewDiagnosticReportPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-col h-full">
        <Header>
            <Button variant="ghost" asChild>
                <Link href="/service-hub/yamaha-diagnostics">Cancel</Link>
            </Button>
        </Header>
        <main className="flex-1 container mx-auto max-w-5xl py-8 px-4">
          <div className="space-y-8">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[600px] w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header>
          <Button variant="ghost" asChild>
              <Link href="/service-hub/yamaha-diagnostics">Cancel</Link>
          </Button>
      </Header>
      <main className="flex-1">
        <ReportCreationForm />
      </main>
    </div>
  );
}
