import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getToken, decodeToken } from '../services/auth';
import { useStore } from '../store';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, setAuthenticated, setUser } = useStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === 'login';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/pos');
    }
  }, [isAuthenticated, segments, isReady]);

  async function checkAuth() {
    const token = await getToken();
    if (token) {
      const payload = decodeToken(token);
      if (payload) {
        setUser({
          id: payload.sub as string,
          email: payload.email as string,
          name: (payload.name as string) || (payload.email as string),
          role: (payload.role as any)?.name || (payload.role as string) || '',
        });
        setAuthenticated(true);
      }
    }
    setIsReady(true);
  }

  if (!isReady) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      <Slot />
    </>
  );
}
