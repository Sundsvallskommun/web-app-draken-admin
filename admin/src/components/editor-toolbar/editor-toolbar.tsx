import resources from '@config/resources';
import { ResourceName } from '@interfaces/resource-name';
import { PreviewTemplate, Template } from '@services/templating/templating-service';
import { Button, Icon, useConfirm } from '@sk-web-gui/react';
import { useCrudHelper } from '@utils/use-crud-helpers';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { useResource } from '@utils/use-resource';
import { exportTemplateToJson } from '@utils/template-export-import';
import { Download, Save, Trash } from 'lucide-react';
import { useRouter } from 'next/router';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { capitalize } from 'underscore.string';

interface ToolbarProps {
  resource: ResourceName;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  id?: any;
  isDirty?: boolean;
}

export const EditorToolbar: React.FC<ToolbarProps> = ({ resource, isDirty, id }) => {
  const router = useRouter();
  const parentPath = resource ? `/${resource}` : router.pathname.split('/[')[0].replace('/new', '');
  const { remove } = resources[resource];
  const { refresh } = useResource(resource as ResourceName);
  const { handleRemove } = useCrudHelper(resource);
  const confirm = useConfirm();
  const { reset, watch } = useFormContext();
  const { municipalityId } = useLocalStorage();

  const content = watch('content');
  const namespace = watch('namespace');

  const previewTemplate = () => {
    PreviewTemplate(content as string).then((res) => {
      const uri = `data:application/pdf;base64,${res.data?.output}`;
      const link = document.createElement('a');
      link.href = uri;
      link.setAttribute('download', `preview.pdf`);
      document.body.appendChild(link);
      link.click();
    });
  };

  const exportTemplate = () => {
    const formData = watch();
    exportTemplateToJson(formData as Template);
  };

  const onRemove = () => {
    if (remove && id) {
      confirm
        .showConfirmation(
          capitalize(t('common:remove_resource', { resource: t(`${resource}:name_one`) })),
          capitalize(t('common:can_not_be_undone')),
          capitalize(t('common:remove')),
          capitalize(t('common:keep_edit')),
          'error'
        )
        .then((confirm) => {
          if (confirm) {
            handleRemove(() => remove?.(municipalityId, namespace, id)).then((res) => {
              if (res) {
                reset();
                refresh();
                router.push(parentPath);
              }
            });
          }
        });
    } else if (!id) {
      router.push(parentPath);
    }
  };

  const { t } = useTranslation();
  return (
    <Button.Group className="absolute top-40 right-48 w-fit">
      <Button
        type="submit"
        color="vattjom"
        size="sm"
        data-cy="edit-toolbar-save"
        showBackground={false}
        leftIcon={<Save />}
        disabled={!isDirty}
        iconButton
        aria-label={capitalize(t('common:save'))}
      ></Button>

      {((!!remove && id) || !id) && resource !== 'templates' && (
        <>
          <Button
            variant="tertiary"
            color="error"
            showBackground={false}
            data-cy="edit-toolbar-delete"
            iconButton
            aria-label={capitalize(t('common:remove', { resource: t(`${resource}:name_one`) }))}
            size="sm"
            onClick={() => onRemove()}
          >
            <Icon icon={<Trash />} />
          </Button>
        </>
      )}
      {resource === 'templates' && (
        <>
          <Button
            variant="tertiary"
            showBackground={false}
            data-cy="edit-toolbar-export"
            aria-label={t(`templates:export_template`)}
            size="sm"
            onClick={() => exportTemplate()}
            leftIcon={<Download />}
          >
            {t(`templates:export_template`)}
          </Button>
          <Button
            variant="tertiary"
            showBackground={false}
            data-cy="edit-toolbar-preview"
            aria-label={t(`templates:preview_template`)}
            size="sm"
            onClick={() => previewTemplate()}
          >
            {t(`templates:preview_template`)}
          </Button>
        </>
      )}
    </Button.Group>
  );
};
