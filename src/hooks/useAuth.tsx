import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import React, {
  useEffect,
  useState,
  createContext,
  useContext,
  useMemo,
} from 'react';
import { client } from '../db';
import { Profile } from '../models/profile';
import { CallsManagerProvider } from '../utils/calls_manager';
import { useUpdateState } from './useUpdateState';

export interface AuthState {
  state: AuthChangeEvent;
  session: Session | null;
}

function _useAuth() {
  const [state, setState] = useState<AuthState>(() => {
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

const AuthContext = createContext<AuthState | null>(null);
const ProfileContext = createContext<Profile | null>(null);

export function AuthProvider({
  children,
}: {
  children: React.ReactElement | React.ReactElement[];
}) {
  const auth = _useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function ProfileProvider({
  children,
}: {
  children: () => React.ReactElement | React.ReactElement[];
}) {
  const updateState = useUpdateState();
  const auth = _useAuth();
  const profile = useMemo(() => new Profile(), []);

  useEffect(() => {
    profile.addListener(updateState);

    return () => {
      profile.dispose();
    };
  }, [profile, updateState]);

  useEffect(() => {
    if (auth.session?.user?.id) {
      profile.uid = auth.session.user.id;
    }

    return () => {
      profile.uid = null;
    };
  }, [auth.session?.user?.id, profile]);

  return (
    <ProfileContext.Provider value={profile}>
      {children()}
    </ProfileContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext)!;
}

export function useProfile() {
  return useContext(ProfileContext)!;
}
