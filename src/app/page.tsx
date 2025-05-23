
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { APP_NAME } from '@/lib/constants';
import { Building2, Heart, Info, Newspaper, Settings, Phone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { LoginForm } from '@/components/auth/LoginForm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const navLinks = [
  { label: 'About Us', href: '#', icon: Info },
  { label: 'Features', href: '#', icon: Settings },
  { label: 'Services', href: '#', icon: Newspaper },
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

        <nav className="mb-10 md:mb-12">
          <ul className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {navLinks.map((item) => (
              <li key={item.label}>
                <Button
                  variant="outline"
                  className="border-primary/50 text-primary hover:bg-secondary hover:text-secondary-foreground hover:border-secondary focus:ring-primary/50"
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="w-full max-w-md flex-grow flex flex-col items-center justify-center">
          <LoginForm />
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
