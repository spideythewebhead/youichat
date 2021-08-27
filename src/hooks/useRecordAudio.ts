import { useCallback } from 'react';

export function useMicrophonePermission() {
  const requestPermission = useCallback(() => {
    return new Promise<MediaStream>((res, rej) => {
      navigator.getUserMedia(
        {
          audio: true,
          video: false,
        },
        (stream) => {
          res(stream);
        },
        (error) => {
          rej(error);
        }
      );
    });
  }, []);

  return requestPermission;
}
