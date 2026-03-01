import { useMemo, useState, type ComponentProps } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

/**
 * Pre-process Discord-specific markdown syntax before passing to react-markdown.
 *
 * Handles:
 * - Spoilers:  ||text||  → rendered as an interactive spoiler span
 * - User/role/channel mentions:  <@id>, <@!id>, <@&id>, <#id>
 * - Custom emoji:  <:name:id>, <a:name:id>
 * - Underline: __text__  (Discord uses this for underline, not bold-italic)
 *
 * Since react-markdown doesn't natively understand these, we convert them
 * to custom HTML-friendly markers or standard markdown equivalents.
 */

// ── Spoiler component ───────────────────────────────────────────────
function Spoiler({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => setRevealed((v) => !v)}
      onKeyDown={(e) => e.key === 'Enter' && setRevealed((v) => !v)}
      className={cn(
        'cursor-pointer rounded-[3px] px-0.5 transition-all duration-200',
        revealed
          ? 'bg-[var(--glass-bg-md)] text-t-secondary'
          : 'bg-[var(--text-faint)] text-transparent select-none',
      )}
    >
      {children}
    </span>
  );
}

// ── Pre-processing ──────────────────────────────────────────────────

/** Replace Discord-specific syntax with markdown-safe equivalents */
function preprocessDiscordMarkdown(text: string): string {
  let result = text;

  // Convert Discord underline __text__ to <u>text</u> (HTML passthrough)
  // Must be done before react-markdown sees it (which would treat it as bold)
  result = result.replace(/__([^_]+?)__/g, '<u>$1</u>');

  // Convert custom emoji <:name:id> and <a:name:id> to just :name:
  result = result.replace(/<a?:(\w+):\d+>/g, ':$1:');

  // Convert user mentions <@id> or <@!id>
  result = result.replace(/<@!?(\d+)>/g, '`@user`');

  // Convert role mentions <@&id>
  result = result.replace(/<@&(\d+)>/g, '`@role`');

  // Convert channel mentions <#id>
  result = result.replace(/<#(\d+)>/g, '`#channel`');

  return result;
}

/** Split text by spoiler markers (||text||) so we can render them as components */
function splitSpoilers(text: string): Array<{ type: 'text' | 'spoiler'; content: string }> {
  const parts: Array<{ type: 'text' | 'spoiler'; content: string }> = [];
  const regex = /\|\|(.+?)\|\|/gs;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'spoiler', content: match[1] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
}

// ── Main component ──────────────────────────────────────────────────

interface DiscordMarkdownProps {
  content: string;
  /** Additional class names for the wrapper */
  className?: string;
  /** Text size class, defaults to text-[13px] */
  sizeClass?: string;
}

export default function DiscordMarkdown({
  content,
  className,
  sizeClass = 'text-[13px]',
}: DiscordMarkdownProps) {
  const segments = useMemo(() => splitSpoilers(content), [content]);

  return (
    <span className={cn('discord-markdown', className)}>
      {segments.map((seg, i) =>
        seg.type === 'spoiler' ? (
          <Spoiler key={i}>
            <MarkdownSegment content={seg.content} sizeClass={sizeClass} inline />
          </Spoiler>
        ) : (
          <MarkdownSegment key={i} content={seg.content} sizeClass={sizeClass} />
        ),
      )}
    </span>
  );
}

// ── Markdown segment (renders a chunk through react-markdown) ───────

function MarkdownSegment({
  content,
  sizeClass,
  inline,
}: {
  content: string;
  sizeClass: string;
  inline?: boolean;
}) {
  const processed = useMemo(() => preprocessDiscordMarkdown(content), [content]);

  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      allowedElements={[
        'p', 'strong', 'em', 'del', 'code', 'pre', 'a',
        'br', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3',
        'u', 'hr',
      ]}
      unwrapDisallowed
      skipHtml={false}
      components={{
        // Paragraphs – avoid extra block spacing; use spans when inline
        p: ({ children, ...props }: ComponentProps<'p'>) =>
          inline ? (
            <span {...(props as ComponentProps<'span'>)}>{children}</span>
          ) : (
            <p className={cn('whitespace-pre-wrap break-words leading-[1.4] text-t-secondary', sizeClass)} {...props}>
              {children}
            </p>
          ),

        // Bold
        strong: ({ children, ...props }: ComponentProps<'strong'>) => (
          <strong className="font-semibold text-t-primary" {...props}>{children}</strong>
        ),

        // Italic
        em: ({ children, ...props }: ComponentProps<'em'>) => (
          <em className="italic" {...props}>{children}</em>
        ),

        // Strikethrough
        del: ({ children, ...props }: ComponentProps<'del'>) => (
          <del className="line-through text-t-faint" {...props}>{children}</del>
        ),

        // Inline code
        code: ({ children, className: codeClassName, ...props }: ComponentProps<'code'>) => {
          // If inside a <pre> (code block), react-markdown wraps it with a language class
          const isBlock = codeClassName?.startsWith('language-');
          if (isBlock) {
            return (
              <code className={cn('block text-[12px]', codeClassName)} {...props}>
                {children}
              </code>
            );
          }
          return (
            <code
              className="rounded-[3px] px-1 py-0.5 text-[12px] text-t-primary"
              style={{ background: 'var(--glass-bg-md)', border: '1px solid var(--glass-border)' }}
              {...props}
            >
              {children}
            </code>
          );
        },

        // Code block wrapper
        pre: ({ children, ...props }: ComponentProps<'pre'>) => (
          <pre
            className="my-1 overflow-x-auto rounded-md p-2.5 text-[12px] leading-[1.5] text-t-secondary"
            style={{ background: 'var(--glass-bg-md)', border: '1px solid var(--glass-border)' }}
            {...props}
          >
            {children}
          </pre>
        ),

        // Links
        a: ({ children, href, ...props }: ComponentProps<'a'>) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: 'var(--accent)' }}
            {...props}
          >
            {children}
          </a>
        ),

        // Blockquote
        blockquote: ({ children, ...props }: ComponentProps<'blockquote'>) => (
          <blockquote
            className="my-0.5 pl-3 text-t-secondary"
            style={{ borderLeft: '3px solid var(--glass-border-md)' }}
            {...props}
          >
            {children}
          </blockquote>
        ),

        // Lists
        ul: ({ children, ...props }: ComponentProps<'ul'>) => (
          <ul className="my-0.5 list-inside list-disc text-t-secondary" {...props}>{children}</ul>
        ),
        ol: ({ children, ...props }: ComponentProps<'ol'>) => (
          <ol className="my-0.5 list-inside list-decimal text-t-secondary" {...props}>{children}</ol>
        ),
        li: ({ children, ...props }: ComponentProps<'li'>) => (
          <li className={cn('leading-[1.4]', sizeClass)} {...props}>{children}</li>
        ),

        // Headings – Discord renders these smaller than typical markdown
        h1: ({ children, ...props }: ComponentProps<'h1'>) => (
          <h1 className="mt-1 text-[15px] font-bold text-t-primary" {...props}>{children}</h1>
        ),
        h2: ({ children, ...props }: ComponentProps<'h2'>) => (
          <h2 className="mt-1 text-[14px] font-bold text-t-primary" {...props}>{children}</h2>
        ),
        h3: ({ children, ...props }: ComponentProps<'h3'>) => (
          <h3 className="mt-0.5 text-[13px] font-bold text-t-primary" {...props}>{children}</h3>
        ),

        // Horizontal rule
        hr: (props: ComponentProps<'hr'>) => (
          <hr className="my-1 border-[var(--glass-border)]" {...props} />
        ),
      }}
    >
      {processed}
    </Markdown>
  );
}
