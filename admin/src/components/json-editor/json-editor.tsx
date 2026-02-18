import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface JsonEditorProps {
  value: Record<string, unknown> | string;
  onChange: (value: Record<string, unknown>) => void;
  height?: string;
  readOnly?: boolean;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({ value, onChange, height = '400px', readOnly = false }) => {
  const [error, setError] = useState<string | null>(null);

  const stringValue = typeof value === 'string' ? value : JSON.stringify(value, null, 2);

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      if (!newValue) return;

      try {
        const parsed = JSON.parse(newValue);
        setError(null);
        onChange(parsed);
      } catch {
        setError('Ogiltig JSON');
      }
    },
    [onChange]
  );

  return (
    <div className="json-editor-container">
      {error && <div className="text-error-text-primary text-sm mb-2 p-2 bg-error-surface-primary rounded">{error}</div>}
      <div className="border border-divider rounded overflow-hidden">
        <MonacoEditor
          height={height}
          language="json"
          value={stringValue}
          onChange={handleChange}
          options={{
            readOnly,
            minimap: { enabled: false },
            automaticLayout: true,
            formatOnPaste: true,
            formatOnType: true,
            scrollBeyondLastLine: false,
            fontSize: 14,
            tabSize: 2,
            wordWrap: 'on',
          }}
          theme="vs-dark"
        />
      </div>
    </div>
  );
};

export default JsonEditor;
