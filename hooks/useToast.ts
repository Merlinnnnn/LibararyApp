import { useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  message: string;
  type: ToastType;
  visible: boolean;
}

export const useToast = () => {
  const [toast, setToast] = useState<Toast>({
    message: '',
    type: 'info',
    visible: false,
  });

  const show = useCallback((message: string, type: ToastType = 'info') => {
    setToast({
      message,
      type,
      visible: true,
    });

    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  const hide = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  return {
    toast,
    show,
    hide,
  };
}; 