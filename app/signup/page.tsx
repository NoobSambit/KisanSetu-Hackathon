/**
 * Sign Up Page (Phase 2)
 *
 * Allows new users to create an account with email and password.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/firebase/auth';
import { useAuth } from '@/lib/context/AuthContext';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';

export default function SignUpPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    const { user: newUser, error: signUpError } = await signUp(
      email,
      password,
      name || undefined
    );

    if (signUpError) {
      setError(signUpError);
      setLoading(false);
      return;
    }

    if (newUser) {
      router.push('/dashboard');
    }
  };

  if (authLoading || user) return null;

  return (
    <div className="min-h-screen pt-20 pb-12 flex items-center justify-center bg-gradient-to-br from-accent-50 via-white to-primary-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-accent-200/20 rounded-full blur-3xl translate-y-[-20%] translate-x-[-20%]"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl translate-y-[20%] translate-x-[20%]"></div>

      <Container size="sm" className="relative z-10 w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-md p-8 md:p-10 rounded-3xl shadow-xl border border-white/50 animate-slide-up">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🚀</div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Join KisanSetu</h1>
            <p className="text-neutral-500">Start your smart farming journey today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-1 ml-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="Your Name"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-1 ml-1">Email</label>
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
              <label className="block text-sm font-bold text-neutral-700 mb-1 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="Min. 6 characters"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-1 ml-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-5 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="Re-enter password"
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
              variant="primary"
              className="w-full text-lg shadow-lg shadow-primary-500/20 mt-4"
              disabled={loading}
              isLoading={loading}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
            <p className="text-neutral-500 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-600 font-bold hover:text-primary-700 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
