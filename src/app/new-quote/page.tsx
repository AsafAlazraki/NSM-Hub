
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is a redirect to the new location for creating a service estimate.
export default function RedirectPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/service-hub/estimates/new');
    }, [router]);
    return null;
}
