import App from '@/app';
import { IndexController } from '@controllers/index.controller';
import validateEnv from '@utils/validateEnv';
import { FeatureFlagController } from './controllers/featureflags.controller';
import { HealthController } from './controllers/health.controller';
import { NamespaceController } from './controllers/namespace.controller';
import { RolesController } from './controllers/roles.controller';
import { StatusesController } from './controllers/statuses.controller';
import { TemplateController } from './controllers/templates.controller';
import { UserController } from './controllers/user.controller';

validateEnv();

const app = new App([
  IndexController,
  UserController,
  HealthController,
  TemplateController,
  FeatureFlagController,
  NamespaceController,
  RolesController,
  StatusesController,
]);

app.listen();
