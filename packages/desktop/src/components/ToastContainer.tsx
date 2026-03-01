import { useToastStore } from '@/stores/useToastStore';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

const colors = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  info: 'text-blue-400',
} as const;

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className="animate-in slide-in-from-right flex items-center gap-2.5 rounded-xl border px-4 py-2.5 shadow-xl backdrop-blur-md"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--glass-border)',
              animation: 'slideInRight 0.25s ease-out',
            }}
          >
            <Icon size={16} className={colors[t.type]} />
            <span className="text-[13px] text-t-secondary">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="ml-2 text-t-ghost transition-colors hover:text-t-secondary"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
