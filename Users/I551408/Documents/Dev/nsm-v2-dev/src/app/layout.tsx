
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/hooks/use-auth';
import { CrmSyncProvider } from '@/hooks/use-crm-sync';

export const metadata: Metadata = {
  title: 'NSM Everything Hub',
  description: 'Your all-in-one business management tool.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased h-full">
        <AuthProvider>
            <CrmSyncProvider>
                {children}
            </CrmSyncProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
