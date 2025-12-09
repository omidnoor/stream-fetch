'use client';

/**
 * Sign In Page
 *
 * Handles user authentication with email/password.
 */

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setFormError('Invalid email or password');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setFormError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Logo */}
      <div className="text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))]">
            <span className="text-xl font-bold text-white">S</span>
          </div>
          <span className="text-xl font-bold text-foreground">StreamFetch</span>
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>
        <p className="mt-2 text-muted-foreground">
          Sign in to your account
        </p>
      </div>

      <div className="card-elevated p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {(error || formError) && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {formError || 'Authentication failed. Please try again.'}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="input-field"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="input-field"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>

      <p className="text-center text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href="/auth/signup"
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

function SignInLoading() {
  return (
    <div className="w-full max-w-md space-y-8 animate-pulse">
      <div className="text-center">
        <div className="h-10 w-10 bg-muted rounded-lg mx-auto mb-6" />
        <div className="h-9 w-40 bg-muted rounded mx-auto" />
        <div className="h-5 w-48 bg-muted rounded mx-auto mt-2" />
      </div>
      <div className="card-elevated p-6 space-y-4">
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Suspense fallback={<SignInLoading />}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
