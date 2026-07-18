import { useEffect, useRef } from 'react';
import type { BotLogLine } from '@/platform';

interface BotProcessLogPanelProps {
  logs: BotLogLine[];
}

export default function BotProcessLogPanel({ logs }: BotProcessLogPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs.length]);

  if (logs.length === 0) {
    return (
      <div
        className="rounded-lg p-3 text-center text-[11px] text-t-ghost"
        style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
      >
        No output yet.
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="max-h-40 overflow-y-auto rounded-lg p-3 font-mono text-[11px] leading-relaxed"
      style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
    >
      {logs.map((entry, i) => (
        <div key={i} className={entry.stream === 'stderr' ? 'text-red-400/80' : 'text-t-tertiary'}>
          {entry.line}
        </div>
      ))}
    </div>
  );
}
