import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/lib/auth-provider'; // To be created

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ResiGate - Visitor Management',
  description: 'ResiGate - Modern Visitor Management System for Residential Societies',
  icons: {
    icon: '/favicon.ico', // Fallback for .ico
    shortcut: '/favicon.png', // Or your preferred modern icon
    apple: '/apple-touch-icon.png', // For Apple devices
    // You can also specify different sizes if you have multiple icon versions
    // other: [
    //   {
    //     rel: 'icon',
    //     url: '/favicon-32x32.png',
    //     sizes: '32x32',
    //   },
    //   {
    //     rel: 'icon',
    //     url: '/favicon-16x16.png',
    //     sizes: '16x16',
    //   },
    // ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
