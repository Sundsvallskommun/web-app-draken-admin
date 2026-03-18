import { LabelNode } from '@interfaces/label';
import { LabelCopyFields } from '@components/labels/label-copy-fields.component';
import { ChevronDown, ChevronRight, FolderOpen, Tag } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';

interface LabelTreeViewProps {
  data: LabelNode[];
  searchQuery?: string;
  onNavigate?: (path: number[]) => void;
}

interface TreeNodeProps {
  node: LabelNode;
  depth: number;
  isLast: boolean;
  parentLines: boolean[];
  searchQuery: string;
  nodePath: number[];
  onNavigate?: (path: number[]) => void;
}

const highlightMatch = (text: string, query: string) => {
  if (!query) return text;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-warning-surface-primary text-warning-text-secondary rounded-2 px-2">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
};

const hasMatchInSubtree = (node: LabelNode, query: string): boolean => {
  if (!query) return false;
  const name = (node.displayName || node.classification).toLowerCase();
  if (name.includes(query.toLowerCase())) return true;
  return node.labels?.some((child) => hasMatchInSubtree(child, query)) ?? false;
};

const TreeNode: React.FC<TreeNodeProps> = ({ node, depth, isLast, parentLines, searchQuery, nodePath, onNavigate }) => {
  const name = node.displayName || node.classification;
  const childCount = node.labels?.length ?? 0;
  const hasChildren = childCount > 0;

  const shouldAutoExpand = searchQuery ? hasMatchInSubtree(node, searchQuery) : true;
  const [expanded, setExpanded] = useState(shouldAutoExpand);

  const isMatch = searchQuery ? name.toLowerCase().includes(searchQuery.toLowerCase()) : false;

  // Re-expand when search changes and this node has matches in subtree
  const [prevQuery, setPrevQuery] = useState(searchQuery);
  if (prevQuery !== searchQuery) {
    setPrevQuery(searchQuery);
    if (searchQuery && hasMatchInSubtree(node, searchQuery)) {
      setExpanded(true);
    }
  }

  return (
    <div>
      {/* Node row */}
      <div className="flex items-center flex-wrap gap-y-4" style={{ minHeight: '36px' }}>
        {/* Tree lines */}
        {parentLines.map((showLine, i) => (
          <span
            key={i}
            className="inline-flex justify-center shrink-0"
            style={{ width: '24px' }}
          >
            {showLine && <span className="border-l-2 border-divider h-full absolute" style={{ height: '36px' }} />}
          </span>
        ))}

        {/* Branch connector */}
        {depth > 0 && (
          <span
            className="inline-flex items-center shrink-0 relative"
            style={{ width: '24px', height: '36px' }}
          >
            <span
              className={`border-l-2 border-b-2 border-divider rounded-bl-8 absolute left-[11px] ${isLast ? 'h-[18px] top-0' : 'h-full top-0'}`}
              style={{ width: '13px' }}
            />
          </span>
        )}

        {/* Expand/collapse toggle */}
        <button
          className={`shrink-0 inline-flex items-center justify-center rounded-4 w-24 h-24 ${hasChildren ? 'cursor-pointer hover:bg-background-200' : ''}`}
          onClick={() => hasChildren && setExpanded(!expanded)}
          tabIndex={hasChildren ? 0 : -1}
          aria-expanded={hasChildren ? expanded : undefined}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown size={14} className="text-dark-secondary" />
            ) : (
              <ChevronRight size={14} className="text-dark-secondary" />
            )
          ) : (
            <span className="w-14" />
          )}
        </button>

        {/* Icon */}
        <span className="text-dark-secondary shrink-0 mr-8">
          {hasChildren ? <FolderOpen size={16} /> : <Tag size={16} />}
        </span>

        {/* Label name */}
        <button
          className={`truncate hover:underline cursor-pointer text-left ${isMatch ? 'font-bold' : ''}`}
          onClick={() => onNavigate?.(nodePath)}
        >
          {highlightMatch(name, searchQuery)}
        </button>

        {/* Child count badge */}
        {hasChildren && (
          <span className="bg-vattjom-surface-primary text-vattjom-text-secondary text-xs px-6 py-1 rounded-button ml-8 shrink-0">
            {childCount}
          </span>
        )}

        <span className="text-xs text-dark-disabled ml-8 shrink-0">{node.classification}</span>
        <LabelCopyFields label={node} className="ml-8 shrink-0" />
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {node.labels!.map((child, i) => (
            <TreeNode
              key={child.id ?? `${child.classification}-${i}`}
              node={child}
              depth={depth + 1}
              isLast={i === node.labels!.length - 1}
              parentLines={[...parentLines, ...(depth > 0 ? [!isLast] : []), true]}
              searchQuery={searchQuery}
              nodePath={[...nodePath, i]}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const LabelTreeView: React.FC<LabelTreeViewProps> = ({ data, searchQuery = '', onNavigate }) => {
  const { t } = useTranslation(['labels']);

  if (data.length === 0) {
    return (
      <div className="text-center py-32 text-dark-secondary">
        <p>{t('labels:no_labels')}</p>
      </div>
    );
  }

  return (
    <div className="border border-divider rounded-button bg-background-content p-16 overflow-x-auto">
      <div className="relative">
        {data.map((node, i) => (
          <TreeNode
            key={node.id ?? `${node.classification}-${i}`}
            node={node}
            depth={0}
            isLast={i === data.length - 1}
            parentLines={[]}
            searchQuery={searchQuery}
            nodePath={[i]}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
};
