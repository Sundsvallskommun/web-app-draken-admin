import { LabelNode } from '@interfaces/label';
import { getLabels, saveLabels } from '@services/label-service';
import { Button, FormControl, FormLabel, Input, Spinner, useSnackbar } from '@sk-web-gui/react';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { LabelTreeView } from '@components/labels/label-tree-view.component';
import { ChevronRight, FolderOpen, List, Network, Pencil, Plus, Tag, Trash, X } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface LabelsAdminProps {
  namespace: string;
}

interface SearchResult {
  label: LabelNode;
  breadcrumb: string[];
  parentPath: number[];
}

/** Count all descendants (children, grandchildren, etc.) of a node */
const countDescendants = (node: LabelNode): number => {
  if (!node.labels || node.labels.length === 0) return 0;
  return node.labels.reduce((sum, child) => sum + 1 + countDescendants(child), 0);
};

/** Get the max depth of a node's subtree (1 = leaf, 2 = has children, etc.) */
const maxDepth = (node: LabelNode): number => {
  if (!node.labels || node.labels.length === 0) return 1;
  return 1 + Math.max(...node.labels.map(maxDepth));
};

/** Find a node in the tree by path of indices */
const getNodeAtPath = (tree: LabelNode[], path: number[]): LabelNode[] => {
  let current = tree;
  for (const index of path) {
    current = current[index]?.labels ?? [];
  }
  return current;
};

/** Clone tree and apply a mutation at the given path */
const mutateAtPath = (
  tree: LabelNode[],
  path: number[],
  mutate: (children: LabelNode[]) => LabelNode[]
): LabelNode[] => {
  if (path.length === 0) {
    return mutate([...tree]);
  }

  return tree.map((node, i) => {
    if (i === path[0]) {
      if (path.length === 1) {
        return { ...node, labels: mutate([...(node.labels ?? [])]) };
      }
      return { ...node, labels: mutateAtPath(node.labels ?? [], path.slice(1), mutate) };
    }
    return node;
  });
};

/** Strip client-side fields before sending to API */
const stripForApi = (labels: LabelNode[]): LabelNode[] => {
  return labels.map((label) => ({
    ...(label.id ? { id: label.id } : {}),
    classification: label.classification,
    displayName: label.displayName,
    resourceName: label.resourceName,
    ...(label.resourcePath ? { resourcePath: label.resourcePath } : {}),
    ...(label.labels && label.labels.length > 0 ? { labels: stripForApi(label.labels) } : {}),
  }));
};

const RESOURCE_NAME_PATTERN = /^[A-Z0-9_]+$/;

const toResourceName = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

const isValidResourceName = (value: string): boolean => RESOURCE_NAME_PATTERN.test(value);

/** Recursively search the tree and return matching labels with their breadcrumb path */
const searchTree = (
  nodes: LabelNode[],
  query: string,
  breadcrumb: string[],
  currentPath: number[]
): SearchResult[] => {
  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  nodes.forEach((node, index) => {
    const name = node.displayName || node.classification;
    const nodePath = [...currentPath, index];
    const nodeBreadcrumb = [...breadcrumb, name];

    if (name.toLowerCase().includes(lowerQuery)) {
      results.push({
        label: node,
        breadcrumb: nodeBreadcrumb,
        parentPath: currentPath,
      });
    }

    if (node.labels && node.labels.length > 0) {
      results.push(...searchTree(node.labels, query, nodeBreadcrumb, nodePath));
    }
  });

  return results;
};

export const LabelsAdmin: React.FC<LabelsAdminProps> = ({ namespace }) => {
  const { t } = useTranslation(['labels', 'common']);
  const message = useSnackbar();
  const { municipalityId } = useLocalStorage();

  const [data, setData] = useState<LabelNode[]>([]);
  const [path, setPath] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');

  // UI state
  const [isAdding, setIsAdding] = useState(false);
  const [addDisplayName, setAddDisplayName] = useState('');
  const [addResourceName, setAddResourceName] = useState('');
  const [addResourceNameManuallySet, setAddResourceNameManuallySet] = useState(false);
  const [addClassification, setAddClassification] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editResourceName, setEditResourceName] = useState('');
  const [editResourceNameManuallySet, setEditResourceNameManuallySet] = useState(false);
  const [editClassification, setEditClassification] = useState('');
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  const fetchLabels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLabels(municipalityId, namespace);
      const labels = res.data.data ?? [];
      setData(labels);
      setIsNew(labels.length === 0);
      setPath([]);
    } catch {
      message({ message: t('labels:load_error'), status: 'error' });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [municipalityId, namespace]);

  useEffect(() => {
    if (namespace) {
      fetchLabels();
    }
  }, [namespace, fetchLabels]);

  const suggestedClassification = (): string => {
    const siblings = getNodeAtPath(data, path);
    if (siblings.length > 0) return siblings[0].classification;
    if (path.length === 0) return 'CATEGORY';
    if (path.length === 1) return 'TYPE';
    if (path.length === 2) return 'SUBTYPE';
    return '';
  };

  const currentChildren = getNodeAtPath(data, path);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchTree(data, searchQuery.trim(), [], []);
  }, [data, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;
  const addResourceNameIsValid = isValidResourceName(addResourceName.trim());
  const editResourceNameIsValid = isValidResourceName(editResourceName.trim());

  // Build breadcrumb items
  const breadcrumbs: { label: string; pathTo: number[] }[] = [{ label: t('labels:root'), pathTo: [] }];
  let accPath: number[] = [];
  for (const idx of path) {
    const node = getNodeAtPath(data, accPath)[idx];
    accPath = [...accPath, idx];
    if (node) {
      breadcrumbs.push({ label: node.displayName || node.classification, pathTo: [...accPath] });
    }
  }

  const persistTree = async (newTree: LabelNode[]) => {
    setSaving(true);
    try {
      const res = await saveLabels(municipalityId, namespace, stripForApi(newTree), isNew);
      const labels = res.data.data ?? [];
      setData(labels);
      setIsNew(false);
      message({ message: t('labels:save_success'), status: 'success' });
    } catch {
      message({ message: t('labels:save_error'), status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    const displayName = addDisplayName.trim();
    const resourceName = addResourceName.trim();
    const classification = addClassification.trim();
    if (!displayName || !resourceName || !classification || !isValidResourceName(resourceName)) return;

    const newLabel: LabelNode = {
      classification,
      displayName,
      resourceName,
      labels: [],
    };

    const newTree = mutateAtPath(data, path, (children) => [...children, newLabel]);
    setData(newTree);
    setAddDisplayName('');
    setAddResourceName('');
    setAddResourceNameManuallySet(false);
    setAddClassification('');
    setIsAdding(false);
    await persistTree(newTree);
  };

  const handleEdit = async (index: number) => {
    const displayName = editDisplayName.trim();
    const resourceName = editResourceName.trim();
    const classification = editClassification.trim();
    if (!displayName || !resourceName || !classification || !isValidResourceName(resourceName)) return;

    const newTree = mutateAtPath(data, path, (children) =>
      children.map((child, i) =>
        i === index
          ? {
              ...child,
              classification,
              displayName,
              resourceName,
            }
          : child
      )
    );
    setData(newTree);
    setEditingIndex(null);
    setEditDisplayName('');
    setEditResourceName('');
    setEditResourceNameManuallySet(false);
    setEditClassification('');
    await persistTree(newTree);
  };

  const handleDelete = async (index: number) => {
    const newTree = mutateAtPath(data, path, (children) => children.filter((_, i) => i !== index));
    setData(newTree);
    setDeleteConfirmIndex(null);
    await persistTree(newTree);
  };

  const handleDrillDown = (index: number) => {
    setPath([...path, index]);
    resetUIState();
  };

  const handleSearchNavigate = (result: SearchResult) => {
    setPath(result.parentPath);
    setSearchQuery('');
    resetUIState();
  };

  const resetUIState = () => {
    setIsAdding(false);
    setAddDisplayName('');
    setAddResourceName('');
    setAddResourceNameManuallySet(false);
    setAddClassification('');
    setEditingIndex(null);
    setEditDisplayName('');
    setEditResourceName('');
    setEditResourceNameManuallySet(false);
    setEditClassification('');
    setDeleteConfirmIndex(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-64">
        <Spinner size={4} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-24">
      {/* Search + view toggle */}
      {data.length > 0 && (
        <div className="flex items-end gap-16">
          <FormControl className="flex-grow">
            <FormLabel>{t('labels:search_label')}</FormLabel>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchQuery('');
                }
              }}
            />
          </FormControl>
          <div className="flex gap-4 shrink-0">
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'primary' : 'tertiary'}
              iconButton
              onClick={() => setViewMode('list')}
              aria-label={t('labels:view_list')}
            >
              <List size={18} />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'tree' ? 'primary' : 'tertiary'}
              iconButton
              onClick={() => setViewMode('tree')}
              aria-label={t('labels:view_tree')}
            >
              <Network size={18} />
            </Button>
          </div>
        </div>
      )}

      {/* Tree view */}
      {viewMode === 'tree' ? (
        <LabelTreeView
          data={data}
          searchQuery={searchQuery}
          onNavigate={(nodePath) => {
            setPath(nodePath);
            setViewMode('list');
            setSearchQuery('');
            resetUIState();
          }}
        />
      ) : isSearching ? (
        <div className="flex flex-col gap-8">
          {searchResults.length === 0 ? (
            <p className="text-dark-secondary py-16">
              {t('labels:search_no_results', { query: searchQuery })}
            </p>
          ) : (
            <>
              <p className="text-dark-secondary">
                {t('labels:search_results_count', { count: searchResults.length })}
              </p>
              {searchResults.map((result, i) => {
                const childCount = result.label.labels?.length ?? 0;
                return (
                  <button
                    key={result.label.id ?? `search-${i}`}
                    className="flex items-center gap-12 p-12 rounded-button border border-divider bg-background-content hover:bg-background-200 text-left cursor-pointer"
                    onClick={() => handleSearchNavigate(result)}
                  >
                    <span className="text-dark-secondary">
                      {childCount > 0 ? <FolderOpen size={18} /> : <Tag size={18} />}
                    </span>
                    <div className="flex flex-col gap-2">
                      <span className="font-medium">
                        {result.label.displayName || result.label.classification}
                      </span>
                      <span className="text-sm text-dark-secondary flex items-center gap-4">
                        {result.breadcrumb.map((part, j) => (
                          <span key={j} className="flex items-center gap-4">
                            {j > 0 && <ChevronRight size={12} />}
                            {part}
                          </span>
                        ))}
                      </span>
                    </div>
                    {childCount > 0 && (
                      <span className="bg-vattjom-surface-primary text-vattjom-text-secondary text-xs px-8 py-2 rounded-button ml-auto">
                        {childCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>
      ) : (
        <>
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-8 flex-wrap">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-8">
                {i > 0 && <ChevronRight size={14} className="text-dark-disabled" />}
                {i < breadcrumbs.length - 1 ? (
                  <button
                    className="text-info hover:underline cursor-pointer"
                    onClick={() => {
                      setPath(crumb.pathTo);
                      resetUIState();
                    }}
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="font-bold">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>

          {/* Help text */}
          {data.length > 0 && path.length === 0 && (
            <p className="text-dark-secondary">{t('labels:help_text')}</p>
          )}

          {/* Label list */}
          <div className="flex flex-col gap-8">
            {currentChildren.length === 0 && !isAdding && (
              <div className="text-center py-32 text-dark-secondary">
                <p className="mb-8">{t('labels:no_labels')}</p>
                <p>{t('labels:no_labels_hint')}</p>
              </div>
            )}

            {currentChildren.map((label, index) => {
              const childCount = label.labels?.length ?? 0;
              const isEditing = editingIndex === index;
              const isDeleting = deleteConfirmIndex === index;

              return (
                <div
                  key={label.id ?? `${label.classification}-${index}`}
                  className="flex items-center gap-12 p-12 rounded-button border border-divider bg-background-content hover:bg-background-200 group"
                >
                  {/* Icon */}
                  <span className="text-dark-secondary">
                    {childCount > 0 ? <FolderOpen size={18} /> : <Tag size={18} />}
                  </span>

                  {isEditing ? (
                    /* Inline edit */
                    <div className="flex items-center gap-8 flex-grow">
                      <div className="flex flex-col gap-8 flex-grow">
                        <Input
                          className="flex-grow"
                          size="sm"
                          value={editDisplayName}
                          placeholder={t('labels:properties.displayName')}
                          onChange={(e) => {
                            const value = e.target.value;
                            setEditDisplayName(value);
                            if (!editResourceNameManuallySet) {
                              setEditResourceName(toResourceName(value));
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEdit(index);
                            if (e.key === 'Escape') resetUIState();
                          }}
                          autoFocus
                        />
                        <Input
                          className="flex-grow"
                          size="sm"
                          value={editResourceName}
                          placeholder={t('labels:properties.resourceName')}
                          onChange={(e) => {
                            setEditResourceNameManuallySet(true);
                            setEditResourceName(toResourceName(e.target.value));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEdit(index);
                            if (e.key === 'Escape') resetUIState();
                          }}
                        />
                        {!editResourceNameIsValid && editResourceName.trim().length > 0 && (
                          <p className="text-xs text-error">{t('labels:resource_name_invalid')}</p>
                        )}
                        <Input
                          className="flex-grow"
                          size="sm"
                          value={editClassification}
                          placeholder={t('labels:properties.classification')}
                          onChange={(e) => setEditClassification(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEdit(index);
                            if (e.key === 'Escape') resetUIState();
                          }}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleEdit(index)}
                        disabled={saving || !editDisplayName.trim() || !editResourceName.trim() || !editClassification.trim() || !editResourceNameIsValid}
                      >
                        {t('common:save')}
                      </Button>
                      <Button
                        size="sm"
                        variant="tertiary"
                        onClick={() => resetUIState()}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ) : isDeleting ? (
                    /* Delete confirmation */
                    <div className="flex items-center gap-8 flex-grow">
                      <span className="flex-grow">
                        {t('labels:delete_confirm')} <strong>{label.displayName || label.classification}</strong>
                        {childCount > 0 && ` ${t('labels:delete_with_children', { count: countDescendants(label) })}`}?
                      </span>
                      <Button size="sm" color="error" onClick={() => handleDelete(index)} disabled={saving}>
                        {t('labels:delete_confirm')}
                      </Button>
                      <Button size="sm" variant="tertiary" onClick={() => setDeleteConfirmIndex(null)}>
                        {t('common:cancel')}
                      </Button>
                    </div>
                  ) : (
                    /* Normal display */
                    <>
                      <button
                        className="flex items-center gap-8 flex-grow text-left cursor-pointer"
                        onClick={() => handleDrillDown(index)}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-8">
                            <span className="font-medium">{label.displayName || label.classification}</span>
                            {childCount > 0 && (
                              <span className="bg-vattjom-surface-primary text-vattjom-text-secondary text-xs px-8 py-2 rounded-button">
                                {childCount}
                              </span>
                            )}
                          </div>
                          {path.length === 0 && childCount > 0 && (
                            <span className="text-xs text-dark-secondary">
                              {t('labels:depth_summary', {
                                levels: maxDepth(label) - 1,
                                total: countDescendants(label),
                              })}
                            </span>
                          )}
                        </div>
                      </button>
                      <span className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="tertiary"
                          iconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingIndex(index);
                            setEditDisplayName(label.displayName ?? '');
                            setEditResourceName(label.resourceName ?? '');
                            setEditResourceNameManuallySet(false);
                            setEditClassification(label.classification ?? '');
                            setDeleteConfirmIndex(null);
                            setIsAdding(false);
                          }}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="tertiary"
                          iconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmIndex(index);
                            setEditingIndex(null);
                            setIsAdding(false);
                          }}
                        >
                          <Trash size={16} />
                        </Button>
                      </span>
                    </>
                  )}
                </div>
              );
            })}

            {/* Inline add */}
            {isAdding && (
              <div className="flex items-center gap-8 p-12 rounded-button border border-divider border-dashed bg-background-content">
                <Plus size={18} className="text-dark-secondary" />
                <div className="flex flex-col gap-4 flex-grow">
                  <Input
                    className="flex-grow"
                    size="sm"
                    placeholder={t('labels:placeholder_new')}
                    value={addDisplayName}
                    onChange={(e) => {
                      const value = e.target.value;
                      setAddDisplayName(value);
                      if (!addResourceNameManuallySet) {
                        setAddResourceName(toResourceName(value));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdd();
                      if (e.key === 'Escape') resetUIState();
                    }}
                    autoFocus
                  />
                  <Input
                    className="flex-grow"
                    size="sm"
                    placeholder={t('labels:properties.resourceName')}
                    value={addResourceName}
                    onChange={(e) => {
                      setAddResourceNameManuallySet(true);
                      setAddResourceName(toResourceName(e.target.value));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdd();
                      if (e.key === 'Escape') resetUIState();
                    }}
                  />
                  {!addResourceNameIsValid && addResourceName.trim().length > 0 && (
                    <p className="text-xs text-error">{t('labels:resource_name_invalid')}</p>
                  )}
                  <Input
                    className="flex-grow"
                    size="sm"
                    placeholder={t('labels:properties.classification')}
                    value={addClassification}
                    onChange={(e) => setAddClassification(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdd();
                      if (e.key === 'Escape') resetUIState();
                    }}
                  />
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleAdd}
                  disabled={saving || !addDisplayName.trim() || !addResourceName.trim() || !addClassification.trim() || !addResourceNameIsValid}
                >
                  {t('common:save')}
                </Button>
                <Button
                  size="sm"
                  variant="tertiary"
                  onClick={() => resetUIState()}
                >
                  <X size={16} />
                </Button>
              </div>
            )}
          </div>

          {/* Add button */}
          {!isAdding && (
            <div>
              <Button
                size="sm"
                variant="tertiary"
                leftIcon={<Plus size={16} />}
                onClick={() => {
                  setIsAdding(true);
                  setAddClassification(suggestedClassification());
                  setEditingIndex(null);
                  setDeleteConfirmIndex(null);
                }}
                disabled={saving}
              >
                {t('labels:add_label')}
              </Button>
            </div>
          )}

          {saving && (
            <div className="flex items-center gap-8 text-dark-secondary">
              <Spinner size={2} />
            </div>
          )}
        </>
      )}
    </div>
  );
};
