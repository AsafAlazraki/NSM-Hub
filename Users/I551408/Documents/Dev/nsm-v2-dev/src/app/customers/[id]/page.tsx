"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function RedirectPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    
    useEffect(() => {
        if(id) {
            router.replace(`/sales-hub/customers/${id}`);
        } else {
            router.replace('/sales-hub/customers');
        }
    }, [router, id]);

    return null; // Or a loading spinner
}
