import App from '@/app';
import { IndexController } from '@controllers/index.controller';
import validateEnv from '@utils/validateEnv';
import { UserController } from './controllers/user.controller';
import { HealthController } from './controllers/health.controller';
import { TemplateController } from './controllers/templates.controller';
import { FeatureFlagController } from './controllers/featureflags.controller';

validateEnv();

const app = new App([IndexController, UserController, HealthController, TemplateController, FeatureFlagController]);

app.listen();
