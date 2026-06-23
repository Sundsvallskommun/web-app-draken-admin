import {
  parentValueForLabelValue,
  rehydrateLabelPath,
  ROOT_PARENT_VALUE,
  type LabelPathEntry,
} from '@admin/label-editor';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Highlight, type LabelNode } from '@admin/label-tree';
import { LabelCopyValue } from '@admin/label-copy-value';
import { matchesSubtree } from '@admin/label-utils';
import { cn } from '@utils/cn';
import { ChevronRight, FolderOpen, GripVertical, Plus, Tag, Trash2 } from 'lucide-react';
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

interface DragSource extends ColumnEntry {
  level: number;
  parentValue: string;
}

interface DropTarget {
  parentValue: string;
  level: number;
}

const columnEntries = (items: LabelNode[], parentPath: string, query: string): ColumnEntry[] =>
  items
    .map((node, index) => ({ node, pathValue: parentPath ? `${parentPath}.${index}` : String(index) }))
    .filter(({ node }) => !query || matchesSubtree(node, query));

const dragId = (pathValue: string) => `label-drag:${pathValue}`;
const columnDropId = (level: number, parentValue: string) => `label-drop:column:${level}:${parentValue}`;
const rowDropId = (pathValue: string) => `label-drop:row:${pathValue}`;

const dragSource = (event: DragStartEvent | DragEndEvent): DragSource | undefined =>
  (event.active.data.current as { source?: DragSource } | undefined)?.source;

const dropTarget = (event: DragEndEvent): DropTarget | undefined =>
  (event.over?.data.current as { target?: DropTarget } | undefined)?.target;

function ColumnItem({
  node,
  pathValue,
  level,
  selected,
  query,
  dndEnabled,
  activeLevel,
  activeParentValue,
  onSelect,
  onRemove,
}: {
  node: LabelNode;
  pathValue: string;
  level: number;
  selected: boolean;
  query: string;
  dndEnabled: boolean;
  activeLevel: number | null;
  activeParentValue: string | null;
  onSelect: () => void;
  onRemove?: () => void;
}) {
  const hasChildren = (node.labels?.length ?? 0) > 0;
  const draggableEnabled = dndEnabled && level > 0;
  const dropLevel = level + 1;
  const dropEnabled = dndEnabled && activeLevel !== null && dropLevel <= activeLevel && activeParentValue !== pathValue;
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: dragId(pathValue),
    data: { source: { node, pathValue, level, parentValue: parentValueForLabelValue(pathValue) } satisfies DragSource },
    disabled: !draggableEnabled,
  });
  const { isOver, setNodeRef: setDroppableNodeRef } = useDroppable({
    id: rowDropId(pathValue),
    data: { target: { parentValue: pathValue, level: dropLevel } satisfies DropTarget },
    disabled: !dropEnabled,
  });
  const setNodeRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      setDraggableNodeRef(element);
      setDroppableNodeRef(element);
    },
    [setDraggableNodeRef, setDroppableNodeRef]
  );
  const style: React.CSSProperties = {
    opacity: isDragging ? 0.35 : undefined,
    transform: transform ? CSS.Transform.toString(transform) : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      aria-current={selected ? 'true' : undefined}
      style={style}
      className={cn(
        'group flex w-full items-center gap-1 rounded-md border border-transparent px-1 py-1 text-sm hover:bg-accent',
        selected && 'bg-accent font-medium',
        dropEnabled && 'border-primary/40 bg-primary/5',
        isOver && 'border-primary bg-primary/10 ring-1 ring-primary/30'
      )}
    >
      {draggableEnabled && (
        <button
          type="button"
          className="flex size-6 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
          aria-label={`Flytta ${nodeName(node)}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      )}
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
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground opacity-80 hover:text-destructive group-hover:opacity-100"
          aria-label={`Ta bort ${nodeName(node)}`}
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  );
}

function ColumnFooter({
  level,
  parentValue,
  activeLevel,
  activeParentValue,
  dndEnabled,
  onAdd,
}: {
  level: number;
  parentValue: string;
  activeLevel: number | null;
  activeParentValue: string | null;
  dndEnabled: boolean;
  onAdd?: (parentValue: string) => void;
}) {
  const rootDropBlocked = dndEnabled && activeLevel !== null && level === 0;
  const dropEnabled =
    dndEnabled && activeLevel !== null && level > 0 && level <= activeLevel && activeParentValue !== parentValue;
  const { isOver, setNodeRef } = useDroppable({
    id: columnDropId(level, parentValue),
    data: { target: { parentValue, level } satisfies DropTarget },
    disabled: !dropEnabled,
  });

  if (!onAdd && !dndEnabled) return null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'mt-2 rounded-md border border-dashed p-1',
        dropEnabled && 'border-primary/50 bg-primary/5',
        isOver && 'border-primary bg-primary/10'
      )}
    >
      {onAdd && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => onAdd(parentValue)}
        >
          <Plus className="size-4" />
          {level === 0 ? 'Lägg till på rotnivå' : 'Lägg till här'}
        </Button>
      )}
      {activeLevel !== null && (
        <p className={cn('px-2 pb-1 text-xs', dropEnabled ? 'text-primary' : 'text-muted-foreground')}>
          {dropEnabled ?
            'Släpp här för att flytta hit'
          : rootDropBlocked ?
            'Rootflytt stöds inte säkert av API:t'
          : 'Endast samma eller tidigare nivå kan ta emot flytt'}
        </p>
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
  onRemove,
  onMove,
  resetKey,
}: {
  data: LabelNode[];
  query?: string;
  onAdd?: (parentValue: string) => void;
  onRemove?: (label: LabelNode, labelValue: string) => void;
  onMove?: (label: LabelNode, sourceValue: string, targetParentValue: string, targetLevel: number) => void;
  resetKey?: string;
}) {
  const [path, setPath] = React.useState<LabelPathEntry[]>([]);
  const [columnWidths, setColumnWidths] = React.useState<Record<number, number>>({});
  const [activeDrag, setActiveDrag] = React.useState<DragSource | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const resizeRef = React.useRef<{ level: number; startX: number; startWidth: number } | null>(null);
  const dndEnabled = Boolean(onMove && !query.trim());

  // Reset the drill-down when the caller changes context, e.g. namespace.
  React.useEffect(() => {
    setPath([]);
  }, [resetKey]);

  // Keep the current drill-down after save/refresh by rebinding selected labels
  // to the new response objects. If a moved/removed branch no longer exists at
  // that parent, keep the nearest valid ancestor visible.
  React.useEffect(() => {
    setPath((previous) => rehydrateLabelPath(data, previous));
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDrag(dragSource(event) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const source = dragSource(event);
    const target = dropTarget(event);
    setActiveDrag(null);
    if (!source || !target || !onMove || target.level > source.level || target.parentValue === source.parentValue) {
      return;
    }
    onMove(source.node, source.pathValue, target.parentValue, target.level);
  };

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
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveDrag(null)}>
        <div ref={scrollRef} className="flex overflow-x-auto rounded-md border bg-card">
          {columns.map((items, level) => {
            const parentValue = parentValueForColumn(level);
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
                        level={level}
                        dndEnabled={dndEnabled}
                        activeLevel={activeDrag?.level ?? null}
                        activeParentValue={activeDrag?.parentValue ?? null}
                        query={query}
                        selected={path[level]?.pathValue === entry.pathValue}
                        onSelect={() => selectAt(level, entry)}
                        onRemove={onRemove ? () => onRemove(entry.node, entry.pathValue) : undefined}
                      />
                    ))
                  : <p className="px-2 py-3 text-sm text-muted-foreground">Inga etiketter på den här nivån.</p>}
                </div>
                {parentValue && (
                  <ColumnFooter
                    level={level}
                    parentValue={parentValue}
                    activeLevel={activeDrag?.level ?? null}
                    activeParentValue={activeDrag?.parentValue ?? null}
                    dndEnabled={dndEnabled}
                    onAdd={onAdd}
                  />
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
        <DragOverlay>
          {activeDrag && (
            <div className="rounded-md border bg-card px-3 py-2 text-sm font-medium shadow-lg">
              {nodeName(activeDrag.node)}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {onMove && query.trim() && (
        <p className="text-xs text-muted-foreground">Drag and drop är avstängt när sökningen filtrerar etiketter.</p>
      )}

      {leaf && (
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <div className="mb-1 flex flex-wrap items-center gap-1 text-muted-foreground">
            {path.map((entry, i) => (
              <React.Fragment key={nodeKey(entry.node, i)}>
                {i > 0 && <ChevronRight className="size-3.5" />}
                <span className={cn(i === path.length - 1 && 'font-medium text-foreground')}>
                  {nodeName(entry.node)}
                </span>
              </React.Fragment>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{leaf.node.classification}</span>
            <LabelCopyValue value={leaf.node.resourceName} />
          </div>
        </div>
      )}
    </div>
  );
}
