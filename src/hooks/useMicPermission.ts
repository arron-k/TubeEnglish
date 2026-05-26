'use client';

import { useState, useCallback, useEffect } from 'react';

export type MicPermissionState = 'unknown' | 'granted' | 'denied' | 'prompt';

export function useMicPermission() {
  const [permissionState, setPermissionState] = useState<MicPermissionState>('unknown');

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) return;

    navigator.permissions
      .query({ name: 'microphone' as PermissionName })
      .then((result) => {
        setPermissionState(result.state as MicPermissionState);
        result.addEventListener('change', () => {
          setPermissionState(result.state as MicPermissionState);
        });
      })
      .catch(() => setPermissionState('unknown'));
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionState('granted');
      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setPermissionState('denied');
      }
      return false;
    }
  }, []);

  return { permissionState, requestPermission };
}
