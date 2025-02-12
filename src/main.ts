import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { environment } from './environments/environment';
import { AppModule } from './app2/app.module';
import * as Sentry from '@sentry/angular-ivy';

// Make sure to call Sentry.init after importing AngularJS.
// You can also pass {angular: AngularInstance} to the Integrations.Angular() constructor.
Sentry.init({
  dsn: 'https://e22fa8ce182b4f8c935693a332111719@o4504961571291136.ingest.sentry.io/4505131181867008',
  integrations: [
    new Sentry.BrowserProfilingIntegration(),
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  profilesSampleRate: 1.0,
});
import '@angular/compiler';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
