"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/service-hub/bookings/new');
    }, [router]);
    return null;
}
