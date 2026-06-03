import { useEffect, useState } from 'react';
import { onToast, type ToastItem } from '../lib/toast';

export function Toaster() {
  const [toasts, setToasts] = useState<(ToastItem & { leaving?: boolean })[]>([]);

  useEffect(() => {
    return onToast(t => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => {
        setToasts(prev => prev.map(x => x.id === t.id ? { ...x, leaving: true } : x));
        setTimeout(() => {
          setToasts(prev => prev.filter(x => x.id !== t.id));
        }, 300);
      }, t.duration || 4000);
    });
  }, []);

  if (toasts.length === 0) return null;

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const colors = {
    success: 'border-emerald-500/40 bg-emerald-500/10',
    error: 'border-red-500/40 bg-red-500/10',
    info: 'border-blue-500/40 bg-blue-500/10',
    warning: 'border-yellow-500/40 bg-yellow-500/10',
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto backdrop-blur-lg border rounded-xl p-4 shadow-2xl ${colors[t.type]} ${
            t.leaving ? 'animate-toast-out' : 'animate-toast-in'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5">{icons[t.type]}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-white">{t.title}</div>
              {t.message && <div className="text-xs text-slate-300 mt-0.5">{t.message}</div>}
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="text-slate-400 hover:text-white text-lg leading-none"
            >×</button>
          </div>
          <div className="mt-2 h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full bg-white/30`} style={{ animation: `progress-bar ${t.duration || 4000}ms linear forwards` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
