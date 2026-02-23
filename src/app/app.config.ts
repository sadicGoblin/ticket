import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { ConfigService } from './services/config.service';
import { apiKeyInterceptor } from './interceptors/api-key.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiKeyInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: (configService: ConfigService) => () =>
        lastValueFrom(configService.loadSavedConfig()),
      deps: [ConfigService],
      multi: true,
    },
  ],
};
