import { Button, FormControl, FormLabel, Input, Modal, Textarea } from '@sk-web-gui/react';
import { TemplateExport, TemplateImportData } from '@utils/template-export-import';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { capitalize } from 'underscore.string';

interface TemplateImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: TemplateImportData) => void;
  templateData: TemplateExport | null;
}

export const TemplateImportDialog: React.FC<TemplateImportDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  templateData,
}) => {
  const { t } = useTranslation();
  const [changeLog, setChangeLog] = useState('');

  const handleConfirm = () => {
    if (!templateData) return;

    onConfirm({
      identifier: templateData.template.identifier,
      name: templateData.template.name,
      description: templateData.template.description,
      metadata: templateData.template.metadata,
      defaultValues: templateData.template.defaultValues,
      content: templateData.template.content,
      versionIncrement: 'MAJOR',
      changeLog,
    });

    setChangeLog('');
  };

  const handleClose = () => {
    setChangeLog('');
    onClose();
  };

  if (!templateData) return null;

  return (
    <Modal show={isOpen} onClose={handleClose} label={capitalize(t('templates:import_template'))}>
      <Modal.Content>
        <div className="flex flex-col gap-16 w-full">
          <p>{t('templates:import_confirm_message')}</p>

          <FormControl className='w-full'>
            <FormLabel>{capitalize(t('templates:properties.identifier'))}</FormLabel>
            <Input value={templateData.template.identifier} readOnly />
          </FormControl>

          <FormControl className='w-full'>
            <FormLabel>{capitalize(t('templates:properties.name'))}</FormLabel>
            <Input value={templateData.template.name} readOnly />
          </FormControl>

          <FormControl className='w-full'>
            <FormLabel>{capitalize(t('templates:properties.changeLog'))}</FormLabel>
            <Textarea
            className='w-full'
              value={changeLog}
              onChange={(e) => setChangeLog(e.target.value)}
              placeholder={t('templates:import_changelog_placeholder')}
              rows={3}
            />
          </FormControl>
        </div>
      </Modal.Content>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          {capitalize(t('common:cancel'))}
        </Button>
        <Button color="vattjom" onClick={handleConfirm}>
          {capitalize(t('templates:import_template'))}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
