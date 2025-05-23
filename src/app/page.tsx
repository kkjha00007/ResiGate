
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { Button } from "@/components/ui/button";
import { APP_NAME } from '@/lib/constants';
import { LogIn, UserPlus, Building2, Heart, Info, Phone, Users, ListChecks, MapPin, Star } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const landingNavItems = [
  { label: 'About Us', href: '#', icon: Info },
  { label: 'Features', href: '#', icon: ListChecks },
  { label: 'Services', href: '#', icon: Star },
  // { label: 'Pricing', href: '#', icon: Tag }, // Example if you add pricing
  { label: 'Contact Us', href: '#', icon: Phone },
];

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
        <header className="text-center mb-8 md:mb-12">
          <Building2 className="h-20 w-20 text-primary mx-auto mb-6" />
          <h1 className="text-5xl font-bold tracking-tight text-primary sm:text-6xl">
            {APP_NAME}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Your all-in-one solution for modern & secure community management.
          </p>
        </header>

        <nav className="mb-8 md:mb-12">
          <ul className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {landingNavItems.map((item) => (
              <li key={item.label}>
                <Button variant="outline" asChild className="shadow-sm hover:shadow-md transition-shadow bg-card hover:bg-secondary/50">
                  <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4 text-primary/80" />
                    {item.label}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="w-full max-w-2xl flex-grow flex flex-col items-center justify-center">
          <Card className="w-full shadow-xl rounded-xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-3xl font-semibold text-foreground">Get Started</CardTitle>
              <CardDescription className="text-md text-muted-foreground pt-1">
                Access your community portal or create a new account.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2 text-center">
                <Link href="/login" passHref className="flex flex-col items-center group">
                  <div className="p-4 bg-primary/10 rounded-full mb-3 group-hover:bg-primary/20 transition-colors">
                    <LogIn className="h-12 w-12 text-primary" />
                  </div>
                  <Button size="lg" className="w-full shadow-md hover:shadow-lg transition-shadow">
                     Login to Your Account
                  </Button>
                </Link>
                <Link href="/register" passHref className="flex flex-col items-center group">
                   <div className="p-4 bg-accent/10 rounded-full mb-3 group-hover:bg-accent/20 transition-colors">
                    <UserPlus className="h-12 w-12 text-accent" />
                  </div>
                  <Button variant="outline" size="lg" className="w-full shadow-md hover:shadow-lg transition-shadow">
                    Register for an Account
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
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

  // Fallback for when user object exists but routing hasn't completed yet
  return (
     <div className="flex flex-col h-screen items-center justify-center bg-background p-8">
      <Building2 className="h-16 w-16 text-primary mb-6 animate-pulse" />
      <h1 className="text-4xl font-bold text-primary mb-4">{APP_NAME}</h1>
      <p className="text-lg text-foreground mb-8">Initializing...</p>
    </div>
  );
}
