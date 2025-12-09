'use client';

/**
 * User Menu Component
 *
 * Displays user info and sign out option when authenticated.
 */

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
    );
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/auth/signin">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            Sign In
          </Button>
        </Link>
        <Link href="/auth/signup">
          <Button size="sm">
            Sign Up
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm text-foreground hidden sm:inline">
          {session.user?.name || session.user?.email}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut({ callbackUrl: '/' })}
        className="text-muted-foreground hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
