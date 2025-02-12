import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { Store } from '@ngxs/store';
import { UserState } from '../store/user/user.state';
import * as Sentry from '@sentry/angular';
import { version } from '../shared/constants/sentry-release-version.constant';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService implements ErrorHandler {
  constructor(private injector: Injector) {
    Sentry.init({
      dsn: 'https://e22fa8ce182b4f8c935693a332111719@o4504961571291136.ingest.sentry.io/4505131181867008',
      release: version,
    });
  }

  async handleError(
    error: any,
    meta = null, // pass object with key value pairs to pass as extras or context when logging to sentry
    fingerprint = null, // pass fingerprint as a string array to customize which group an error should show up in on sentry
    logToConsole = true, // pass false if the error shouldn't be logged to console
    logAsString = false,
    tags = {} // custom tags object. can contain multiple tag key and value
  ): Promise<void> {
    if (logToConsole) {
      console.error(error);
    }
    let userMeta;
    try {
      let currentUser: any = await this.getCurrentUser();
      if (currentUser) {
        userMeta = {
          id: currentUser.id,
          userName: currentUser.userName,
          type: currentUser.type,
          isAdmin: currentUser.isAdmin,
          isReadOnly: currentUser.isReadOnly,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          firmId: currentUser.firmInfo.id,
        };
      }
    } catch (ex) {}

    try {
      if (!(error instanceof Error) && !logAsString) {
        error = new Error(JSON.stringify(error));
      }

      Sentry.withScope((scope) => {
        if (userMeta) {
          scope.setUser({
            id: userMeta.id,
            isAdmin: userMeta.isAdmin,
            isReadOnly: userMeta.isReadOnly,
            type: userMeta.type,
          });
          scope.setTag('firmId', userMeta.firmId);
        }
        if (meta) {
          // loop through each key in meta and set it as an extra
          Object.keys(meta).forEach((key) => scope.setExtra(key, meta[key]));

          // Todo - replace extra with context as sentry has deprecated extras, but not removed it.
          // But context doesn't be to working for certain cases like logging payload. maybe specific cases.
          //scope.setContext('Custom Data', meta);
        }
        if (Object.keys(tags).length > 0) {
          Object.keys(tags).forEach((tagKey) => {
            scope.setTag(tagKey, tags[tagKey]);
          });
        }

        if (fingerprint) {
          scope.setFingerprint(fingerprint);
        }

        Sentry.captureException(error);
      });
    } catch (ex) {}
  }

  async getCurrentUser(currentAttempt = 0, maxRetryAttempts = 3, delay = 5000) {
    const store = this.injector.get(Store);
    return new Promise((resolve, reject) => {
      let currentUser = store.selectSnapshot(UserState.getCurrentUserData);
      if (!currentUser && currentAttempt < maxRetryAttempts) {
        setTimeout(
          async () => resolve(await this.getCurrentUser(currentAttempt + 1)),
          delay
        );
      } else {
        resolve(currentUser);
      }
    });
  }
}
