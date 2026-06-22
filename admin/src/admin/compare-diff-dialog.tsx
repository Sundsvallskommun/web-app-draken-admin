import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { MonacoDiff } from '@admin/monaco-diff';
import type { CompareDetail } from '@services/compare-service';
import * as React from 'react';

type DiffTab = 'content' | 'metadata' | 'defaultValues';

const TAB_LABELS: Record<DiffTab, string> = {
  content: 'Innehåll',
  metadata: 'Metadata',
  defaultValues: 'Standardvärden',
};

export function CompareDiffDialog({
  isOpen,
  onClose,
  identifier,
  detail,
  differences,
}: {
  isOpen: boolean;
  onClose: () => void;
  identifier: string;
  detail: CompareDetail;
  differences: string[];
}) {
  const availableTabs = (['content', 'metadata', 'defaultValues'] as DiffTab[]).filter((t) => differences.includes(t));
  const [activeTab, setActiveTab] = React.useState<DiffTab>(availableTabs[0] || 'content');

  const original = (tab: DiffTab) =>
    tab === 'content' ? detail.localContent : tab === 'metadata' ? detail.localMetadata : detail.localDefaultValues;
  const modified = (tab: DiffTab) =>
    tab === 'content' ? detail.compareContent : tab === 'metadata' ? detail.compareMetadata : detail.compareDefaultValues;
  const language = (tab: DiffTab) => (tab === 'content' ? 'html' : 'json');

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] w-[92vw] max-w-[92vw] overflow-auto">
        <DialogHeader>
          <DialogTitle>Diff: {identifier}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {availableTabs.length > 1 && (
            <div className="flex items-center gap-1">
              {availableTabs.map((tab) => (
                <Button
                  key={tab}
                  size="sm"
                  variant={activeTab === tab ? 'secondary' : 'ghost'}
                  onClick={() => setActiveTab(tab)}
                >
                  {TAB_LABELS[tab]}
                </Button>
              ))}
            </div>
          )}

          <div className="flex justify-between px-1 text-sm font-semibold">
            <span>Produktion (denna miljö)</span>
            <span>Test</span>
          </div>

          <MonacoDiff
            language={language(activeTab)}
            original={original(activeTab) ?? ''}
            modified={modified(activeTab) ?? ''}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
