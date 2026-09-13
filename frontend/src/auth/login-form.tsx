'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, ErrorState, Field, Input } from '@/ui';
import { useAuth } from './auth-provider';
import { loginErrorMessage } from './login-errors';
import { redirectAfterLogin } from './routing';

export function LoginForm() {
  const router = useRouter();
  const { status, session, login } = useAuth();
  const [username, setUsername] = useState('local');
  const [password, setPassword] = useState('secret');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirect = redirectAfterLogin(status, Boolean(session));
    if (redirect) router.replace(redirect);
  }, [router, session, status]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login({ username, password });
      router.replace('/');
    } catch (cause) {
      setError(loginErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
      <Card className="w-full">
        <CardHeader>
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-action">FocusFlow</p>
            <CardTitle className="mt-4 text-2xl">Sign in</CardTitle>
            <CardDescription>Use the configured account to open your workspace.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={submit}>
            <Field label="Username">
              <Input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} />
            </Field>
            <Field label="Password">
              <Input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </Field>
            {error ? <ErrorState title="Could not sign in" description={error} /> : null}
            <Button type="submit" disabled={submitting || status === 'loading'}>
              {submitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
