import { CompareDetail } from '@services/compare-service';
import { Button, Modal } from '@sk-web-gui/react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const MonacoDiffEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.DiffEditor),
  { ssr: false }
);

interface CompareDiffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  identifier: string;
  detail: CompareDetail;
  differences: string[];
}

type DiffTab = 'content' | 'metadata' | 'defaultValues';

const TAB_LABELS: Record<DiffTab, string> = {
  content: 'Innehåll',
  metadata: 'Metadata',
  defaultValues: 'Standardvärden',
};

export const CompareDiffDialog: React.FC<CompareDiffDialogProps> = ({
  isOpen,
  onClose,
  identifier,
  detail,
  differences,
}) => {
  const availableTabs = (['content', 'metadata', 'defaultValues'] as DiffTab[]).filter((t) =>
    differences.includes(t)
  );
  const [activeTab, setActiveTab] = useState<DiffTab>(availableTabs[0] || 'content');

  const getOriginal = (tab: DiffTab) => {
    switch (tab) {
      case 'content': return detail.localContent ?? '';
      case 'metadata': return detail.localMetadata ?? '';
      case 'defaultValues': return detail.localDefaultValues ?? '';
    }
  };

  const getModified = (tab: DiffTab) => {
    switch (tab) {
      case 'content': return detail.compareContent ?? '';
      case 'metadata': return detail.compareMetadata ?? '';
      case 'defaultValues': return detail.compareDefaultValues ?? '';
    }
  };

  const getLanguage = (tab: DiffTab) => {
    return tab === 'content' ? 'html' : 'json';
  };

  if (!isOpen) return null;

  return (
    <Modal show={isOpen} onClose={onClose} className="w-[90vw] max-w-[90vw]" label={`Diff: ${identifier}`}>
      <Modal.Content>
        <div className="flex flex-col gap-16">
          <div className="flex items-center gap-8">
            {availableTabs.map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'primary' : 'tertiary'}
                size="sm"
                onClick={() => setActiveTab(tab)}
              >
                {TAB_LABELS[tab]}
              </Button>
            ))}
          </div>

          <div className="flex justify-between px-4">
            <h2 className="text-lg font-bold">Produktion (denna miljö)</h2>
            <h2 className="text-lg font-bold">Test</h2>
          </div>

          <div className="border border-divider rounded overflow-hidden">
            <MonacoDiffEditor
              height="60vh"
              language={getLanguage(activeTab)}
              original={getOriginal(activeTab)}
              modified={getModified(activeTab)}
              theme="vs-dark"
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
        </div>
      </Modal.Content>
    </Modal>
  );
};
