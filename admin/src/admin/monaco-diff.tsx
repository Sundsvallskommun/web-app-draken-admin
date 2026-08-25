import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import * as React from 'react';

// Monaco is client-only and heavy; load lazily, mirroring monaco-field.tsx.
const DiffEditor = dynamic(() => import('@monaco-editor/react').then((m) => m.DiffEditor), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">Laddar editor…</div>
  ),
});

const Editor = dynamic(() => import('@monaco-editor/react').then((m) => m.Editor), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">Laddar editor…</div>
  ),
});

function useMonacoTheme() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted && resolvedTheme === 'dark' ? 'vs-dark' : 'light';
}

/** Side-by-side, read-only diff with syntax + change highlighting. */
export function MonacoDiff({
  original,
  modified,
  language = 'html',
  height = '60vh',
}: {
  original: string;
  modified: string;
  language?: string;
  height?: string;
}) {
  const theme = useMonacoTheme();
  return (
    <div className="overflow-hidden rounded-md border">
      <DiffEditor
        height={height}
        language={language}
        original={original}
        modified={modified}
        theme={theme}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          wordWrap: 'on',
          renderSideBySide: true,
        }}
      />
    </div>
  );
}

/** Single read-only editor (for viewing one environment's content). */
export function MonacoView({
  value,
  language = 'html',
  height = '60vh',
}: {
  value: string;
  language?: string;
  height?: string;
}) {
  const theme = useMonacoTheme();
  return (
    <div className="overflow-hidden rounded-md border">
      <Editor
        height={height}
        language={language}
        value={value}
        theme={theme}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          wordWrap: 'on',
        }}
      />
    </div>
  );
}
