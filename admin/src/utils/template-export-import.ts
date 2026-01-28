import { Template } from '@services/templating/templating-service';

export interface TemplateExport {
  exportVersion: '1.0';
  exportedAt: string;
  template: {
    identifier: string;
    name: string;
    description?: string;
    metadata: string;
    defaultValues: string;
    content: string;
  };
}

export interface TemplateImportData {
  identifier: string;
  name: string;
  description?: string;
  metadata: string;
  defaultValues: string;
  content: string;
  versionIncrement: 'MAJOR' | 'MINOR';
  changeLog: string;
}

/**
 * Export a template to a JSON file download
 */
export const exportTemplateToJson = (template: Template): void => {
  const exportData: TemplateExport = {
    exportVersion: '1.0',
    exportedAt: new Date().toISOString(),
    template: {
      identifier: template.identifier || '',
      name: template.name || '',
      description: template.description,
      metadata: template.metadata || '[]',
      defaultValues: template.defaultValues || '[]',
      content: template.content || '',
    },
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `template-${template.identifier || 'export'}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Validate that the imported data has the correct structure
 */
export const validateTemplateImport = (data: unknown): TemplateExport | null => {
  if (!data || typeof data !== 'object') return null;

  const obj = data as Record<string, unknown>;

  if (obj.exportVersion !== '1.0') return null;
  if (typeof obj.exportedAt !== 'string') return null;
  if (!obj.template || typeof obj.template !== 'object') return null;

  const template = obj.template as Record<string, unknown>;
  if (typeof template.identifier !== 'string' || !template.identifier) return null;
  if (typeof template.name !== 'string') return null;
  if (typeof template.content !== 'string') return null;
  if (typeof template.metadata !== 'string') return null;
  if (typeof template.defaultValues !== 'string') return null;

  return data as TemplateExport;
};

/**
 * Read and parse a JSON file, returning the validated template export data
 */
export const readTemplateFile = (file: File): Promise<TemplateExport | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        resolve(validateTemplateImport(json));
      } catch {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });
};
