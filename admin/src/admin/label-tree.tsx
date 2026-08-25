import { Badge } from '@components/ui/badge';
import { matchesLabel, matchesSubtree, visibleLabelEntries } from '@admin/label-utils';
import { LabelActions } from '@admin/label-actions';
import { LabelEscalationEmail } from '@admin/label-escalation-email';
import type { LabelNode } from '@interfaces/label';
import { cn } from '@utils/cn';
import { Ban, ChevronDown, ChevronRight, FolderOpen, Tag } from 'lucide-react';
import * as React from 'react';

export type { LabelNode };

export function Highlight({ text, query }: { text: string; query: string }) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return <>{text}</>;
  const i = text.toLocaleLowerCase('sv').indexOf(normalizedQuery.toLocaleLowerCase('sv'));
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-amber-200 px-0.5 text-amber-950 dark:bg-amber-500/40 dark:text-amber-100">
        {text.slice(i, i + normalizedQuery.length)}
      </mark>
      {text.slice(i + normalizedQuery.length)}
    </>
  );
}

function TreeNode({
  node,
  depth,
  pathValue,
  query,
  onSettings,
}: {
  node: LabelNode;
  depth: number;
  pathValue: string;
  query: string;
  onSettings?: (label: LabelNode, labelValue: string) => void;
}) {
  const name = node.displayName || node.classification;
  const children = node.labels ?? [];
  const hasChildren = children.length > 0;
  const visibleChildren = visibleLabelEntries(children, query);
  const hasVisibleChildren = visibleChildren.length > 0;
  const isMatch = matchesLabel(node, query);
  const isDeprecated = node.deprecated === true;

  const [expanded, setExpanded] = React.useState(true);
  React.useEffect(() => {
    if (query.trim() && matchesSubtree(node, query)) setExpanded(true);
  }, [node, query]);

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 rounded-md border border-transparent py-1 hover:bg-accent',
          isDeprecated &&
            'border-amber-300/70 bg-amber-50 text-muted-foreground hover:bg-amber-50 dark:border-amber-500/40 dark:bg-amber-950/20 dark:hover:bg-amber-950/20'
        )}
        style={{ paddingLeft: `${depth * 1.25}rem` }}
      >
        <button
          type="button"
          onClick={() => hasVisibleChildren && setExpanded((e) => !e)}
          className={cn(
            'flex size-5 shrink-0 items-center justify-center rounded',
            hasVisibleChildren && 'hover:bg-muted'
          )}
          aria-expanded={hasVisibleChildren ? expanded : undefined}
          aria-label={
            hasVisibleChildren ?
              expanded ?
                'Fäll ihop'
              : 'Expandera'
            : undefined
          }
          tabIndex={hasVisibleChildren ? 0 : -1}
        >
          {hasVisibleChildren ?
            expanded ?
              <ChevronDown className="size-3.5 text-muted-foreground" />
            : <ChevronRight className="size-3.5 text-muted-foreground" />
          : null}
        </button>

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

        <span
          className={cn(
            'truncate',
            isMatch && 'font-semibold',
            isDeprecated && 'line-through decoration-2 decoration-amber-600/70'
          )}
        >
          <Highlight text={name} query={query} />
        </span>

        {isDeprecated && (
          <Badge
            variant="outline"
            className="ml-1 h-5 border-amber-500/50 bg-amber-100 px-1.5 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
          >
            <Ban className="mr-1 size-3" />
            Deprecated
          </Badge>
        )}
        {hasChildren && (
          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
            {query.trim() ? visibleChildren.length : children.length}
          </Badge>
        )}
        <span className="ml-2 text-xs text-muted-foreground">{node.classification}</span>
        <LabelEscalationEmail label={node} className="ml-1 max-w-64" />
        <LabelActions label={node} labelValue={pathValue} className="ml-auto" onSettings={onSettings} />
      </div>

      {hasVisibleChildren && expanded && (
        <div>
          {visibleChildren.map(({ node: child, index }) => {
            const childPath = `${pathValue}.${index}`;
            return (
              <TreeNode
                key={child.id ?? `${child.classification}-${index}`}
                node={child}
                depth={depth + 1}
                pathValue={childPath}
                query={query}
                onSettings={onSettings}
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
  onSettings,
}: {
  data: LabelNode[];
  query?: string;
  onSettings?: (label: LabelNode, labelValue: string) => void;
}) {
  const visible = visibleLabelEntries(data, query);
  if (!visible.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Inga etiketter matchade.</p>;
  }
  return (
    <div className="rounded-md border bg-card p-3">
      {visible.map(({ node, index }) => (
        <TreeNode
          key={node.id ?? `${node.classification}-${index}`}
          node={node}
          depth={0}
          pathValue={String(index)}
          query={query}
          onSettings={onSettings}
        />
      ))}
    </div>
  );
}
