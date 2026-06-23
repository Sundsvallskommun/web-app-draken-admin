import { canCreateLabelBelow, ROOT_PARENT_VALUE } from '@admin/label-editor';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Highlight, type LabelNode } from '@admin/label-tree';
import { LabelCopyValue } from '@admin/label-copy-value';
import { matchesSubtree } from '@admin/label-utils';
import { cn } from '@utils/cn';
import { Ban, ChevronRight, FolderOpen, Plus, RotateCcw, Tag, Trash2 } from 'lucide-react';
import * as React from 'react';

const nodeName = (node: LabelNode) => node.displayName || node.classification;
const nodeKey = (node: LabelNode, i: number) => node.id ?? `${node.classification}-${i}`;
const DEFAULT_COLUMN_WIDTH = 352;
const MIN_COLUMN_WIDTH = 256;
const MAX_COLUMN_WIDTH = 640;

const clampColumnWidth = (width: number) => Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, width));

interface ColumnEntry {
  node: LabelNode;
  pathValue: string;
}

type PathEntry = ColumnEntry;

const columnEntries = (items: LabelNode[], parentPath: string, query: string): ColumnEntry[] =>
  items
    .map((node, index) => ({ node, pathValue: parentPath ? `${parentPath}.${index}` : String(index) }))
    .filter(({ node }) => !query || matchesSubtree(node, query));

function ColumnItem({
  node,
  pathValue,
  selected,
  query,
  onSelect,
  onDeprecatedChange,
  onRemove,
}: {
  node: LabelNode;
  pathValue: string;
  selected: boolean;
  query: string;
  onSelect: () => void;
  onDeprecatedChange?: (label: LabelNode, labelValue: string, deprecated: boolean) => void;
  onRemove?: (label: LabelNode, labelValue: string) => void;
}) {
  const hasChildren = (node.labels?.length ?? 0) > 0;
  const isDeprecated = node.deprecated === true;
  return (
    <div
      aria-current={selected ? 'true' : undefined}
      className={cn(
        'group flex w-full items-center gap-1 rounded-md border border-transparent px-1 py-1 text-sm hover:bg-accent',
        selected && !isDeprecated && 'bg-accent font-medium',
        isDeprecated &&
          'border-amber-300/70 bg-amber-50 text-muted-foreground hover:bg-amber-50 dark:border-amber-500/40 dark:bg-amber-950/20 dark:hover:bg-amber-950/20'
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-sm px-1 py-0.5 text-left"
      >
        {hasChildren ?
          <FolderOpen
            className={cn(
              'size-4 shrink-0',
              isDeprecated ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground'
            )}
          />
        : <Tag
            className={cn(
              'size-4 shrink-0',
              isDeprecated ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground'
            )}
          />
        }
        <span className={cn('truncate', isDeprecated && 'line-through decoration-2 decoration-amber-600/70')}>
          <Highlight text={nodeName(node)} query={query} />
        </span>
        {isDeprecated && (
          <Badge
            variant="outline"
            className="h-5 shrink-0 border-amber-500/50 bg-amber-100 px-1.5 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
          >
            <Ban className="mr-1 size-3" />
            Deprecated
          </Badge>
        )}
        {hasChildren && (
          <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
            {node.labels!.length}
          </Badge>
        )}
        {hasChildren && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />}
      </button>
      <LabelCopyValue value={node.resourceName} iconOnly className="opacity-80 group-hover:opacity-100" />
      {onDeprecatedChange && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground opacity-80 hover:text-foreground group-hover:opacity-100"
          aria-label={`${isDeprecated ? 'Återaktivera' : 'Avveckla'} ${nodeName(node)}`}
          onClick={() => onDeprecatedChange(node, pathValue, !isDeprecated)}
        >
          {isDeprecated ?
            <RotateCcw className="size-4" />
          : <Ban className="size-4" />}
        </Button>
      )}
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground opacity-70 hover:text-destructive group-hover:opacity-100"
          aria-label={`Ta bort ${nodeName(node)} permanent`}
          onClick={() => onRemove(node, pathValue)}
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  );
}

/**
 * macOS Finder-style "Miller columns": klicka dig vidare nivå för nivå.
 * Varje vald nod med barn öppnar en ny kolumn till höger — lättare att tolka
 * djupa hierarkier än den hopfällbara trädvyn.
 */
export function LabelColumns({
  data,
  query = '',
  onAdd,
  onDeprecatedChange,
  onRemove,
}: {
  data: LabelNode[];
  query?: string;
  onAdd?: (parentValue: string) => void;
  onDeprecatedChange?: (label: LabelNode, labelValue: string, deprecated: boolean) => void;
  onRemove?: (label: LabelNode, labelValue: string) => void;
}) {
  const [path, setPath] = React.useState<PathEntry[]>([]);
  const [columnWidths, setColumnWidths] = React.useState<Record<number, number>>({});
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const resizeRef = React.useRef<{ level: number; startX: number; startWidth: number } | null>(null);

  // Reset the drill-down when the underlying data changes (e.g. new namespace).
  React.useEffect(() => {
    setPath([]);
  }, [data]);

  // Columns: roots first, then the children of each selected node that has any.
  const columns = React.useMemo(() => {
    const cols: ColumnEntry[][] = [columnEntries(data, '', query)];
    for (const entry of path) {
      const children = columnEntries(entry.node.labels ?? [], entry.pathValue, query);
      cols.push(children);
    }
    return cols;
  }, [data, query, path]);

  // Keep the newest column in view, like Finder scrolling right as you drill in.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [columns.length]);

  const selectAt = (level: number, entry: ColumnEntry) => setPath((prev) => [...prev.slice(0, level), entry]);

  const parentValueForColumn = (level: number) => (level === 0 ? ROOT_PARENT_VALUE : path[level - 1]?.pathValue);

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
  const leafDeprecated = leaf?.node.deprecated === true;

  return (
    <div className="flex flex-col gap-3">
      <div ref={scrollRef} className="flex overflow-x-auto rounded-md border bg-card">
        {columns.map((items, level) => {
          const addParentValue = parentValueForColumn(level);
          const canAddToColumnParent = Boolean(addParentValue && canCreateLabelBelow(data, addParentValue));

          return (
            <div
              key={level}
              className="relative flex max-h-[28rem] shrink-0 flex-col border-r p-1.5 pr-3 last:border-r-0"
              style={{ width: columnWidth(level) }}
            >
              <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
                {items.length > 0 ?
                  items.map((entry, i) => (
                    <ColumnItem
                      key={nodeKey(entry.node, i)}
                      node={entry.node}
                      pathValue={entry.pathValue}
                      query={query}
                      selected={path[level]?.pathValue === entry.pathValue}
                      onSelect={() => selectAt(level, entry)}
                      onDeprecatedChange={onDeprecatedChange}
                      onRemove={onRemove}
                    />
                  ))
                : <p className="px-2 py-3 text-sm text-muted-foreground">Inga etiketter på den här nivån.</p>}
              </div>
              {onAdd && addParentValue && canAddToColumnParent && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full justify-start gap-1.5 border border-dashed text-muted-foreground hover:text-foreground"
                  onClick={() => onAdd(addParentValue)}
                >
                  <Plus className="size-4" />
                  {level === 0 ? 'Lägg till på rotnivå' : 'Lägg till här'}
                </Button>
              )}
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
          );
        })}
      </div>

      {leaf && (
        <div
          className={cn(
            'rounded-md border bg-muted/40 px-3 py-2 text-sm',
            leafDeprecated &&
              'border-amber-300/70 bg-amber-50 text-muted-foreground dark:border-amber-500/40 dark:bg-amber-950/20'
          )}
        >
          <div className="mb-1 flex flex-wrap items-center gap-1 text-muted-foreground">
            {path.map((entry, i) => (
              <React.Fragment key={nodeKey(entry.node, i)}>
                {i > 0 && <ChevronRight className="size-3.5" />}
                <span
                  className={cn(
                    i === path.length - 1 && 'font-medium text-foreground',
                    entry.node.deprecated === true &&
                      'text-muted-foreground line-through decoration-2 decoration-amber-600/70'
                  )}
                >
                  {nodeName(entry.node)}
                </span>
              </React.Fragment>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{leaf.node.classification}</span>
            {leafDeprecated && (
              <Badge
                variant="outline"
                className="h-5 border-amber-500/50 bg-amber-100 px-1.5 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
              >
                <Ban className="mr-1 size-3" />
                Deprecated
              </Badge>
            )}
            <LabelCopyValue value={leaf.node.resourceName} />
          </div>
        </div>
      )}
    </div>
  );
}
