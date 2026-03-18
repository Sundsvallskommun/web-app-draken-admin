import { CompareDetail } from '@services/compare-service';
import { Button, Modal } from '@sk-web-gui/react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type ViewTab = 'content' | 'metadata' | 'defaultValues';

const TAB_LABELS: Record<ViewTab, string> = {
  content: 'Innehåll',
  metadata: 'Metadata',
  defaultValues: 'Standardvärden',
};

interface CompareViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  identifier: string;
  detail: CompareDetail;
}

export const CompareViewDialog: React.FC<CompareViewDialogProps> = ({
  isOpen,
  onClose,
  identifier,
  detail,
}) => {
  const allTabs: ViewTab[] = ['content', 'metadata', 'defaultValues'];
  const availableTabs = allTabs.filter((t) => {
    switch (t) {
      case 'content': return !!detail.compareContent;
      case 'metadata': return !!detail.compareMetadata;
      case 'defaultValues': return !!detail.compareDefaultValues;
    }
  });
  const [activeTab, setActiveTab] = useState<ViewTab>(availableTabs[0] || 'content');

  const getValue = (tab: ViewTab) => {
    switch (tab) {
      case 'content': return detail.compareContent ?? '';
      case 'metadata': return detail.compareMetadata ?? '';
      case 'defaultValues': return detail.compareDefaultValues ?? '';
    }
  };

  const getLanguage = (tab: ViewTab) => {
    return tab === 'content' ? 'html' : 'json';
  };

  if (!isOpen) return null;

  return (
    <Modal show={isOpen} onClose={onClose} className="w-[90vw] max-w-[90vw]" label={identifier}>
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

          <div className="border border-divider rounded overflow-hidden">
            <MonacoEditor
              height="60vh"
              language={getLanguage(activeTab)}
              value={getValue(activeTab)}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                wordWrap: 'on',
              }}
            />
          </div>
        </div>
      </Modal.Content>
    </Modal>
  );
};
