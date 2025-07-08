// src/components/ui/theme-toggle.tsx
'use client';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '@/lib/auth-provider';


export function ThemeToggle() {
  const { user, fetchThemePreference, updateThemePreference } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });
  const [hasFetchedTheme, setHasFetchedTheme] = useState(false);

  // On mount, sync with server if logged in, but only once per user session
  useEffect(() => {
    if (user && !hasFetchedTheme) {
      fetchThemePreference().then((serverTheme) => {
        setTheme(serverTheme);
        if (serverTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', serverTheme);
        setHasFetchedTheme(true);
      });
    }
  }, [user, fetchThemePreference, hasFetchedTheme]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (user) updateThemePreference(newTheme);
  };

  return (
    <button
      aria-label="Toggle theme"
      onClick={toggleTheme}
      className="rounded-full p-2 border border-border bg-card hover:bg-muted transition-colors"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-blue-700" />}
    </button>
  );
}
