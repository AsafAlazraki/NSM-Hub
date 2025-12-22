
"use client";

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

// This page is a redirect to the new location for editing a service estimate.
export default function RedirectPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    useEffect(() => {
        if(id) {
            router.replace(`/service-hub/estimates/${id}/edit`);
        }
    }, [router, id]);
    return null;
}
