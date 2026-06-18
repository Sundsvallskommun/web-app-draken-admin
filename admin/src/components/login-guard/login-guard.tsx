import { useUserStore } from '@services/user-service/user-service';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

const LoaderFullScreen = () => (
  <div className="flex min-h-screen w-full items-center justify-center bg-background text-muted-foreground">
    <Loader2 className="size-8 animate-spin" />
  </div>
);

export const LoginGuard: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const user = useUserStore(useShallow((s) => s.user));
  const getMe = useUserStore(useShallow((s) => s.getMe));

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMe().finally(() => {
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading || (!user.name && !router.pathname.includes('/login'))) {
    return <LoaderFullScreen />;
  }

  // Routes by permissions
  if (!user?.permissions?.canUseAdminPanel && router.asPath !== '/login') {
    router.push('/login');
  }

  return <>{children}</>;
};

export default LoginGuard;
