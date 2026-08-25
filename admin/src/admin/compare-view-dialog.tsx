import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { MonacoView } from '@admin/monaco-diff';
import type { CompareDetail } from '@services/compare-service';
import * as React from 'react';

type ViewTab = 'content' | 'metadata' | 'defaultValues';

const TAB_LABELS: Record<ViewTab, string> = {
  content: 'Innehåll',
  metadata: 'Metadata',
  defaultValues: 'Standardvärden',
};

export function CompareViewDialog({
  isOpen,
  onClose,
  identifier,
  detail,
}: {
  isOpen: boolean;
  onClose: () => void;
  identifier: string;
  detail: CompareDetail;
}) {
  const value = (tab: ViewTab) =>
    tab === 'content' ? detail.compareContent : tab === 'metadata' ? detail.compareMetadata : detail.compareDefaultValues;

  const availableTabs = (['content', 'metadata', 'defaultValues'] as ViewTab[]).filter((t) => !!value(t));
  const [activeTab, setActiveTab] = React.useState<ViewTab>(availableTabs[0] || 'content');
  const language = (tab: ViewTab) => (tab === 'content' ? 'html' : 'json');

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] w-[92vw] max-w-[92vw] overflow-auto">
        <DialogHeader>
          <DialogTitle>{identifier} — innehåll i test</DialogTitle>
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

          <MonacoView language={language(activeTab)} value={value(activeTab) ?? ''} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
