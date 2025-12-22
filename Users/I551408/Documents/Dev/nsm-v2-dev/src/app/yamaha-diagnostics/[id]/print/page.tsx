
"use client";

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function RedirectPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    useEffect(() => {
        if(id) {
            router.replace(`/service-hub/yamaha-diagnostics/${id}/print`);
        }
    }, [router, id]);
    return null;
}
