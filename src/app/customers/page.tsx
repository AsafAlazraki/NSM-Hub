
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerHubRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/sales-hub/customers');
    }, [router]);

    return null; // Or a loading spinner
}
