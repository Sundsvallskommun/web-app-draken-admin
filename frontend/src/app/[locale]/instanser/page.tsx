'use client';

import LoaderFullScreen from '@components/loader/loader-fullscreen';
import DefaultLayout from '@layouts/default-layout/default-layout.component';
import Main from '@layouts/main/main.component';
import { ApiResponse, apiService } from '@services/api-service';
import { Card } from '@sk-web-gui/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface UserInstance {
  id: number;
  name: string;
  url: string;
}

const municipalityId = process.env.NEXT_PUBLIC_MUNICIPALITY_ID || '2281';

const buildSamlLoginUrl = (instanceUrl: string): string => {
  const isAbsolute = instanceUrl.startsWith('http://') || instanceUrl.startsWith('https://');
  const baseUrl = isAbsolute ? instanceUrl : `${window.location.origin}${instanceUrl}`;
  const samlLoginUrl = `${baseUrl}/api/saml/login`;
  const params = new URLSearchParams({
    successRedirect: baseUrl,
    failureRedirect: `${baseUrl}/login`,
  });
  return `${samlLoginUrl}?${params.toString()}`;
};

const Instances: React.FC = () => {
  const { t } = useTranslation();
  const [instances, setInstances] = useState<UserInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiService
      .get<ApiResponse<UserInstance[]>>(`instances/${municipalityId}/me`, { headers: { 'Cache-Control': 'no-cache' } })
      .then((res) => {
        const data = res.data.data;
        if (data.length === 1) {
          window.location.href = buildSamlLoginUrl(data[0].url);
          return;
        }
        setInstances(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <LoaderFullScreen />;
  }

  return (
    <DefaultLayout>
      <Main>
        <div className="max-w-screen-lg mx-auto py-40 px-20">
          <div className="mb-32">
            <h1 className="mb-8 text-h2-sm md:text-h2-md xl:text-h2-lg">{t('instances:title')}</h1>
          </div>

          {error && (
            <div className="p-20 rounded-lg bg-error-background-content border border-error text-error">
              {t('instances:error')}
            </div>
          )}

          {!error && instances.length === 0 && (
            <div className="p-20 rounded-lg bg-background-content border border-divider text-secondary">
              {t('instances:no_access')}
            </div>
          )}

          {instances.length > 0 && (
              <ul className="flex flex-wrap gap-32">
              {instances.map((instance) => (
                <Card
                  key={instance.id}
                  href={buildSamlLoginUrl(instance.url)}
                  layout='horizontal'
                  useHoverEffect
                  color="vattjom"
                  invert
                >
                  <Card.Body className="py-20 px-24">
                    <Card.Header>
                      <h2 className="text-h4-sm md:text-h4-md xl:text-h4-lg mb-16">{instance.name}</h2>
                    </Card.Header>
                  </Card.Body>
                </Card>
              ))}
            </ul>
          )}
        </div>
      </Main>
    </DefaultLayout>
  );
};

export default Instances;
