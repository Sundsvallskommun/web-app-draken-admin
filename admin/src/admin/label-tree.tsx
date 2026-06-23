import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { parentValueForLabelValue } from '@admin/label-editor';
import { matchesSubtree } from '@admin/label-utils';
import { LabelCopyValue } from '@admin/label-copy-value';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { LabelNode } from '@interfaces/label';
import { cn } from '@utils/cn';
import { ChevronDown, ChevronRight, FolderOpen, GripVertical, Tag, Trash2 } from 'lucide-react';
import * as React from 'react';

export type { LabelNode };

export function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-amber-200 px-0.5 text-amber-950 dark:bg-amber-500/40 dark:text-amber-100">
        {text.slice(i, i + query.length)}
      </mark>
      {text.slice(i + query.length)}
    </>
  );
}

interface TreeDragSource {
  node: LabelNode;
  pathValue: string;
  level: number;
  parentValue: string;
}

interface TreeDropTarget {
  parentValue: string;
  level: number;
}

const treeDragId = (pathValue: string) => `label-tree-drag:${pathValue}`;
const treeDropId = (pathValue: string) => `label-tree-drop:${pathValue}`;

const treeDragSource = (event: DragStartEvent | DragEndEvent): TreeDragSource | undefined =>
  (event.active.data.current as { source?: TreeDragSource } | undefined)?.source;

const treeDropTarget = (event: DragEndEvent): TreeDropTarget | undefined =>
  (event.over?.data.current as { target?: TreeDropTarget } | undefined)?.target;

function TreeNode({
  node,
  depth,
  pathValue,
  query,
  dndEnabled,
  activeLevel,
  activeParentValue,
  onRemove,
}: {
  node: LabelNode;
  depth: number;
  pathValue: string;
  query: string;
  dndEnabled: boolean;
  activeLevel: number | null;
  activeParentValue: string | null;
  onRemove?: (label: LabelNode, labelValue: string) => void;
}) {
  const name = node.displayName || node.classification;
  const children = node.labels ?? [];
  const hasChildren = children.length > 0;
  const isMatch = query ? name.toLowerCase().includes(query.toLowerCase()) : false;
  const draggableEnabled = dndEnabled && depth > 0;
  const dropLevel = depth + 1;
  const dropEnabled = dndEnabled && activeLevel !== null && dropLevel <= activeLevel && activeParentValue !== pathValue;
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: treeDragId(pathValue),
    data: {
      source: {
        node,
        pathValue,
        level: depth,
        parentValue: parentValueForLabelValue(pathValue),
      } satisfies TreeDragSource,
    },
    disabled: !draggableEnabled,
  });
  const { isOver, setNodeRef: setDroppableNodeRef } = useDroppable({
    id: treeDropId(pathValue),
    data: { target: { parentValue: pathValue, level: dropLevel } satisfies TreeDropTarget },
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
    paddingLeft: `${depth * 1.25}rem`,
    transform: transform ? CSS.Transform.toString(transform) : undefined,
  };

  const [expanded, setExpanded] = React.useState(true);
  const [prevQuery, setPrevQuery] = React.useState(query);
  if (prevQuery !== query) {
    setPrevQuery(query);
    if (query && matchesSubtree(node, query)) setExpanded(true);
  }

  return (
    <div>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'flex items-center gap-1 rounded-md border border-transparent py-1 hover:bg-accent',
          dropEnabled && 'border-primary/40 bg-primary/5',
          isOver && 'border-primary bg-primary/10 ring-1 ring-primary/30'
        )}
      >
        {draggableEnabled && (
          <button
            type="button"
            className="flex size-6 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
            aria-label={`Flytta ${name}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => hasChildren && setExpanded((e) => !e)}
          className={cn('flex size-5 shrink-0 items-center justify-center rounded', hasChildren && 'hover:bg-muted')}
          aria-expanded={hasChildren ? expanded : undefined}
          aria-label={
            hasChildren ?
              expanded ?
                'Fäll ihop'
              : 'Expandera'
            : undefined
          }
          tabIndex={hasChildren ? 0 : -1}
        >
          {hasChildren ?
            expanded ?
              <ChevronDown className="size-3.5 text-muted-foreground" />
            : <ChevronRight className="size-3.5 text-muted-foreground" />
          : null}
        </button>

        {hasChildren ?
          <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
        : <Tag className="size-4 shrink-0 text-muted-foreground" />}

        <span className={cn('truncate', isMatch && 'font-semibold')}>
          <Highlight text={name} query={query} />
        </span>

        {hasChildren && (
          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
            {children.length}
          </Badge>
        )}
        <span className="ml-2 text-xs text-muted-foreground">{node.classification}</span>
        <LabelCopyValue value={node.resourceName} className="ml-1" />
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-1 size-7 text-muted-foreground hover:text-destructive"
            aria-label={`Ta bort ${name}`}
            onClick={() => onRemove(node, pathValue)}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      {hasChildren && expanded && (
        <div>
          {children.map((child, i) => {
            const childPath = `${pathValue}.${i}`;
            return (
              <TreeNode
                key={child.id ?? `${child.classification}-${i}`}
                node={child}
                depth={depth + 1}
                pathValue={childPath}
                query={query}
                dndEnabled={dndEnabled}
                activeLevel={activeLevel}
                activeParentValue={activeParentValue}
                onRemove={onRemove}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LabelTree({
  data,
  query = '',
  onRemove,
  onMove,
}: {
  data: LabelNode[];
  query?: string;
  onRemove?: (label: LabelNode, labelValue: string) => void;
  onMove?: (label: LabelNode, sourceValue: string, targetParentValue: string, targetLevel: number) => void;
}) {
  const [activeDrag, setActiveDrag] = React.useState<TreeDragSource | null>(null);
  const dndEnabled = Boolean(onMove && !query.trim());
  const visible = data
    .map((node, index) => ({ node, pathValue: String(index) }))
    .filter(({ node }) => !query || matchesSubtree(node, query));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDrag(treeDragSource(event) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const source = treeDragSource(event);
    const target = treeDropTarget(event);
    setActiveDrag(null);
    if (!source || !target || !onMove || target.level > source.level || target.parentValue === source.parentValue) {
      return;
    }
    onMove(source.node, source.pathValue, target.parentValue, target.level);
  };

  if (!visible.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Inga etiketter matchade.</p>;
  }
  return (
    <div className="space-y-2">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveDrag(null)}>
        <div className="rounded-md border bg-card p-3">
          {visible.map(({ node, pathValue }, i) => (
            <TreeNode
              key={node.id ?? `${node.classification}-${i}`}
              node={node}
              depth={0}
              pathValue={pathValue}
              query={query}
              dndEnabled={dndEnabled}
              activeLevel={activeDrag?.level ?? null}
              activeParentValue={activeDrag?.parentValue ?? null}
              onRemove={onRemove}
            />
          ))}
        </div>
        <DragOverlay>
          {activeDrag && (
            <div className="rounded-md border bg-card px-3 py-2 text-sm font-medium shadow-lg">
              {activeDrag.node.displayName || activeDrag.node.resourceName || activeDrag.node.classification}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {onMove && query.trim() && (
        <p className="text-xs text-muted-foreground">Drag and drop är avstängt när sökningen filtrerar etiketter.</p>
      )}
    </div>
  );
}
