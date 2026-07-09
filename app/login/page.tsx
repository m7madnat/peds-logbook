'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError('Wrong passphrase. Try again.');
      return;
    }
    router.push(params.get('next') || '/');
    router.refresh();
  }

  return (
    <main className="flex-1 flex flex-col justify-center px-6 min-h-screen">
      <div className="mx-auto w-full max-w-sm animate-fade-up">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-raised2 border border-line flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"
                stroke="#34D399"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <circle cx="12" cy="12" r="4.2" stroke="#34D399" strokeWidth="1.6" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Peds Anesthesia Logbook</h1>
          <p className="mt-1.5 text-sm text-muted">Private training log. No patient identifiers.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="password" className="sr-only">
            Passphrase
          </label>
          <input
            id="password"
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter passphrase"
            className="w-full rounded-xl2 bg-surface border border-line px-4 py-4 text-paper placeholder:text-subtle focus:border-mint focus:ring-1 focus:ring-mint/40 outline-none transition-colors"
          />
          {error && (
            <p className="text-rose text-sm" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading || !password} size="lg" className="w-full">
            {loading ? 'Checking…' : 'Unlock'}
          </Button>
        </form>
      </div>
    </main>
  );
}
