import { useLayoutEffect, useMemo, useRef } from 'react';

export function useMounted() {
  const ref = useRef(true);
  const isMounted = useMemo(() => {
    return () => {
      return ref.current;
    };
  }, []);

  useLayoutEffect(() => {
    return () => {
      ref.current = false;
    };
  }, []);

  return isMounted;
}
