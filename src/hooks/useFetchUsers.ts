import { useEffect, useState } from 'react';
import { client } from '../db';
import { AppUser } from '../models/user';
import { useMounted } from './useMounted';

export function useFetchUsers(uid: string) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [error, setError] = useState<any>(null);

  const isMounted = useMounted();

  useEffect(() => {
    if (!uid) return;

    client
      .from('users')
      .select('id,nickname,image_url')
      .neq('id', uid)
      .then(({ data, error }) => {
        if (!isMounted()) return;

        if (data) {
          setUsers((data as Array<any>).map((user) => new AppUser(user)));
        }

        if (error) {
          setError(error);
        }
      });
  }, [isMounted, uid]);

  useEffect(() => {
    const subscription = client
      .from<AppUser>('users')
      .on('INSERT', (payload) => {
        const user = new AppUser(payload.new);
        setUsers((u) => [...u, user]);
      })
      .subscribe();

    return () => {
      client.removeSubscription(subscription);
    };
  }, []);

  return {
    users,
    error,
  };
}
