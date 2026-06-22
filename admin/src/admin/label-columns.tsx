import { Badge } from '@components/ui/badge';
import { Highlight, type LabelNode } from '@admin/label-tree';
import { matchesSubtree } from '@admin/label-utils';
import { cn } from '@utils/cn';
import { ChevronRight, FolderOpen, Tag } from 'lucide-react';
import * as React from 'react';

const nodeName = (node: LabelNode) => node.displayName || node.classification;
const nodeKey = (node: LabelNode, i: number) => node.id ?? `${node.classification}-${i}`;

const filterItems = (items: LabelNode[], query: string) =>
  query ? items.filter((n) => matchesSubtree(n, query)) : items;

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
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent',
        selected && 'bg-accent font-medium'
      )}
    >
      {hasChildren ? (
        <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
      ) : (
        <Tag className="size-4 shrink-0 text-muted-foreground" />
      )}
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
  );
}

/**
 * macOS Finder-style "Miller columns": klicka dig vidare nivå för nivå.
 * Varje vald nod med barn öppnar en ny kolumn till höger — lättare att tolka
 * djupa hierarkier än den hopfällbara trädvyn.
 */
export function LabelColumns({ data, query = '' }: { data: LabelNode[]; query?: string }) {
  const [path, setPath] = React.useState<LabelNode[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);

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

  const selectAt = (level: number, node: LabelNode) =>
    setPath((prev) => [...prev.slice(0, level), node]);

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
            className="max-h-[28rem] w-64 shrink-0 space-y-0.5 overflow-y-auto border-r p-1.5 last:border-r-0"
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
          <span className="text-xs text-muted-foreground">{leaf.classification}</span>
        </div>
      )}
    </div>
  );
}
