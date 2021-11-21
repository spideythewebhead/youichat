import React from 'react';
import { AuthProvider, ProfileProvider } from '../hooks/useAuth';
import { CallsManagerProvider } from './calls_manager';
import { CacheDbProvider } from './web_db';

export function GlobalProvider({
  children,
}: {
  children: () => React.ReactElement | React.ReactElement[];
}) {
  return (
    <AuthProvider>
      <ProfileProvider>
        {() => (
          <CallsManagerProvider>
            <CacheDbProvider>{children()}</CacheDbProvider>
          </CallsManagerProvider>
        )}
      </ProfileProvider>
    </AuthProvider>
  );
}
