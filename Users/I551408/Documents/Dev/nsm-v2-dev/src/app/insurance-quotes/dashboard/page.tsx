"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is a redirect to the new location for the service estimates dashboard.
export default function RedirectPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/service-hub/estimates');
    }, [router]);
    return null;
}
