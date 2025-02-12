import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Action, Selector, State, StateContext, Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { FirmPreferenceDataService } from 'src/app2/modules/firm-settings/firm-preference-data.service';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { getMetaUserData } from './user.util';
import {
  DeleteAllData,
  DeletePartnershipData,
  GetRatingCalculationTypes,
  GetCurrentUser,
  GetLanguageCode,
  GetSubscriptionLimit,
  GetTeamMembers,
  SetPartnershipData,
  UpdateCurrentUser,
  UpdateFirmPreference,
  UpdateActivePanelId,
  GetWebsocketToken,
  GetTeamRoles,
  GetDocumentTags,
  ToggleWritetoUs,
  UpdateEUCAccepted,
  UpdateFirstLoginUser,
  GetAiPromptFlag,
  GetUserNotification,
} from './user.action';
import { UserModel } from './user.model';
import { ConnectWebSocket } from '@ngxs/websocket-plugin';
import { UserService } from 'src/app2/services/user.service';
import { SetActive, SetDownloadList } from '../download/download.action';
import { DownloadList, DownloadInfo } from '../download/download.model';
import { ReRouteService } from 'src/app2/services/re-reoute.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { PolicyChangesComponent } from 'src/app2/shared/modals/policy-changes/policy-changes.component';
import { AI_Policy_Condensed_Acknowledge } from 'src/app2/shared/constants/policy.constants';
import { RouterService } from 'src/app2/services/router.service';

@State<UserModel>({
  name: 'user',
  defaults: {
    currentUser: null,
    subscriptionLimits: null,
    firmPreference: null,
    firmData: null,
    teamMembers: null,
    language_code: 'en',
    isLoading: false,
    error: null,
    partnership: {
      entity_id: null,
      entity_type: null,
      entity_name: null,
    },
    ratingCalculationTypes: [],
    documentTags: null,
    activePanelId: null,
    teamRoles: null,
    openWritetoUs: false,
    email_notifications: null,
    ai_prompt_shown: null,
  },
})
@Injectable()
export class UserState {
  constructor(
    private readonly http: HttpClient,
    private readonly baseDataService: BaseDataService,
    private readonly toaster: ToastrService,
    private readonly FirmService: FirmPreferenceDataService,
    private readonly translate: TranslateService,
    private readonly store: Store,
    private readonly userService: UserService,
    private readonly reRoute: ReRouteService,
    private modal: BsModalService,
    private readonly router: RouterService
  ) {}

  @Selector()
  static getCurrentUserData(state: UserModel) {
    return state.currentUser;
  }

  @Selector()
  static getSubscriptionLimitsData(state: UserModel) {
    return state.subscriptionLimits;
  }

  @Selector()
  static getFirmPreferenceData(state: UserModel) {
    return state.firmPreference;
  }

  @Selector()
  static getTeamMembersData(state: UserModel) {
    return state.teamMembers;
  }

  @Selector()
  static getLanguageCodeData(state: UserModel) {
    return state.language_code;
  }

  @Selector()
  static getPartnershipData(state: UserModel) {
    return state.partnership;
  }

  @Selector()
  static getRatingCalculationTypes(state: UserModel) {
    return state.ratingCalculationTypes;
  }

  @Selector()
  static getDocumentTags(state: UserModel) {
    return state.documentTags;
  }

  @Selector()
  static getActivePanelId(state: UserModel) {
    return state.activePanelId;
  }

  @Selector()
  static getTeamRoles(state: UserModel) {
    return state.teamRoles;
  }
  @Selector()
  static getOpenWritetoUs(state: UserModel) {
    return state.openWritetoUs;
  }

  @Action(GetCurrentUser)
  getCurrentUser({ patchState }: StateContext<UserModel>) {
    patchState({
      isLoading: true,
      error: null,
    });
    this.translate.addLangs(['en', 'kn', 'hi', 'ja']);
    this.translate.use('en');
    this.store.dispatch(new GetTeamMembers());

    this.store.dispatch(new GetSubscriptionLimit());
    this.store.dispatch(new GetLanguageCode());
    this.store.dispatch(new GetWebsocketToken());
    this.store.dispatch(new GetDocumentTags());
    return this.baseDataService.getCurrentUser().pipe(
      tap((res: any) => {
        let metaData = getMetaUserData(res);
        patchState({
          currentUser: { ...res, ...metaData },
          firmPreference: res.firmInfo.preferences,
          isLoading: false,
          error: null,
        });
        this.store.dispatch(new GetTeamRoles());
      }),
      catchError((error) => {
        patchState({
          isLoading: false,
          error: 'Something went wrong while fetching user data',
        });
        return of([]);
      })
    );
  }

  @Action(GetSubscriptionLimit)
  GetSubscriptionLimit({ getState, patchState }: StateContext<UserModel>) {
    patchState({
      isLoading: true,
      error: null,
    });
    return this.baseDataService.getSubscriptionLimits().pipe(
      tap((payload: any) => {
        patchState({
          subscriptionLimits: [...payload],
          isLoading: false,
          error: null,
        });
      }),
      catchError((error) => {
        patchState({
          isLoading: false,
          error: 'Something went wrong while fetching Subscription Limits',
        });
        return of([]);
      })
    );
  }
  @Action(GetUserNotification)
  GetUserNotification({ getState, patchState }: StateContext<UserModel>) {
    patchState({
      isLoading: true,
      error: null,
    });

    return this.baseDataService.getUserNotification().pipe(
      tap((payload: any) => {
        patchState({
          email_notifications: payload,
          isLoading: false,
          error: null,
        });
      }),
      catchError((error) => {
        patchState({
          isLoading: false,
          error: 'Something went wrong while fetching Subscription Limits',
        });
        return of([]);
      })
    );
  }

  @Action(UpdateFirmPreference)
  UpdateFirmPreference(
    { getState, patchState }: StateContext<UserModel>,
    { payload }: UpdateFirmPreference
  ) {
    patchState({
      isLoading: true,
      error: null,
    });
    return this.FirmService.updateFirmPreferences(payload).pipe(
      tap((res: any) => {
        const userData = JSON.parse(JSON.stringify(getState().currentUser));
        userData.firmInfo.preferences = res;
        patchState({
          firmPreference: JSON.parse(JSON.stringify(res)),
          currentUser: userData,
          isLoading: false,
          error: null,
        });
      }),
      catchError((error) => {
        patchState({
          isLoading: false,
          error: 'Something went wrong while updating firm preferences',
        });
        return throwError(error);
      })
    );
  }

  @Action(UpdateCurrentUser)
  UpdateCurrentUser(
    { getState, patchState }: StateContext<UserModel>,
    { payload }: UpdateCurrentUser
  ) {
    let metaData = getMetaUserData(payload);
    patchState({
      currentUser: { ...payload, ...metaData },
    });
  }

  @Action(UpdateFirstLoginUser)
  UpdateFirstLoginUser({ getState, patchState }: StateContext<UserModel>) {
    return this.http.put('users/is_first_login', { isFirstLogin: false }).pipe(
      tap((result: any) => {
        patchState({
          currentUser: {
            ...getState().currentUser,
            ...{ isFirstLogin: false },
          },
        });
      }),
      catchError(() => {
        patchState({
          isLoading: false,
          error: 'Something went wrong while makeing is_first_login call',
        });
        return of([]);
      })
    );
  }

  @Action(UpdateEUCAccepted)
  UpdateEUCAccepted({ getState, patchState }: StateContext<UserModel>) {
    return this.http.post('users/certify', { type: 'EucAccepted' }).pipe(
      tap((result: any) => {
        patchState({
          currentUser: {
            ...getState().currentUser,
            ...{ endUserAgreementAccepted: true },
          },
        });
        this.reRoute.routeToWelcome();
      }),
      catchError(() => {
        patchState({
          isLoading: false,
          error: 'Something went wrong',
        });
        return of([]);
      })
    );
  }

  @Action(GetTeamMembers)
  GetTeamMembers({ patchState }: StateContext<UserModel>) {
    patchState({
      isLoading: true,
      error: null,
    });
    return this.baseDataService.getTeamMembers().pipe(
      tap((result: any) => {
        patchState({
          teamMembers: [...result],
          isLoading: false,
          error: null,
        });
      }),
      catchError((error) => {
        patchState({
          isLoading: false,
          error: 'Something went wrong while fetching team members',
        });
        return of([]);
      })
    );
  }

  @Action(GetLanguageCode)
  GetLanguageCode({ getState, patchState }: StateContext<UserModel>) {
    patchState({
      isLoading: true,
      error: null,
    });
    return this.http.get('user_notification_settings').pipe(
      tap((result: any) => {
        this.translate.use(result.language_code);
        patchState({
          language_code: result.language_code,
          isLoading: false,
          error: null,
        });
      }),
      catchError((error) => {
        patchState({
          isLoading: false,
          error: 'Something went wrong while fetching user language',
        });
        return of([]);
      })
    );
  }

  @Action(DeleteAllData)
  DeleteAllData({ getState, patchState }: StateContext<UserModel>) {
    patchState({
      currentUser: null,
      subscriptionLimits: [],
      firmPreference: null,
      firmData: null,
      teamMembers: [],
      ratingCalculationTypes: [],
      documentTags: null,
      language_code: 'en',
      isLoading: false,
      error: null,
    });
  }

  @Action(SetPartnershipData)
  SetPartnershipData(
    { patchState }: StateContext<UserModel>,
    { entity_id, entity_type, entity_name }: any
  ) {
    patchState({
      partnership: {
        entity_id,
        entity_type,
        entity_name,
      },
    });
  }
  @Action(DeletePartnershipData)
  DeletePartnershipData({ patchState }: StateContext<UserModel>) {
    patchState({
      partnership: {
        entity_id: null,
        entity_type: null,
        entity_name: null,
      },
    });
  }

  @Action(GetRatingCalculationTypes)
  GetRatingCalculationTypes({ patchState }: StateContext<UserModel>) {
    patchState({
      isLoading: true,
      error: null,
    });
    return this.http.get('ratingCalculationTypes').pipe(
      tap((result: any[]) => {
        patchState({
          ratingCalculationTypes: result,
          isLoading: false,
          error: null,
        });
      }),
      catchError((error) => {
        patchState({
          isLoading: false,
          error: 'Something went wrong while fetching ratingCalculationTypes',
        });
        return of([]);
      })
    );
  }

  @Action(GetDocumentTags)
  GetDocumentTags({ patchState }: StateContext<UserModel>) {
    patchState({
      isLoading: true,
      error: null,
    });
    return this.http.get('document_tag_definitions').pipe(
      tap((result: any[]) => {
        patchState({
          documentTags: result,
          isLoading: false,
          error: null,
        });
      }),
      catchError((error) => {
        patchState({
          isLoading: false,
          error: 'Something went wrong while fetching documentTags',
        });
        return of([]);
      })
    );
  }

  @Action(UpdateActivePanelId)
  UpdateActivePanelId({ patchState }: StateContext<UserModel>, { id }: any) {
    patchState({
      activePanelId: id,
    });
  }
  @Action(ToggleWritetoUs)
  ToggleWritetoUs({ patchState, getState }: StateContext<UserModel>) {
    patchState({
      openWritetoUs: !getState().openWritetoUs,
    });
  }

  @Action(GetWebsocketToken)
  GetWebsocketToken() {
    this.baseDataService.getWebsocketToken().subscribe(
      (result: any) => {
        let active = this.store.selectSnapshot(
          (state) => state.downloadList.active
        );
        if (!active) {
          this.store.dispatch(new ConnectWebSocket({ url: result.url }));
          this.store.dispatch(new SetActive(true));
          this.userService
            .getUserDownloads({ expired: false })
            .subscribe((downloads: any) => {
              let downloadsList = new DownloadList();
              downloadsList.downloads = <DownloadInfo[]>downloads;
              downloadsList.active = true;
              this.store.dispatch(new SetDownloadList(downloadsList));
            });
        }
      },
      catchError(() => {
        this.toaster.error('Something went wrong');
        return of([]);
      })
    );
  }

  @Action(GetTeamRoles)
  GetTeamRoles({ getState, patchState }: StateContext<UserModel>) {
    return this.http
      .get('function_assignments', {
        params: {
          entity_id: getState().currentUser.firmInfo.id,
          entity_type: 'Firm',
        },
      })
      .pipe(
        tap((result) => {
          patchState({
            teamRoles: result,
            error: null,
          });
        })
      );
  }

  @Action(GetAiPromptFlag)
  GetAiPromptFlag({ getState, patchState }: StateContext<UserModel>) {
    return this.http.get('users/ai_agreement').pipe(
      tap((result: any) => {
        if (
          !result.ai_agreement_flag &&
          getState().firmPreference.enable_gen_ai &&
          !this.modal.getModalsCount() &&
          !this.router.getState()?.next?.includes('login')
        )
          this.modal.show(PolicyChangesComponent, {
            initialState: {
              acknowledge: true,
              title: 'DiligenceVault AI Terms of Use Policy',
              policyDoc: AI_Policy_Condensed_Acknowledge,
              handleAccept: () => {
                this.http
                  .post('users/certify', {
                    type: 'AI_agreement',
                  })
                  .subscribe();
              },
            },
            ignoreBackdropClick: true,
          });
        patchState({
          ai_prompt_shown: result.ai_agreement_flag,
          isLoading: false,
          error: null,
        });
      })
    );
  }
}
