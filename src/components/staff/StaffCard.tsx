"use client";

import type { UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, Briefcase } from 'lucide-react';

interface StaffCardProps {
    user: UserProfile;
}

export const StaffCard = ({ user }: StaffCardProps) => {

    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-lg">
                    <User /> {user.name}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="w-4 h-4" />
                    <span>{user.role || 'N/A'}</span>
                </div>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                </div>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{user.phone || 'N/A'}</span>
                </div>
            </CardContent>
        </Card>
    )
}
