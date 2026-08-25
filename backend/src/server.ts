import App from '@/app';
import { IndexController } from '@controllers/index.controller';
import validateEnv from '@utils/validateEnv';
import { FeatureFlagController } from './controllers/featureflags.controller';
import { HealthController } from './controllers/health.controller';
import { JsonSchemaController } from './controllers/jsonschema.controller';
import { LabelsController } from './controllers/labels.controller';
import { NamespaceController } from './controllers/namespace.controller';
import { RolesController } from './controllers/roles.controller';
import { StatusesController } from './controllers/statuses.controller';
import { CategoriesController } from './controllers/categories.controller';
import { CompareController } from './controllers/compare.controller';
import { ContactReasonsController } from './controllers/contact-reasons.controller';
import { EmailIntegrationController } from './controllers/email-integration.controller';
import { EnvironmentController } from './controllers/environment.controller';
import { TemplateController } from './controllers/templates.controller';
import { UserController } from './controllers/user.controller';

validateEnv();

const app = new App([
  IndexController,
  UserController,
  HealthController,
  TemplateController,
  CompareController,
  FeatureFlagController,
  NamespaceController,
  RolesController,
  StatusesController,
  ContactReasonsController,
  CategoriesController,
  EmailIntegrationController,
  EnvironmentController,
  JsonSchemaController,
  LabelsController,
]);

app.listen();
