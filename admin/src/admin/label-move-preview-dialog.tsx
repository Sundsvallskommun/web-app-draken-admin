import { labelReferenceKey, type LabelMovePreview } from '@admin/label-editor';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import type { LabelNode } from '@interfaces/label';
import { cn } from '@utils/cn';
import { ArrowRight, FolderOpen, Loader2, Tag } from 'lucide-react';
import * as React from 'react';

const labelName = (label: LabelNode) => label.displayName || label.resourceName || label.classification;

function PreviewTreeNode({
  node,
  depth,
  movedLabelKeys,
}: {
  node: LabelNode;
  depth: number;
  movedLabelKeys: Set<string>;
}) {
  const children = node.labels ?? [];
  const isMoved = movedLabelKeys.has(labelReferenceKey(node));

  return (
    <li>
      <div
        className={cn(
          'flex min-w-0 items-center gap-2 rounded-md border px-2 py-1.5 text-sm',
          isMoved ? 'border-primary/50 bg-primary/10' : 'border-transparent'
        )}
        style={{ marginLeft: `${depth}rem` }}
      >
        {children.length > 0 ?
          <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
        : <Tag className="size-4 shrink-0 text-muted-foreground" />}
        <span className="min-w-0 flex-1 truncate">{labelName(node)}</span>
        <Badge variant={isMoved ? 'default' : 'secondary'} className="h-5 shrink-0 px-1.5 text-xs">
          {node.classification}
        </Badge>
      </div>
      {children.length > 0 && (
        <ul className="mt-1 space-y-1">
          {children.map((child, index) => (
            <PreviewTreeNode
              key={child.id ?? `${child.classification}-${child.resourceName}-${index}`}
              node={child}
              depth={depth + 1}
              movedLabelKeys={movedLabelKeys}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function PreviewTree({ labels, movedLabelKeys }: { labels: LabelNode[]; movedLabelKeys: Set<string> }) {
  return (
    <ul className="space-y-1">
      {labels.map((label, index) => (
        <PreviewTreeNode
          key={label.id ?? `${label.classification}-${label.resourceName}-${index}`}
          node={label}
          depth={0}
          movedLabelKeys={movedLabelKeys}
        />
      ))}
    </ul>
  );
}

export function LabelMovePreviewDialog({
  preview,
  open,
  saving,
  onOpenChange,
  onConfirm,
}: {
  preview: LabelMovePreview | null;
  open: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}) {
  const movedName = preview ? labelName(preview.movedLabel) : '';
  const targetName = preview ? labelName(preview.targetParent) : '';
  const movedLabelKeys = React.useMemo(() => new Set(preview?.movedLabelKeys ?? []), [preview]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[92vh] w-[min(64rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Bekräfta flytt</DialogTitle>
          <DialogDescription>
            {preview ?
              <>
                Flyttar <span className="font-medium text-foreground">{movedName}</span> till nivån under{' '}
                <span className="font-medium text-foreground">{targetName}</span>. Klassificering blir{' '}
                <span className="font-medium text-foreground">{preview.classification}</span>.
              </>
            : 'Granska ändringen innan den sparas.'}
          </DialogDescription>
        </DialogHeader>

        {preview && (
          <div className="grid min-h-0 gap-3 lg:grid-cols-[1fr_auto_1fr]">
            <section className="min-h-0 rounded-md border bg-muted/20 p-3">
              <div className="mb-2 text-xs font-medium uppercase tracking-normal text-muted-foreground">Före</div>
              <div className="max-h-[24rem] overflow-auto pr-1">
                <PreviewTree labels={preview.before} movedLabelKeys={movedLabelKeys} />
              </div>
            </section>

            <div className="hidden items-center justify-center text-muted-foreground lg:flex">
              <ArrowRight className="size-5" />
            </div>

            <section className="min-h-0 rounded-md border bg-muted/20 p-3">
              <div className="mb-2 text-xs font-medium uppercase tracking-normal text-muted-foreground">Efter</div>
              <div className="max-h-[24rem] overflow-auto pr-1">
                <PreviewTree labels={preview.after} movedLabelKeys={movedLabelKeys} />
              </div>
            </section>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Avbryt
          </Button>
          <Button type="button" onClick={() => void onConfirm()} disabled={!preview || saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Flytta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
