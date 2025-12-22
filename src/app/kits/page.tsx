
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KitsRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/catalogue/kits');
    }, [router]);

    return null; // Or a loading spinner
}

    