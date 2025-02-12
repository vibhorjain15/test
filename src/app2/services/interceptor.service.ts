import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import {
  catchError,
  delay,
  filter,
  finalize,
  retryWhen,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';
import { SweetAlertService } from './sweet-alert.service';
import { RouterService } from './router.service';
import { ToastrService } from 'ngx-toastr';
import { ModalService } from './modal.service';
import {
  authenticationUrls,
  baseUrl,
  ErrorStatusCode,
  firstLoadUrls,
  SKIP_400_ALERT,
  SKIP_404_REDIRECTION,
  SKIP_AUTH_FAILURE_REDIRECTION,
  SKIP_BAD_GATEWAY_ALERT,
  SKIP_INTERNAL_SERVER_ERROR_ALERT,
} from '../shared/constants/constant';
import { ErrorHandlerService } from './error-handler.service';
import { CustomModalService } from './modal/customModal.service';

@Injectable()
export class InterceptorService implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    null
  );
  private errorHandler;
  constructor(
    //private readonly router: Router,
    private readonly injector: Injector,
    private readonly http: HttpClient
  ) {}
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (req.url.includes('blob.core.windows.net')) {
      return next.handle(req);
    }
    const auth_token = localStorage.getItem('dv_access_token');
    let headers = req.headers
      // *Default Headers
      .set('If-Modified-Since', 'Mon, 26 Jul 1997 05:00:00 GMT')
      .set('Cache-Control', 'no-cache')
      .set('Pragma', 'no-cache')
      .set('Authorization', `Bearer ${auth_token}`);
    // *loginUrlEncodingInterceptor
    if (req.url === authenticationUrls.login) {
      headers = headers.set(
        'Content-Type',
        'application/x-www-form-urlencoded;charset=utf-8'
      );
      req.serializeBody();
    }
    // *httpRequestInterceptor
    if (!headers.get('page-url')) {
      headers = headers.set(
        'page-url',
        window.location.hash.slice(1)
          ? window.location.hash.slice(1)
          : 'app/home'
      );
    }

    if (req.method == 'GET' && firstLoadUrls.includes(`${req.url}`))
      headers = headers.set('page-url', 'app/home');

    let newRequest: HttpRequest<any>;
    if (!req.url.includes('i18n')) {
      newRequest = req.clone({ headers, url: `${baseUrl}${req.url}` });
    } else {
      newRequest = req.clone({ headers, url: req.url });
    }

    return next.handle(newRequest).pipe(
      tap((evt) => {
        if (evt instanceof HttpResponse) {
          if (evt.status === ErrorStatusCode.PartialContent) {
            localStorage.setItem('dv_access_token', 'PartialContent');
          }
        }
      }),
      catchError((error) => {
        try {
          let payload = '';
          try {
            payload = newRequest?.body ? JSON.stringify(newRequest.body) : '';
          } catch (err) {
            // if request body is not stringifiable, show it as 'Unavailable' on sentry
            payload = 'Unavailable';
          }

          if (
            !(
              error?.status &&
              [
                ErrorStatusCode.Unauthorized,
                ErrorStatusCode.Forbidden,
              ].includes(error.status) &&
              error instanceof HttpErrorResponse
            )
          ) {
            // create fingerprint for sentry for specific error
            let fingerprint = ['{{ default }}'];

            if (newRequest?.url) {
              fingerprint.push(newRequest.url);
            }

            if (newRequest?.method) {
              fingerprint.push(newRequest.method);
            }

            if (error?.status) {
              fingerprint.push(error.status.toString());
            }

            // log only if error is not 401 or 403
            this.logToSentry(
              new Error(
                `Http Error ${error?.status?.toString() || ''}: ${
                  newRequest?.method || ''
                } - ${newRequest?.url || newRequest?.urlWithParams || ''}`
              ),
              {
                payload: payload,
                url: newRequest?.urlWithParams || newRequest?.url || '',
                method: newRequest?.method || '',
                status: error?.status?.toString() || '',
                error: error ? JSON.stringify(error) : '',
              },
              fingerprint,
              false
            );
          }
        } catch (err) {}
        // *badRequestInterceptor
        const SweetAlert = this.injector.get(SweetAlertService);
        const state = this.injector.get(RouterService);
        const toaster = this.injector.get(ToastrService);
        const ModalFactory = this.injector.get(ModalService);
        const is_activate_url =
          state.getState()?.next === 'authentication.activate';

        if (
          Object.values(authenticationUrls).find((url) =>
            `${url}`.includes(`${req.url}`)
          )
        )
          return throwError(error);

        if (
          error.status === ErrorStatusCode.BadRequest &&
          (error.error?.message || error.error?.error_description) &&
          !newRequest.context.get(SKIP_400_ALERT)
        ) {
          let errorMessages: any = '';
          if (error.error.modelState) {
            errorMessages = Object.values(error.error.modelState)[0];
          }
          SweetAlert.error({
            title: error.error.error_description
              ? error.error.error_description
              : error.error.message,
            text: errorMessages,
            confirmButtonText: 'Okay',
          });
        }
        // *resourceNotFoundInterceptor
        if (error.status === ErrorStatusCode.ResourceNotFound) {
        }
        if (
          error.status === ErrorStatusCode.ResourceNotFound &&
          !newRequest.context.get(SKIP_404_REDIRECTION)
        ) {
          setTimeout(()=>{
            state.navigate('app.home');
          }, 100)
          toaster.warning('The resource you are looking for cannot be found');
          ModalFactory && ModalFactory?.closeAllActiveModals();
        }
        // *serviceUnavailableInterceptor
        if (error.status === ErrorStatusCode.ServiceUnavailable) {
          toaster.error('Service Unavailable! Please try after some time');
        }
        // *badGatewayInterceptor
        if (
          error.status === ErrorStatusCode.BadGateway &&
          !newRequest.context.get(SKIP_BAD_GATEWAY_ALERT)
        ) {
          toaster.error('Bad Gateway! Please try after some time');
        }
        // *forbiddenRequestInterceptor
        if (error.status === ErrorStatusCode.Forbidden) {
          toaster.error('You do not have the required permissions to view this selection. Please contact your administrator for further assistance or to request access.', '', {
            onActivateTick: true,
            timeOut: 5000
          });
          if (
            (error.config && error.config?.method === 'GET') ||
            newRequest?.method === 'GET'
          ) {
            setTimeout(()=>{
              state.navigate('app.home');
            }, 100)
            
          }
        }
        // *connectionFailedInterceptor
        if (error.status === ErrorStatusCode.ConnectionFailed) {
          toaster.error(
            'Please contact your IT team to whitelist *.diligencevault.com domain. If there are further issues, please contact us at ask@diligencevault.com.',
            '',
            { timeOut: 5000 }
          );
        }
        // *unauthorizedRedirectionInterceptor (not now)
        if (
          error.status === ErrorStatusCode.InternalServerError &&
          !newRequest.context.get(SKIP_INTERNAL_SERVER_ERROR_ALERT)
        ) {
          toaster.error(
            'We are sorry for the inconvenience, our developers are notified of the issue and are working to fix the issue at the earliest.',
            'An internal server error occurred!',
            { timeOut: 5000 }
          );
        }
        if (
          error.status === ErrorStatusCode.Unauthorized &&
          error instanceof HttpErrorResponse &&
          !is_activate_url &&
          !newRequest.context.get(SKIP_AUTH_FAILURE_REDIRECTION)
        ) {
          return this.handle401Error(newRequest, next, error);
        }

        return throwError(error);
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string) {
    return request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler,
    error = null
  ) {
    // If Refresh token api is not already in progress
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter((token) => token != null),
        take(1),
        switchMap((jwt) => {
          return next.handle(this.addToken(request, jwt));
        })
      );
    } else {
      const refresh_token = localStorage
        ? localStorage.getItem('dv_refresh_token')
        : null;
      if (refresh_token) {
        this.isRefreshing = true;
        let refreshCounter = 0;
        let maxRetryAttempts = 1;
        this.refreshTokenSubject.next(null);
        const formData = new URLSearchParams();
        formData.set('refresh_token', refresh_token);
        formData.set('grant_type', 'refresh_token');
        formData.set('client_id', 'DvApp');
        // Extra params for Differentiation
        formData.set('client_id_1', 'DvApp');
        return this.http
          .post<any>('auth/token', formData, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            },
          })
          .pipe(
            finalize(() => {
              refreshCounter++;
              if (refreshCounter > maxRetryAttempts) {
                localStorage.removeItem('dv_refresh_token');
                localStorage.removeItem('dv_access_token');
                localStorage.removeItem('jwt');
                window.location.href = '/';
              }
            }),
            // can be removed in prod
            retryWhen((errors) =>
              errors.pipe(
                delay(1000),
                take(maxRetryAttempts),
                tap(() => {
                  formData.set(
                    'refresh_token',
                    localStorage.getItem('dv_refresh_token')
                  );
                  formData.set('grant_type', 'refresh_token');
                  formData.set('client_id', 'DvApp');
                  // Extra params for Differentiation
                  formData.set('client_id_1', 'DvApp');
                })
              )
            ),
            switchMap((tokens) => {
              if (!tokens) {
                this.logToSentry(
                  new Error('Null response from auth token endpoint')
                );
              } else if (!tokens.access_token) {
                this.logToSentry(
                  new Error('Null access token from auth token endpoint')
                );
              } else if (!tokens.refresh_token) {
                this.logToSentry(
                  new Error('Null refresh token from auth token endpoint')
                );
              }
              this.isRefreshing = false;
              this.refreshTokenSubject.next(tokens.access_token);
              localStorage.setItem('dv_refresh_token', tokens.refresh_token);
              localStorage.setItem('dv_access_token', tokens.access_token);
              localStorage.setItem('jwt', tokens.jwt);
              return next.handle(this.addToken(request, tokens.access_token));
            })
          );
      } else {
        let errorMessage = 'Something went wrong while refreshing the token';
        if (!localStorage) {
          errorMessage =
            'Something went wrong while refreshing the token - Local storage is not available';
        }
        return throwError(error || errorMessage);
      }
    }
  }

  private logToSentry(
    error,
    meta = null,
    fingerprint = null,
    logToConsole = false
  ) {
    try {
      let errorHandler = this.getErrorHandler();
      errorHandler?.handleError(error, meta, fingerprint, logToConsole);
    } catch (err) {}
  }

  private getErrorHandler() {
    if (!this.errorHandler) {
      this.errorHandler = this.injector.get(ErrorHandlerService);
    }
    return this.errorHandler;
  }
}
