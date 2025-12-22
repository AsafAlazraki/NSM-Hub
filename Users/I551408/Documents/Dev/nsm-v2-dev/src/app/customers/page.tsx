
"use client";

import * as React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function CustomerHubRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/sales-hub/customers');
    }, [router]);

    return null; // Or a loading spinner
}
