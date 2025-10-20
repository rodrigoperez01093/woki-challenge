'use client';

import Toast from '../ui/Toast';
import { useToastStore } from '@/app/hooks/useToast';

export default function ToastProvider() {
  const toast = useToastStore((state) => state.toast);
  const hideToast = useToastStore((state) => state.hideToast);

  if (!toast) return null;

  return (
    <Toast message={toast.message} type={toast.type} onClose={hideToast} />
  );
}
