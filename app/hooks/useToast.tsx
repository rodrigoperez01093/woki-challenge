'use client';

import { create } from 'zustand';
import type { ToastType } from '../components/ui/Toast';

interface ToastState {
  message: string;
  type: ToastType;
  isVisible: boolean;
}

interface ToastStore {
  toast: ToastState | null;
  showToast: (message: string, type: ToastType) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toast: null,
  showToast: (message: string, type: ToastType) => {
    set({ toast: { message, type, isVisible: true } });
  },
  hideToast: () => {
    set({ toast: null });
  },
}));

export function useToast() {
  const { showToast } = useToastStore();

  return {
    success: (message: string) => showToast(message, 'success'),
    error: (message: string) => showToast(message, 'error'),
    warning: (message: string) => showToast(message, 'warning'),
    info: (message: string) => showToast(message, 'info'),
  };
}
