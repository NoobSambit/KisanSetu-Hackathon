/**
 * Login Page (Phase 2)
 *
 * Allows existing users to sign in with email and password.
 * Redirects to dashboard after successful login.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/firebase/auth';
import { useAuth } from '@/lib/context/AuthContext';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    const { user: signedInUser, error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError);
      setLoading(false);
      return;
    }

    if (signedInUser) {
      router.push('/dashboard');
    }
  };

  if (authLoading) return null; // Or a spinner
  if (user) return null;

  return (
    <div className="min-h-screen pt-20 pb-12 flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

      <Container size="sm" className="relative z-10 w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-md p-8 md:p-10 rounded-3xl shadow-xl border border-white/50 animate-slide-up">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">👋</div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Welcome Back</h1>
            <p className="text-neutral-500">Enter your details to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2 ml-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="name@example.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 flex items-center animate-fade-in">
                <span className="mr-2">⚠️</span> {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full text-lg shadow-lg shadow-primary-500/20 mt-2"
              disabled={loading}
              isLoading={loading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
            <p className="text-neutral-500 text-sm">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary-600 font-bold hover:text-primary-700 transition-colors">
                Create one now
              </Link>
            </p>
            <div className="mt-4">
              <Link href="/" className="text-xs text-neutral-400 hover:text-neutral-600">Back to Home</Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
