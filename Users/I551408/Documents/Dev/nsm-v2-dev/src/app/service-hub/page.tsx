
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function ServiceHubRedirect() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (user) {
                // Default to the estimates page if logged in
                router.replace('/service-hub/estimates');
            } else {
                // If not logged in, redirect to login page
                router.replace('/login');
            }
        }
    }, [user, loading, router]);

    return null; // Or a loading spinner
}
