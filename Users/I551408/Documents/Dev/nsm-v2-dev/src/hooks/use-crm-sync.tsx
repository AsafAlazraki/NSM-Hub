
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getCrmCredentials, getQuotes, saveQuote, saveSyncAuditLog } from '@/lib/storage';
import type { CrmCredentials, Quote, SyncAuditLog } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface CrmContact {
  contactid: string;
  fullname: string;
  emailaddress1: string;
  jobtitle: string;
  telephone1: string;
  [key: string]: any;
}

interface CrmSyncContextType {
  isSyncing: boolean;
  nextSyncInSeconds: number;
  contacts: CrmContact[];
  accessToken: string | null;
  runAutomatedSync: (isManualTrigger?: boolean) => Promise<void>;
}

const CrmSyncContext = createContext<CrmSyncContextType>({
  isSyncing: false,
  nextSyncInSeconds: 0,
  contacts: [],
  accessToken: null,
  runAutomatedSync: async () => {},
});

export const useCrmSync = () => useContext(CrmSyncContext);

const SYNC_INTERVAL = 300; // 5 minutes in seconds

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side, use the current origin
    return window.location.origin;
  }
  // Server-side, use environment variables. Fallback for development.
  return process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:9002';
}

export const CrmSyncProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [timeToNextSync, setTimeToNextSync] = useState(SYNC_INTERVAL);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [contacts, setContacts] = useState<CrmContact[]>([]);

  const runAutomatedSync = useCallback(async (isManualTrigger = false) => {
    if (!user) return;

    const credentials = await getCrmCredentials();
    if (!credentials || !credentials.tenantId?.trim() || !credentials.clientId?.trim() || !credentials.clientSecret?.trim() || !credentials.resource?.trim()) {
        if (isManualTrigger) {
            toast({
                title: "Credentials Missing",
                description: "Please configure Dynamics CRM credentials in the Admin Config page.",
                variant: "destructive",
            });
        }
        return;
    }

    setIsSyncing(true);
    if (isManualTrigger) {
        toast({ title: "Sync Started", description: "Authenticating and fetching data..." });
    }
    
    const apiBaseUrl = getApiBaseUrl();

    const logAction = async (action: string, error: string | null = null) => {
        await saveSyncAuditLog({
            userId: user.uid,
            userName: user.displayName || 'Automated Sync',
            action,
            error,
            timestamp: Timestamp.now(),
        });
    };

    await logAction('Sync process started.');

    try {
        const tokenRes = await fetch(`${apiBaseUrl}/api/mscrm-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        const tokenData = await tokenRes.json();

        if (!tokenRes.ok || !tokenData.access_token) {
            const authError = tokenData.error_description || "Failed to fetch access token.";
            await logAction('CRM Authentication Failed.', authError);
            throw new Error(authError);
        }

        const newAccessToken = tokenData.access_token;
        setAccessToken(newAccessToken);
        
        const { created, updated, fetchedContacts } = await handleSync(newAccessToken, credentials.resource, user.uid);
        setContacts(fetchedContacts);

        await logAction(`Sync completed. Created ${created} contacts in CRM. Updated ${updated} app records.`);
        if (isManualTrigger) {
            toast({
                title: "Sync Completed",
                description: `Created ${created} new CRM contacts. Updated ${updated} app records.`,
                duration: 9000,
            });
        }
    } catch (error: any) {
        if (error.message && !error.message.includes('fetch access token')) {
            await logAction('Sync process failed.', error.message);
        }
        if (isManualTrigger) {
            toast({ title: "Sync Failed", description: error.message, variant: "destructive" });
        }
        console.error("Automated sync failed:", error);
    } finally {
        setIsSyncing(false);
        setTimeToNextSync(SYNC_INTERVAL);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
        runAutomatedSync(false); // Run once on load
        const syncIntervalId = setInterval(() => runAutomatedSync(false), SYNC_INTERVAL * 1000);
        const timerIntervalId = setInterval(() => {
            setTimeToNextSync(prevTime => (prevTime <= 1 ? SYNC_INTERVAL : prevTime - 1));
        }, 1000);

        return () => {
            clearInterval(syncIntervalId);
            clearInterval(timerIntervalId);
        };
    }
  }, [user, runAutomatedSync]);

  const value = { isSyncing, nextSyncInSeconds: timeToNextSync, contacts, accessToken, runAutomatedSync };

  return <CrmSyncContext.Provider value={value}>{children}</CrmSyncContext.Provider>;
};


async function handleSync(token: string, resource: string, userId: string) {
    let recordsCreatedInCrm = 0;
    let recordsUpdatedInApp = 0;
    const apiBaseUrl = getApiBaseUrl();

    try {
        const contactsEndpointPath = '/api/data/v9.2/contacts?$select=fullname,emailaddress1,jobtitle,telephone1';
        const contactsRes = await fetch(`${apiBaseUrl}/api/mscrm?endpoint=${encodeURIComponent(contactsEndpointPath)}&resource=${encodeURIComponent(resource)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        });

        if (!contactsRes.ok) {
            const errorData = await contactsRes.json();
            throw new Error(errorData.error?.message || "Failed to fetch contacts from CRM.");
        }
        const contactsData = await contactsRes.json();
        const crmContacts: CrmContact[] = (contactsData.value || []);
        
        const allQuotes: Quote[] = await getQuotes();
        
        const crmContactsByEmail = new Map<string, CrmContact>();
        if (crmContacts && crmContacts.length > 0) {
            crmContacts.forEach(c => {
                if(c.emailaddress1) crmContactsByEmail.set(c.emailaddress1.toLowerCase(), c);
            });
        }
        
        if (allQuotes && allQuotes.length > 0) {
            const localCustomersByEmail = new Map<string, Quote['customer']>();
            allQuotes.forEach(q => {
                if(q && q.customer?.email && !localCustomersByEmail.has(q.customer.email.toLowerCase())) {
                    localCustomersByEmail.set(q.customer.email.toLowerCase(), q.customer);
                }
            });

            // 1. Sync local customers TO CRM (if they don't exist in CRM)
            if (localCustomersByEmail.size > 0) {
                 for (const [email, localCustomer] of localCustomersByEmail.entries()) {
                    if (localCustomer && !crmContactsByEmail.has(email)) { // Ensure localCustomer exists
                        const [firstname, ...lastnameParts] = localCustomer.name.split(' ');
                        const lastname = lastnameParts.join(' ');
                        const newContactPayload = {
                            firstname,
                            lastname,
                            emailaddress1: localCustomer.email,
                            telephone1: localCustomer.phone,
                        };
                        await fetch(`${apiBaseUrl}/api/mscrm?endpoint=${encodeURIComponent('/api/data/v9.2/contacts')}&resource=${encodeURIComponent(resource)}`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify(newContactPayload),
                        });
                        recordsCreatedInCrm++;
                    }
                }
            }
           
            // 2. Sync CRM changes TO local quotes
            if (crmContactsByEmail.size > 0) {
                const quotesToUpdate = new Map<string, Quote>();
                for (const quote of allQuotes) {
                    if (!quote || !quote.customer?.email) continue;
                    
                    const crmContact = crmContactsByEmail.get(quote.customer.email.toLowerCase());
                    if (crmContact) {
                        const localCustomerName = quote.customer.name || '';
                        const crmCustomerName = crmContact.fullname || '';
                        const localCustomerPhone = quote.customer.phone || '';
                        const crmCustomerPhone = crmContact.telephone1 || '';

                        const nameNeedsUpdate = crmCustomerName && crmCustomerName.trim() !== localCustomerName.trim();
                        const phoneNeedsUpdate = crmCustomerPhone && crmCustomerPhone.trim() !== localCustomerPhone.trim();
                        const roleNeedsUpdate = crmContact.jobtitle && quote.user && crmContact.jobtitle !== quote.user.role;
                        const emailNeedsUpdate = crmContact.emailaddress1 && crmContact.emailaddress1 !== quote.customer.email;

                        if (nameNeedsUpdate || phoneNeedsUpdate || roleNeedsUpdate || emailNeedsUpdate) {
                            const updatedCustomer = {
                                ...quote.customer,
                                name: nameNeedsUpdate ? crmCustomerName.trim() : localCustomerName,
                                phone: phoneNeedsUpdate ? crmCustomerPhone.trim() : localCustomerPhone,
                                email: emailNeedsUpdate ? crmContact.emailaddress1 : quote.customer.email,
                            };
                            const updatedQuote = { ...quote, customer: updatedCustomer };
                            quotesToUpdate.set(quote.id, updatedQuote); 
                        }
                    }
                }
                 if (quotesToUpdate.size > 0) {
                    for (const quote of quotesToUpdate.values()) {
                        await saveQuote(quote, true);
                    }
                    recordsUpdatedInApp = quotesToUpdate.size;
                }
            }
        }

        // Fetch the latest contacts again after creating new ones if any were created
        let finalCrmContacts = crmContacts;
        if(recordsCreatedInCrm > 0) {
            const finalContactsRes = await fetch(`${apiBaseUrl}/api/mscrm?endpoint=${encodeURIComponent(contactsEndpointPath)}&resource=${encodeURIComponent(resource)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            });
            if (finalContactsRes.ok) {
                const finalContactsData = await finalContactsRes.json();
                finalCrmContacts = finalContactsData.value || [];
            }
        }

        return { created: recordsCreatedInCrm, updated: recordsUpdatedInApp, fetchedContacts: finalCrmContacts };

    } catch (error: any) {
        console.error("Sync process failed:", error.message);
        throw error;
    }
};
