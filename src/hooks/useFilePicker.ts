import { useCallback } from 'react';

export function useFilePicker() {
  const pickFile = useCallback((extensions: RegExp) => {
    return new Promise<File | null>((res, rej) => {
      const input = document.createElement('input');
      input.type = 'file';
      // input.accept = '.jpeg,.png';
      input.className = 'hidden';

      input.addEventListener('change', (e) => {
        if (extensions.test(input.files![0].name)) {
          res(input.files![0]);
        }
      });

      function onBodyFocus() {
        input.remove();
        window.removeEventListener('focus', onBodyFocus);
      }

      window.addEventListener('focus', onBodyFocus);

      document.body.append(input);

      queueMicrotask(() => input.click());
    });
  }, []);

  return pickFile;
}
