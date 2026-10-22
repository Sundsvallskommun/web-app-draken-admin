import { type RichTextValue } from '@admin/resource-form-values';
import type { TextEditorProps } from '@sk-web-gui/text-editor';
import dynamic from 'next/dynamic';

const TextEditor = dynamic<TextEditorProps>(() => import('@sk-web-gui/text-editor').then((mod) => mod.TextEditor), {
  ssr: false,
  loading: () => (
    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">Laddar editor...</div>
  ),
});

/** Rich text editor for a FieldDef with `richTextTargets`; the value is `{ plainText, markup }` or a markup string. */
export function RichTextField({
  value,
  onChange,
  readOnly,
}: {
  value: unknown;
  onChange: (value: RichTextValue) => void;
  readOnly?: boolean;
}) {
  return (
    <TextEditor
      className="h-[420px] min-h-[320px] resize-y overflow-auto"
      value={
        typeof value === 'object' && value !== null ? (value as RichTextValue) : { markup: (value as string) ?? '' }
      }
      readOnly={readOnly}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
