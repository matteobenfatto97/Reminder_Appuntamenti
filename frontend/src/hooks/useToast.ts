import { useCallback, useEffect, useState } from 'react';

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [type, setType] = useState<'success' | 'error'>('success');

  const showToast = useCallback((nextMessage: string, nextType: 'success' | 'error' = 'success') => {
    setMessage(nextMessage);
    setType(nextType);
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 3500);
    return () => window.clearTimeout(timer);
  }, [message]);

  return { message, type, showToast };
}
