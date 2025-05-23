import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Chrome, ArrowLeft } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSignupSuccess(false);
    setResetSuccess(false);

    try {
      if (mode === 'signup') {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });

        if (error) throw error;

        // Check if user already exists
        if (data?.user?.identities?.length === 0) {
          throw new Error('This email is already registered. Please sign in instead.');
        }

        setSignupSuccess(true);
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;
        setResetSuccess(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
    }
  };

  const renderForm = () => {
    if (mode === 'forgot') {
      return (
        <div className="space-y-4">
          <button
            onClick={() => {
              setMode('signin');
              setError(null);
              setResetSuccess(false);
            }}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </button>

          <p className="text-gray-600 mb-4">
            Enter your email address and we'll send you a link to login without password.
          </p>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <button
            onClick={handleAuth}
            disabled={loading || resetSuccess}
            className="w-full bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Sign In Link'}
          </button>
        </div>
      );
    }

    return (
      <>
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 rounded-md py-2 px-4 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 mb-4"
        >
          <Chrome className="w-5 h-5" />
          Continue with Google
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading || signupSuccess}
            className="w-full bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>

          {mode === 'signin' && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setError(null);
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Login Without Password
              </button>
            </div>
          )}

          <div className="mt-4 text-center">
            {mode === 'signin' ? (
              <button
                onClick={() => {
                  setMode('signup');
                  setSignupSuccess(false);
                  setError(null);
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Don't have an account? Sign Up
              </button>
            ) : (
              <button
                onClick={() => {
                  setMode('signin');
                  setSignupSuccess(false);
                  setError(null);
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Already have an account? Sign In
              </button>
            )}
          </div>
        </form>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Reset Password'}
        </h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {signupSuccess && (
          <div className="bg-green-50 text-green-600 p-3 rounded-md mb-4">
            Success! Please check your email for a confirmation link.
          </div>
        )}

        {resetSuccess && (
          <div className="bg-green-50 text-green-600 p-3 rounded-md mb-4">
            Link sent! Please check your email.
          </div>
        )}

        {renderForm()}
      </div>
    </div>
  );
}