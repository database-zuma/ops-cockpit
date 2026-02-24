'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors } from '@/lib/design-tokens';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError('Invalid password');
        setPassword('');
        setLoading(false);
        return;
      }

      router.push('/');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: colors.panel.bg }}
    >
      <div className="w-full max-w-md px-6">
        {/* Title */}
        <div className="mb-12 text-center">
          <h1
            className="text-3xl font-bold tracking-wider mb-2"
            style={{
              fontFamily: 'var(--font-mono)',
              color: colors.accent.primary,
            }}
          >
            ZUMA OPS
          </h1>
          <p
            className="text-sm tracking-widest"
            style={{ color: colors.text.secondary }}
          >
            COCKPIT
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="p-8 rounded-lg border"
          style={{
            backgroundColor: colors.surface['100'],
            borderColor: colors.panel.border,
          }}
        >
          {/* Password Input */}
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-3"
              style={{ color: colors.text.primary }}
            >
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={loading}
              className="w-full px-4 py-3 rounded border transition-colors focus:outline-none focus:ring-2"
              style={{
                backgroundColor: colors.surface['200'],
                borderColor: colors.panel.border,
                color: colors.text.primary,
                '--tw-ring-color': colors.accent.primary,
              } as React.CSSProperties}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="mb-6 p-3 rounded text-sm"
              style={{
                backgroundColor: 'rgba(255, 51, 51, 0.1)',
                color: colors.rag.critical,
              }}
            >
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
            style={{
              backgroundColor: colors.accent.primary,
              color: colors.panel.bg,
              boxShadow: loading
                ? 'none'
                : `0 0 20px ${colors.accent.primary}40`,
            }}
          >
            {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
          </button>
        </form>

        {/* Footer */}
        <p
          className="text-center text-xs mt-8 tracking-wider"
          style={{ color: colors.text.muted }}
        >
          OPERATIONAL COMMAND CENTER
        </p>
      </div>
    </div>
  );
}
