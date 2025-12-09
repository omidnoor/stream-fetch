'use client';

/**
 * Session Provider Component
 *
 * Wraps the application with NextAuth's SessionProvider
 * to enable client-side session access.
 */

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
