// Simple event-based toast system
export type ToastType = 'success' | 'error' | 'info' | 'warning';
export type ToastItem = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
};

const listeners = new Set<(t: ToastItem) => void>();

export function onToast(cb: (t: ToastItem) => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

function emit(type: ToastType, title: string, message?: string, duration = 4000) {
  const t: ToastItem = { id: Math.random().toString(36).slice(2), type, title, message, duration };
  listeners.forEach(cb => cb(t));
}

export const toast = {
  success: (title: string, message?: string) => emit('success', title, message),
  error: (title: string, message?: string) => emit('error', title, message),
  info: (title: string, message?: string) => emit('info', title, message),
  warning: (title: string, message?: string) => emit('warning', title, message),
};
