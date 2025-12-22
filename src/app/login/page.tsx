
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { saveUserProfile } from '@/lib/storage';
import type { UserProfile } from '@/lib/types';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const auth = getAuth();
  const { toast } = useToast();

  const handleAuthAction = async (action: 'signIn' | 'signUp') => {
    setError(null);
    try {
      if (action === 'signUp') {
        // Step 1: Create the user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        if (!user) {
            throw new Error("User creation failed.");
        }

        // Step 2: Create the user profile object with the data from the form
        const userProfile: UserProfile = {
            uid: user.uid,
            email: user.email!,
            name: name,
            phone: phone,
            role: role,
        };
        
        // Step 3: Await the saving of the profile to Firestore. 
        // This is the critical step to prevent the race condition.
        await saveUserProfile(userProfile);

        // Step 4: Only after the profile is saved, notify the user and redirect.
        toast({ title: "Account Created", description: "You have successfully signed up." });
        router.push('/');

      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Signed In", description: "Welcome back!" });
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message);
      toast({ variant: "destructive", title: "Authentication Error", description: err.message });
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({ variant: "destructive", title: "Email Required", description: "Please enter your email address to reset your password." });
      return;
    }
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: "Password Reset Email Sent", description: "Check your inbox for instructions to reset your password." });
    } catch (err: any) {
      setError(err.message);
      toast({ variant: "destructive", title: "Password Reset Error", description: err.message });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
            <h1 className="text-3xl font-bold font-headline text-primary">NSM Everything Hub</h1>
        </div>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Enter your credentials to access your account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-login">Email</Label>
                  <Input id="email-login" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-login">Password</Label>
                  <Input id="password-login" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="text-sm">
                  <a href="#" onClick={(e) => { e.preventDefault(); handlePasswordReset(); }} className="font-medium text-primary hover:underline">
                    Forgot your password?
                  </a>
                </div>
                <Button className="w-full" onClick={() => handleAuthAction('signIn')}>Login</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Sign Up</CardTitle>
                <CardDescription>Create a new account to get started.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                  <Label htmlFor="name-signup">Full Name</Label>
                  <Input id="name-signup" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input id="email-signup" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="phone-signup">Phone Number</Label>
                  <Input id="phone-signup" type="tel" placeholder="555-123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role-signup">Role</Label>
                  <Input id="role-signup" type="text" placeholder="e.g., Technician" value={role} onChange={(e) => setRole(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Password</Label>
                  <Input id="password-signup" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button className="w-full" onClick={() => handleAuthAction('signUp')}>Sign Up</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
         {error && <p className="text-destructive text-center">{error}</p>}
      </div>
    </div>
  );
}
