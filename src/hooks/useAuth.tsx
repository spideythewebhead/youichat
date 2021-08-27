import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import React, {
  useEffect,
  useState,
  createContext,
  useContext,
  useMemo,
} from 'react';
import { client } from '../db';
import { ProfileNotifier } from '../models/profile';
import { useUpdateState } from './useUpdateState';

export interface LogState {
  state: AuthChangeEvent;
  session: Session | null;
}

export function useAuth() {
  const [state, setState] = useState<LogState>(() => {
    const session = client.auth.session();

    return {
      session,
      state: session ? 'SIGNED_IN' : 'SIGNED_OUT',
    };
  });

  useEffect(() => {
    const { data: subscription } = client.auth.onAuthStateChange(
      (event, session) => {
        setState({
          state: event,
          session,
        });
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return state;
}

const LogStateContext = createContext<LogState | null>(null);
const ProfileNotifierContext = createContext<ProfileNotifier | null>(null);

export function GlobalProvider({
  children,
}: {
  children: () => React.ReactElement | React.ReactElement[];
}) {
  const updateState = useUpdateState();
  const authState = useAuth();

  const profileNotifier = useMemo(() => new ProfileNotifier(), []);

  useEffect(() => {
    profileNotifier.addListener(updateState);

    return () => {
      profileNotifier.dispose();
    };
  }, [profileNotifier, updateState]);

  useEffect(() => {
    if (authState.session?.user?.id) {
      profileNotifier.uid = authState.session?.user?.id;
    }
  }, [authState.session?.user?.id, profileNotifier]);

  return (
    <ProfileNotifierContext.Provider value={profileNotifier}>
      <LogStateContext.Provider value={authState}>
        {children()}
      </LogStateContext.Provider>
    </ProfileNotifierContext.Provider>
  );
}

export function useLogState() {
  return useContext(LogStateContext)!;
}

export function useProfileNotifier() {
  return useContext(ProfileNotifierContext)!;
}
