
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from '@/lib/constants';
import { LogIn, UserPlus, Building2, ListChecks, MessagesSquare, SearchCheck, ShieldAlert, Heart } from 'lucide-react';
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

        <main className="w-full max-w-4xl">
          <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 rounded-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-semibold text-foreground text-center">
                Streamline Your Community
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground text-base text-center">
                {APP_NAME} empowers residents and management committees with easy-to-use tools for communication, visitor tracking, complaint resolution, and much more. Experience seamless society operations, enhanced security, and a more connected neighborhood.
              </p>
              
              <div>
                <h4 className="font-semibold text-foreground mb-3 text-lg text-center">Key Features:</h4>
                <ul className="list-none space-y-3 text-muted-foreground text-sm grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                  <li className="flex items-center">
                    <SearchCheck className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                    Effortless Visitor Management & Gate Pass System
                  </li>
                  <li className="flex items-center">
                    <MessagesSquare className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                    Transparent Communication (Announcements, Meetings)
                  </li>
                  <li className="flex items-center">
                    <ShieldAlert className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                    Enhanced Security with Digital Gatekeeping
                  </li>
                  <li className="flex items-center">
                    <ListChecks className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                    Organized Society Operations & Important Contacts
                  </li>
                </ul>
              </div>

              <div className="pt-8 text-center space-y-4">
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

  return (
     <div className="flex flex-col h-screen items-center justify-center bg-background p-8">
      <Building2 className="h-16 w-16 text-primary mb-6 animate-pulse" />
      <h1 className="text-4xl font-bold text-primary mb-4">{APP_NAME}</h1>
      <p className="text-lg text-foreground mb-8">Initializing...</p>
    </div>
  );
}
