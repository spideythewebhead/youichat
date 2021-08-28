import { DependencyList, useEffect, useState } from 'react';

interface UsePromiseState<T> {
  data?: T;
  error?: any;
}

export function usePromise<T>(promise: Promise<T> | null) {
  const [state, setState] = useState<UsePromiseState<T>>({});

  useEffect(() => {
    if (!promise) {
      setState({});
    }

    let mounted = true;

    promise
      ?.then((data) => {
        if (!mounted) return;

        setState({ data });
      })
      ?.catch((error) => {
        setState({ error });
      });

    return () => {
      mounted = false;
    };
  }, [promise]);

  return state;
}
