import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { matchesSubtree } from '@admin/label-utils';
import { LabelCopyValue } from '@admin/label-copy-value';
import type { LabelNode } from '@interfaces/label';
import { cn } from '@utils/cn';
import { ChevronDown, ChevronRight, FolderOpen, Tag, Trash2 } from 'lucide-react';
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

function TreeNode({
  node,
  depth,
  pathValue,
  query,
  onRemove,
}: {
  node: LabelNode;
  depth: number;
  pathValue: string;
  query: string;
  onRemove?: (label: LabelNode, labelValue: string) => void;
}) {
  const name = node.displayName || node.classification;
  const children = node.labels ?? [];
  const hasChildren = children.length > 0;
  const isMatch = query ? name.toLowerCase().includes(query.toLowerCase()) : false;

  const [expanded, setExpanded] = React.useState(true);
  const [prevQuery, setPrevQuery] = React.useState(query);
  if (prevQuery !== query) {
    setPrevQuery(query);
    if (query && matchesSubtree(node, query)) setExpanded(true);
  }

  return (
    <div>
      <div
        className="flex items-center gap-1 rounded-md py-1 hover:bg-accent"
        style={{ paddingLeft: `${depth * 1.25}rem` }}
      >
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
}: {
  data: LabelNode[];
  query?: string;
  onRemove?: (label: LabelNode, labelValue: string) => void;
}) {
  const visible = data
    .map((node, index) => ({ node, pathValue: String(index) }))
    .filter(({ node }) => !query || matchesSubtree(node, query));
  if (!visible.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Inga etiketter matchade.</p>;
  }
  return (
    <div className="rounded-md border bg-card p-3">
      {visible.map(({ node, pathValue }, i) => (
        <TreeNode
          key={node.id ?? `${node.classification}-${i}`}
          node={node}
          depth={0}
          pathValue={pathValue}
          query={query}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
