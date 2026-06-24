import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { apiURL } from '@utils/api-url';
import { appURL } from '@utils/app-url';
import { LogIn } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const appName = process.env.NEXT_PUBLIC_APP_NAME;

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const failMessage = params.get('failMessage');
    if (failMessage && failMessage !== 'NOT_AUTHORIZED') {
      setError(failMessage === 'NOT_AUTHORIZED' ? 'Du saknar behörighet.' : 'Inloggningen misslyckades. Försök igen.');
    } else if (failMessage === 'NOT_AUTHORIZED') {
      setError('Du saknar behörighet till adminpanelen.');
    }
  }, []);

  const onLogin = () => {
    let path = (router.query.path as string) || new URLSearchParams(window.location.search).get('path') || '';
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
    if (typeof path === 'string' && !path.startsWith(base)) path = base + path;

    const url = new URL(apiURL('/saml/login'));
    url.search = new URLSearchParams({
      successRedirect: `${appURL(path)}`,
      failureRedirect: `${appURL()}/login`,
    }).toString();
    window.location.href = url.toString();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardDescription>Admin för</CardDescription>
          <CardTitle className="text-2xl">{appName}</CardTitle>
          <CardDescription>Logga in med ditt konto för att fortsätta.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={onLogin} data-cy="loginButton" className="w-full">
            <LogIn className="size-4" />
            Logga in
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </main>
  );
}
