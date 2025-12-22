
'use client';

import { BookingForm } from '@/components/booking/BookingForm';
import { getStaticLogo } from '@/lib/storage';
import { useEffect, useState } from 'react';

export default function PublicBookingFormPage() {
    const [logo, setLogo] = useState<string | null>(null);

    useEffect(() => {
        getStaticLogo().then(setLogo);
    }, []);

    return (
        <div className="bg-muted/40 min-h-screen sm:py-12">
            <div className="container mx-auto max-w-4xl sm:px-4">
                 <main className="w-full">
                    <BookingForm formId="public" logo={logo} />
                </main>
            </div>
        </div>
    );
}
