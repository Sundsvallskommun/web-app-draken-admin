import { LabelNode } from '@interfaces/label';
import { Button, useSnackbar } from '@sk-web-gui/react';
import { Check, Copy } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import { useEffect, useRef, useState } from 'react';

interface LabelCopyFieldsProps {
  label: LabelNode;
  className?: string;
}

export const LabelCopyFields: React.FC<LabelCopyFieldsProps> = ({ label, className = '' }) => {
  const { t } = useTranslation(['labels']);
  const message = useSnackbar();
  const [copied, setCopied] = useState(false);
  const resetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        window.clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(label.resourceName);
      setCopied(true);
      message({ message: t('labels:copy_success', { field: t('labels:properties.resourceName') }), status: 'success' });

      if (resetTimeoutRef.current) {
        window.clearTimeout(resetTimeoutRef.current);
      }

      resetTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      message({ message: t('labels:copy_error', { field: t('labels:properties.resourceName') }), status: 'error' });
    }
  };

  return (
    <Button
      size="sm"
      variant="tertiary"
      className={`inline-flex w-fit items-center gap-4 rounded-button border border-divider px-8 py-4 text-xs ${className}`.trim()}
      aria-label={t('labels:copy_field', { field: t('labels:properties.resourceName') })}
      title={t('labels:copy_field', { field: t('labels:properties.resourceName') })}
      onClick={handleCopy}
    >
      <span>{label.resourceName}</span>
      {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
    </Button>
  );
};
