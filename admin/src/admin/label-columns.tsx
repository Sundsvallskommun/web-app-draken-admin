import { Badge } from '@components/ui/badge';
import { Highlight, type LabelNode } from '@admin/label-tree';
import { LabelCopyValue } from '@admin/label-copy-value';
import { matchesSubtree } from '@admin/label-utils';
import { cn } from '@utils/cn';
import { ChevronRight, FolderOpen, Tag } from 'lucide-react';
import * as React from 'react';

const nodeName = (node: LabelNode) => node.displayName || node.classification;
const nodeKey = (node: LabelNode, i: number) => node.id ?? `${node.classification}-${i}`;
const DEFAULT_COLUMN_WIDTH = 352;
const MIN_COLUMN_WIDTH = 256;
const MAX_COLUMN_WIDTH = 640;

const filterItems = (items: LabelNode[], query: string) =>
  query ? items.filter((n) => matchesSubtree(n, query)) : items;

const clampColumnWidth = (width: number) => Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, width));

function ColumnItem({
  node,
  selected,
  query,
  onSelect,
}: {
  node: LabelNode;
  selected: boolean;
  query: string;
  onSelect: () => void;
}) {
  const hasChildren = (node.labels?.length ?? 0) > 0;
  return (
    <div
      aria-current={selected ? 'true' : undefined}
      className={cn(
        'group flex w-full items-center gap-1 rounded-md px-1 py-1 text-sm hover:bg-accent',
        selected && 'bg-accent font-medium'
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-sm px-1 py-0.5 text-left"
      >
        {hasChildren ?
          <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
        : <Tag className="size-4 shrink-0 text-muted-foreground" />}
        <span className="truncate">
          <Highlight text={nodeName(node)} query={query} />
        </span>
        {hasChildren && (
          <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
            {node.labels!.length}
          </Badge>
        )}
        {hasChildren && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />}
      </button>
      <LabelCopyValue value={node.resourceName} iconOnly className="opacity-80 group-hover:opacity-100" />
    </div>
  );
}

/**
 * macOS Finder-style "Miller columns": klicka dig vidare nivå för nivå.
 * Varje vald nod med barn öppnar en ny kolumn till höger — lättare att tolka
 * djupa hierarkier än den hopfällbara trädvyn.
 */
export function LabelColumns({ data, query = '' }: { data: LabelNode[]; query?: string }) {
  const [path, setPath] = React.useState<LabelNode[]>([]);
  const [columnWidths, setColumnWidths] = React.useState<Record<number, number>>({});
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const resizeRef = React.useRef<{ level: number; startX: number; startWidth: number } | null>(null);

  // Reset the drill-down when the underlying data changes (e.g. new namespace).
  React.useEffect(() => {
    setPath([]);
  }, [data]);

  // Columns: roots first, then the children of each selected node that has any.
  const columns = React.useMemo(() => {
    const cols: LabelNode[][] = [filterItems(data, query)];
    for (const node of path) {
      const children = filterItems(node.labels ?? [], query);
      if (children.length === 0) break;
      cols.push(children);
    }
    return cols;
  }, [data, query, path]);

  // Keep the newest column in view, like Finder scrolling right as you drill in.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [columns.length]);

  const selectAt = (level: number, node: LabelNode) => setPath((prev) => [...prev.slice(0, level), node]);

  const columnWidth = React.useCallback((level: number) => columnWidths[level] ?? DEFAULT_COLUMN_WIDTH, [columnWidths]);

  const setColumnWidth = React.useCallback((level: number, width: number) => {
    setColumnWidths((prev) => ({ ...prev, [level]: clampColumnWidth(width) }));
  }, []);

  const startResize = (event: React.PointerEvent<HTMLDivElement>, level: number) => {
    event.preventDefault();
    event.stopPropagation();
    resizeRef.current = { level, startX: event.clientX, startWidth: columnWidth(level) };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const resizeColumn = (event: React.PointerEvent<HTMLDivElement>) => {
    const resize = resizeRef.current;
    if (!resize) return;
    setColumnWidth(resize.level, resize.startWidth + event.clientX - resize.startX);
  };

  const stopResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeRef.current) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    resizeRef.current = null;
  };

  const resizeWithKeyboard = (event: React.KeyboardEvent<HTMLDivElement>, level: number) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setColumnWidth(level, columnWidth(level) - 24);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setColumnWidth(level, columnWidth(level) + 24);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setColumnWidth(level, MIN_COLUMN_WIDTH);
    } else if (event.key === 'End') {
      event.preventDefault();
      setColumnWidth(level, MAX_COLUMN_WIDTH);
    }
  };

  if (!columns[0]?.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Inga etiketter matchade.</p>;
  }

  const leaf = path[path.length - 1];

  return (
    <div className="flex flex-col gap-3">
      <div ref={scrollRef} className="flex overflow-x-auto rounded-md border bg-card">
        {columns.map((items, level) => (
          <div
            key={level}
            className="relative max-h-[28rem] shrink-0 space-y-0.5 overflow-y-auto border-r p-1.5 pr-3 last:border-r-0"
            style={{ width: columnWidth(level) }}
          >
            {items.map((node, i) => (
              <ColumnItem
                key={nodeKey(node, i)}
                node={node}
                query={query}
                selected={path[level] === node}
                onSelect={() => selectAt(level, node)}
              />
            ))}
            <div
              role="separator"
              aria-label="Ändra kolumnbredd"
              aria-orientation="vertical"
              aria-valuemin={MIN_COLUMN_WIDTH}
              aria-valuemax={MAX_COLUMN_WIDTH}
              aria-valuenow={columnWidth(level)}
              tabIndex={0}
              className="absolute right-0 top-0 h-full w-2 cursor-col-resize touch-none border-r border-transparent hover:border-primary/60 focus:border-primary focus:outline-none"
              onPointerDown={(event) => startResize(event, level)}
              onPointerMove={resizeColumn}
              onPointerUp={stopResize}
              onPointerCancel={stopResize}
              onKeyDown={(event) => resizeWithKeyboard(event, level)}
            />
          </div>
        ))}
      </div>

      {leaf && (
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <div className="mb-1 flex flex-wrap items-center gap-1 text-muted-foreground">
            {path.map((node, i) => (
              <React.Fragment key={nodeKey(node, i)}>
                {i > 0 && <ChevronRight className="size-3.5" />}
                <span className={cn(i === path.length - 1 && 'font-medium text-foreground')}>{nodeName(node)}</span>
              </React.Fragment>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{leaf.classification}</span>
            <LabelCopyValue value={leaf.resourceName} />
          </div>
        </div>
      )}
    </div>
  );
}
