import { CompareItem } from '@services/compare-service';
import { Button, FormControl, FormLabel, Icon, Modal, Select, Spinner, Textarea } from '@sk-web-gui/react';
import { AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const MonacoDiffEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.DiffEditor),
  { ssr: false }
);

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type ViewTab = 'content' | 'metadata' | 'defaultValues';

const TAB_LABELS: Record<ViewTab, string> = {
  content: 'Innehåll',
  metadata: 'Metadata',
  defaultValues: 'Standardvärden',
};

export type SyncType = 'create' | 'update';

export interface SyncData {
  identifier: string;
  name: string;
  content: string;
  metadata: string;
  defaultValues: string;
  versionIncrement: 'MAJOR' | 'MINOR';
  changeLog: string;
}

interface CompareSyncDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: SyncData) => void;
  item: CompareItem | null;
  syncType: SyncType;
  syncing: boolean;
}

export const CompareSyncDialog: React.FC<CompareSyncDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  item,
  syncType,
  syncing,
}) => {
  const [versionIncrement, setVersionIncrement] = useState<'MAJOR' | 'MINOR'>('MAJOR');
  const [changeLog, setChangeLog] = useState('');
  const [activeTab, setActiveTab] = useState<ViewTab>('content');

  const detail = item?.detail;

  const handleConfirm = () => {
    if (!item || !detail) return;
    onConfirm({
      identifier: item.identifier,
      name: item.name ?? item.identifier,
      content: detail.compareContent ?? '',
      metadata: detail.compareMetadata ?? '[]',
      defaultValues: detail.compareDefaultValues ?? '[]',
      versionIncrement,
      changeLog,
    });
  };

  const handleClose = () => {
    setChangeLog('');
    setVersionIncrement('MAJOR');
    setActiveTab('content');
    onClose();
  };

  if (!isOpen || !item || !detail) return null;

  const isUpdate = syncType === 'update';
  const operationLabel = isUpdate ? 'Uppdatera befintlig mall' : 'Skapa ny mall';

  const availableTabs: ViewTab[] = ['content', 'metadata', 'defaultValues'].filter((t) => {
    const tab = t as ViewTab;
    if (isUpdate) {
      return !!(detail.compareContent || detail.localContent) && tab === 'content'
        || !!(detail.compareMetadata || detail.localMetadata) && tab === 'metadata'
        || !!(detail.compareDefaultValues || detail.localDefaultValues) && tab === 'defaultValues';
    }
    switch (tab) {
      case 'content': return !!detail.compareContent;
      case 'metadata': return !!detail.compareMetadata;
      case 'defaultValues': return !!detail.compareDefaultValues;
    }
  }) as ViewTab[];

  const currentTab = availableTabs.includes(activeTab) ? activeTab : availableTabs[0] || 'content';

  const getCompareValue = (tab: ViewTab) => {
    switch (tab) {
      case 'content': return detail.compareContent ?? '';
      case 'metadata': return detail.compareMetadata ?? '';
      case 'defaultValues': return detail.compareDefaultValues ?? '';
    }
  };

  const getLocalValue = (tab: ViewTab) => {
    switch (tab) {
      case 'content': return detail.localContent ?? '';
      case 'metadata': return detail.localMetadata ?? '';
      case 'defaultValues': return detail.localDefaultValues ?? '';
    }
  };

  const getLanguage = (tab: ViewTab) => (tab === 'content' ? 'html' : 'json');

  return (
    <Modal show={isOpen} onClose={handleClose} className="w-[90vw] max-w-[90vw]" label={`Synkronisera: ${item.identifier}`}>
      <Modal.Content>
        <div className="flex flex-col gap-16">
          <div className="flex items-center gap-8">
            <span className="font-bold">{operationLabel}</span>
            <span className="text-secondary">— {item.identifier}</span>
          </div>

          <div className="flex items-start gap-12 rounded-lg border-2 border-orange-400 bg-orange-50 dark:bg-orange-950 p-16">
            <Icon icon={<AlertTriangle />} className="shrink-0 mt-2 text-orange-500" />
            <span className="font-bold">
              {isUpdate
                ? 'Detta kommer att uppdatera mallen i produktionsmiljön med innehållet från testmiljön. Den befintliga versionen skrivs över.'
                : 'Detta kommer att skapa en ny mall i produktionsmiljön baserat på innehållet från testmiljön.'}
            </span>
          </div>

          {availableTabs.length > 0 && (
            <>
              <div className="flex items-center gap-8">
                {availableTabs.map((tab) => (
                  <Button
                    key={tab}
                    variant={currentTab === tab ? 'primary' : 'tertiary'}
                    size="sm"
                    onClick={() => setActiveTab(tab)}
                  >
                    {TAB_LABELS[tab]}
                  </Button>
                ))}
              </div>

              {isUpdate ? (
                <>
                  <div className="flex justify-between px-4">
                    <h2 className="text-lg font-bold">Produktion (denna miljö)</h2>
                    <h2 className="text-lg font-bold">Test</h2>
                  </div>
                  <div className="border border-divider rounded overflow-hidden">
                    <MonacoDiffEditor
                      height="40vh"
                      language={getLanguage(currentTab)}
                      original={getLocalValue(currentTab)}
                      modified={getCompareValue(currentTab)}
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
                </>
              ) : (
                <div className="border border-divider rounded overflow-hidden">
                  <MonacoEditor
                    height="40vh"
                    language={getLanguage(currentTab)}
                    value={getCompareValue(currentTab)}
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
              )}
            </>
          )}

          <div className="flex flex-col gap-16">
            <FormControl className="w-full">
              <FormLabel>Versionsökning</FormLabel>
              <Select
                className="w-full max-w-[200px]"
                value={versionIncrement}
                onChange={(e) => setVersionIncrement(e.target.value as 'MAJOR' | 'MINOR')}
              >
                <Select.Option value="MAJOR">MAJOR</Select.Option>
                <Select.Option value="MINOR">MINOR</Select.Option>
              </Select>
            </FormControl>

            <FormControl className="w-full">
              <FormLabel>Ändringslogg</FormLabel>
              <Textarea
                className="w-full"
                value={changeLog}
                onChange={(e) => setChangeLog(e.target.value)}
                placeholder="Beskriv varför mallen synkroniseras..."
                rows={2}
              />
            </FormControl>
          </div>
        </div>
      </Modal.Content>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={syncing}>
          Avbryt
        </Button>
        <Button color="vattjom" onClick={handleConfirm} disabled={syncing}>
          {syncing ? <><Spinner size={1.5} /> Synkroniserar...</> : 'Synkronisera'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
