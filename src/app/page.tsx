
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { Button } from "@/components/ui/button";
import { APP_NAME } from '@/lib/constants';
import { LogIn, UserPlus, Building2, Heart } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background p-8">
        <Building2 className="h-16 w-16 text-primary mb-6 animate-pulse" />
        <h1 className="text-4xl font-bold text-primary mb-4">{APP_NAME}</h1>
        <p className="text-lg text-foreground mb-8">Loading your secure access...</p>
        <div className="w-full max-w-md space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isLoading && !user) {
    return (
      <div className="flex flex-col min-h-screen items-center bg-gradient-to-br from-background via-secondary/10 to-background py-12 px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-12 md:mb-16">
          <Building2 className="h-20 w-20 text-primary mx-auto mb-6" />
          <h1 className="text-5xl font-bold tracking-tight text-primary sm:text-6xl">
            {APP_NAME}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Your all-in-one solution for modern & secure community management.
          </p>
        </header>

        <main className="w-full max-w-4xl flex-grow flex flex-col items-center justify-center">
          {/* Removed "Streamline Your Community" and "Key Features" section */}
          
          <div className="text-center space-y-4 mt-8 md:mt-12">
            <h3 className="text-xl font-semibold text-foreground">Get Started</h3>
            <p className="text-muted-foreground text-sm">Access your community portal or create a new account.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
                <Link href="/login" passHref>
                    <Button size="lg" className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow">
                        <LogIn className="mr-2 h-5 w-5" /> Login to Your Account
                    </Button>
                </Link>
                <Link href="/register" passHref>
                    <Button variant="outline" size="lg" className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow">
                        <UserPlus className="mr-2 h-5 w-5" /> Register for an Account
                    </Button>
                </Link>
            </div>
          </div>
        </main>

        <footer className="mt-16 md:mt-24 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <div className="flex items-center justify-center text-sm mt-2">
            Made in India with <Heart className="h-4 w-4 text-red-500 fill-red-500 mx-1.5" />
          </div>
          <p className="text-xs mt-1">Secure. Streamlined. Connected.</p>
        </footer>
      </div>
    );
  }

  return (
     <div className="flex flex-col h-screen items-center justify-center bg-background p-8">
      <Building2 className="h-16 w-16 text-primary mb-6 animate-pulse" />
      <h1 className="text-4xl font-bold text-primary mb-4">{APP_NAME}</h1>
      <p className="text-lg text-foreground mb-8">Initializing...</p>
    </div>
  );
}
