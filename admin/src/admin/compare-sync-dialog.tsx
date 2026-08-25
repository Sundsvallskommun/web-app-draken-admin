import { Button } from '@components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Textarea } from '@components/ui/textarea';
import { MonacoDiff, MonacoView } from '@admin/monaco-diff';
import type { CompareItem } from '@services/compare-service';
import { stripTestApprovalMetadata } from '@utils/template-metadata';
import { Loader2, TriangleAlert } from 'lucide-react';
import * as React from 'react';

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

type ViewTab = 'content' | 'metadata' | 'defaultValues';

const TAB_LABELS: Record<ViewTab, string> = {
  content: 'Innehåll',
  metadata: 'Metadata',
  defaultValues: 'Standardvärden',
};

export function CompareSyncDialog({
  isOpen,
  onClose,
  onConfirm,
  item,
  syncType,
  syncing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: SyncData) => void;
  item: CompareItem | null;
  syncType: SyncType;
  syncing: boolean;
}) {
  const [versionIncrement, setVersionIncrement] = React.useState<'MAJOR' | 'MINOR'>('MAJOR');
  const [changeLog, setChangeLog] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<ViewTab>('content');

  const detail = item?.detail;
  const isUpdate = syncType === 'update';

  const compareValue = (tab: ViewTab) =>
    tab === 'content' ? detail?.compareContent : tab === 'metadata' ? detail?.compareMetadata : detail?.compareDefaultValues;
  const localValue = (tab: ViewTab) =>
    tab === 'content' ? detail?.localContent : tab === 'metadata' ? detail?.localMetadata : detail?.localDefaultValues;
  const language = (tab: ViewTab) => (tab === 'content' ? 'html' : 'json');

  const availableTabs = (['content', 'metadata', 'defaultValues'] as ViewTab[]).filter((t) =>
    isUpdate ? !!(compareValue(t) || localValue(t)) : !!compareValue(t)
  );
  const currentTab = availableTabs.includes(activeTab) ? activeTab : availableTabs[0] || 'content';

  const reset = () => {
    setChangeLog('');
    setVersionIncrement('MAJOR');
    setActiveTab('content');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!item || !detail) return;
    onConfirm({
      identifier: item.identifier,
      name: item.name ?? item.identifier,
      content: detail.compareContent ?? '',
      metadata: stripTestApprovalMetadata(detail.compareMetadata ?? '[]'),
      defaultValues: detail.compareDefaultValues ?? '[]',
      versionIncrement,
      changeLog,
    });
  };

  if (!item || !detail) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-h-[92vh] w-[92vw] max-w-[92vw] overflow-auto">
        <DialogHeader>
          <DialogTitle>{isUpdate ? 'Uppdatera befintlig mall' : 'Skapa ny mall'} — {item.identifier}</DialogTitle>
          <DialogDescription>
            {isUpdate
              ? 'Mallen i produktionsmiljön uppdateras med innehållet från testmiljön. Den befintliga versionen skrivs över.'
              : 'En ny mall skapas i produktionsmiljön baserat på innehållet från testmiljön.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-md border border-orange-400/60 bg-orange-50 p-3 text-sm dark:bg-orange-950/40">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-orange-500" />
            <span>
              Detta skriver till <strong>produktionsmiljön</strong>. Granska diffen nedan innan du synkroniserar.
            </span>
          </div>

          {availableTabs.length > 0 && (
            <>
              {availableTabs.length > 1 && (
                <div className="flex items-center gap-1">
                  {availableTabs.map((tab) => (
                    <Button
                      key={tab}
                      size="sm"
                      variant={currentTab === tab ? 'secondary' : 'ghost'}
                      onClick={() => setActiveTab(tab)}
                    >
                      {TAB_LABELS[tab]}
                    </Button>
                  ))}
                </div>
              )}

              {isUpdate ? (
                <>
                  <div className="flex justify-between px-1 text-sm font-semibold">
                    <span>Produktion (denna miljö)</span>
                    <span>Test</span>
                  </div>
                  <MonacoDiff
                    height="40vh"
                    language={language(currentTab)}
                    original={localValue(currentTab) ?? ''}
                    modified={compareValue(currentTab) ?? ''}
                  />
                </>
              ) : (
                <MonacoView height="40vh" language={language(currentTab)} value={compareValue(currentTab) ?? ''} />
              )}
            </>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="version-increment">Versionsökning</Label>
              <Select value={versionIncrement} onValueChange={(v) => setVersionIncrement(v as 'MAJOR' | 'MINOR')}>
                <SelectTrigger id="version-increment" className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAJOR">MAJOR</SelectItem>
                  <SelectItem value="MINOR">MINOR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="change-log">Ändringslogg</Label>
              <Textarea
                id="change-log"
                value={changeLog}
                onChange={(e) => setChangeLog(e.target.value)}
                placeholder="Beskriv varför mallen synkroniseras…"
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={syncing}>
            Avbryt
          </Button>
          <Button onClick={handleConfirm} disabled={syncing}>
            {syncing && <Loader2 className="size-4 animate-spin" />}
            {syncing ? 'Synkroniserar…' : 'Synkronisera till produktion'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
