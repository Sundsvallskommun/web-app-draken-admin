import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import * as React from 'react';

// Monaco is client-only and heavy; load it lazily (mirrors the real templates
// editor, which uses @monaco-editor/react).
const Editor = dynamic(() => import('@monaco-editor/react').then((m) => m.Editor), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">Laddar editor…</div>
  ),
});

export function MonacoField({
  value,
  onChange,
  language = 'markdown',
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  language?: string;
  disabled?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <div className="overflow-hidden rounded-md border">
      <Editor
        height="320px"
        language={language}
        value={value}
        onChange={(v) => onChange(v ?? '')}
        theme={mounted && resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          readOnly: disabled,
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  );
}
