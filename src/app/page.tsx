
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from '@/lib/constants';
import { LogIn, UserPlus, ShieldCheck, Building2, ListChecks, MessagesSquare, SearchCheck, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
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

  // If user is not loading and is not authenticated, show the new landing page
  if (!isLoading && !user) {
    return (
      <div className="flex flex-col min-h-screen items-center bg-gradient-to-br from-background via-secondary/10 to-background py-12 px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-12 md:mb-16">
          <Building2 className="h-20 w-20 text-primary mx-auto mb-6" />
          <h1 className="text-5xl font-bold tracking-tight text-primary sm:text-6xl">
            {APP_NAME}
          </h1>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
            Your all-in-one solution for modern & secure community management.
          </p>
        </header>

        <main className="w-full max-w-6xl">
          <div className="grid md:grid-cols-5 gap-8 items-start">
            {/* Left Card - Span 3 columns */}
            <Card className="md:col-span-3 shadow-xl hover:shadow-2xl transition-shadow duration-300 rounded-lg">
              <CardHeader>
                <CardTitle className="text-3xl font-semibold text-foreground">
                  Streamline Your Community
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="aspect-[2/1] w-full overflow-hidden rounded-lg">
                  <Image
                    src="https://placehold.co/600x300.png"
                    alt="Community Management Illustration"
                    width={600}
                    height={300}
                    className="object-cover w-full h-full"
                    data-ai-hint="community management"
                  />
                </div>
                <p className="text-muted-foreground text-base sm:text-lg">
                  {APP_NAME} empowers residents and management committees with easy-to-use tools for communication, visitor tracking, complaint resolution, and much more.
                </p>
                <p className="text-muted-foreground text-base">
                  Experience seamless society operations, enhanced security, and a more connected neighborhood.
                </p>
                <div>
                  <h4 className="font-semibold text-foreground mb-3 text-lg">Key Features:</h4>
                  <ul className="list-none space-y-3 text-muted-foreground">
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
              </CardContent>
            </Card>

            {/* Right Card - Span 2 columns */}
            <Card className="md:col-span-2 shadow-xl hover:shadow-2xl transition-shadow duration-300 rounded-lg">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-3xl font-semibold text-foreground">Get Started</CardTitle>
                <CardDescription className="text-base sm:text-lg pt-1">
                  Access your community portal or create a new account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 pt-2">
                <div className="text-center py-6 px-4 border border-dashed border-border rounded-lg hover:border-primary transition-colors duration-300">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <LogIn className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">Existing User?</h3>
                  <Link href="/login" passHref>
                    <Button variant="link" className="text-lg text-primary px-0 h-auto py-1">Login to Your Account</Button>
                  </Link>
                </div>

                <div className="text-center py-6 px-4 border border-dashed border-border rounded-lg hover:border-primary transition-colors duration-300">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <UserPlus className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">New Resident or Guard?</h3>
                  <Link href="/register" passHref>
                     <Button variant="link" className="text-lg text-primary px-0 h-auto py-1">Register for an Account</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <footer className="mt-16 md:mt-24 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <p className="text-xs mt-1">Secure. Streamlined. Connected.</p>
        </footer>
      </div>
    );
  }

  // Fallback for initial render if user is authenticated but redirect hasn't happened yet.
  return (
     <div className="flex flex-col h-screen items-center justify-center bg-background p-8">
      <Building2 className="h-16 w-16 text-primary mb-6 animate-pulse" />
      <h1 className="text-4xl font-bold text-primary mb-4">{APP_NAME}</h1>
      <p className="text-lg text-foreground mb-8">Initializing...</p>
    </div>
  );
}
