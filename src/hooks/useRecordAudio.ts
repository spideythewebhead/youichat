import { useCallback } from 'react';

export function useMicrophonePermission() {
  const requestPermission = useCallback(() => {
    return (navigator.mediaDevices ?? navigator).getUserMedia({
      audio: true,
      video: false,
    });
  }, []);

  return requestPermission;
}

export function useCameraPermission() {
  const requestPermission = useCallback(() => {
    return (navigator.mediaDevices ?? navigator).getUserMedia({
      audio: true,
      video: true,
    });
  }, []);

  return requestPermission;
}
