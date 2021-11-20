import { useEffect, useState } from 'react';

export function useHasWindowFocus() {
  const [state, setState] = useState(false);

  useEffect(() => {
    function onBlur() {
      setState(false);
    }

    function onFocus() {
      setState(true);
    }

    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  });

  return state;
}
