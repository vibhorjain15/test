import { Injectable } from '@angular/core';
import {
  ActivatedRoute,
  Router,
  ActivatedRouteSnapshot,
  NavigationExtras,
  UrlSegmentGroup,
  NavigationStart,
} from '@angular/router';
import { Subject } from 'rxjs';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root',
})
export class RouterService {
  state: any;
  ngUnsubscribeScope = null;

  routerSubject = new Subject();
  constructor(
    public routerState: ActivatedRoute,
    public router: Router,
    public util: UtilsService
  ) {}

  /**
   * Determines whether the passed url is external or internal.
   * @param url The url.
   * @returns `true` if it is an external url. Otherwise, `false`
   */
  isExternalUrl(url: string): boolean {
    try {
      return new URL(url).origin !== location.origin;
    } catch (exception) {
      return false;
    }
  }

  history = [];
  updateHistoryRoute(url) {
    this.history.push(url);
  }
  clearHistoryRoute() {
    this.history = [];
  }

  navigateToExternalLink(
    url: string,
    target: string = '_blank'
  ): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      try {
        resolve(!!window.open(url, target));
      } catch (exception) {
        reject(exception);
      }
    });
  }

  getRouterInstance() {
    return this.router;
  }

  /**
   * Gets the url, query parameters and fragment.
   * @param url The angular application url.
   * @returns
   * ```
   * {
   *   url: string,
   *   queryParams: any,
   *   fragment: string
   * }
   * ```
   */
  getUrlAndQueryParams(url: string): any {
    const urlTree = this.router.parseUrl(url);
    const urlSegmentGroup: UrlSegmentGroup = urlTree.root.children['primary'];
    const path = urlSegmentGroup
      ? urlSegmentGroup.segments.map((segment) => segment.path).join('/')
      : '';
    const queryParams = urlTree.queryParams;

    return {
      url: path,
      queryParams: queryParams,
      fragment: urlTree.fragment,
    };
  }

  /**
   * Gets the relative url, removes the domain name.
   * @param url The url.
   * @returns The relative url.
   * @description
   * ```
   * // provided url: 'https://localhost:4200/app/releases/notes#46'
   * // output: '/app/releases/notes#46'
   * ```
   */
  getRelativeURL(url: string): string {
    try {
      url = new URL(url).hash; // pick the has location ('/app/releases/notes#46')
    } catch (exception) {
      url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, ''); // return ('/app/releases/notes#46')
    }

    url = url.replace(/^\/?#\//, '/'); // replaces ('/' or '/') with ('/')
    return url;
  }
  createListener(callback) {
    let currentUrl = '';
    this.ngUnsubscribeScope = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (event.url == currentUrl) {
          return;
        }
        // Updated current URL
        currentUrl = event.url;
        const { pathWithoutQuery, queryParamsObj, fragment } =
          this.util.getUrlWithParam(event.url.slice(1));

        let canRoute = callback(pathWithoutQuery, {
          queryParams: queryParamsObj,
          fragment: fragment,
        });
        if (canRoute) {
          currentUrl = this.router.url;
          this.router.navigateByUrl(this.router.url);
        } else {
          return;
        }
      }
    });
  }

  destroyListener() {
    this.ngUnsubscribeScope?.unsubscribe();
    this.ngUnsubscribeScope = null;
  }

  navigate(path: string, params = {}): void {
    path = path?.replaceAll('.', '/');
    this.router.navigate([path], params);
  }

  navigateAngular(path: string, extras?: NavigationExtras): Promise<boolean> {
    if (!extras) extras = {};
    return this.router.navigate([path], extras || {});
  }

  navigateWithParams(path: string, params, config: any = {}): void {
    const [newPath, newParams]: any = allRouterMapper(path, params);
    if (!config.reload) {
      this.router.navigate(newPath, { ...newParams, ...config });
    }
    if (config.reload) {
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate(newPath, { ...newParams, ...config });
      });
    }
  }

  getState(snap = null) {
    let snapshot: any = this.routerState.snapshot;
    if (snap) {
      let allRoutsObj = { params: {}, queryParams: {}, '#': null };
      allRoutsObj.params = snap.snapshot.params;
      allRoutsObj.queryParams = snap.snapshot.queryParams;
      snap.children.forEach((ob: any) => {
        allRoutsObj.params = { ...allRoutsObj.params, ...ob.params._value };
        allRoutsObj.queryParams = {
          ...allRoutsObj.queryParams,
          ...ob.queryParams._value,
        };
        if (ob.fragment._value) allRoutsObj['#'] = ob.fragment._value;
      });
      snapshot = allRoutsObj;
    }

    const routerState = this.getParam();
    const routerData = this.getData();
    this.state = snapshot;
    this.state.params = {
      ...snapshot.params,
      ...snapshot.queryParams,
      ...routerState.params,
      ...routerState.queryParams,
      ...(routerState.fragment ? { '#': routerState.fragment } : {}),
      ...routerState,
    };
    this.state.data = routerData;
    return this.state;
  }

  /**
   * Traverses a router tree from root to a leaf looking for {@param}.
   */
  getParam(): any {
    let params = {};
    let queryParams = {};
    let fragment = null;
    this.state = {};
    let stack: ActivatedRouteSnapshot[] = [
      this.router.routerState.snapshot.root,
    ];
    while (stack.length > 0) {
      const route = stack.pop()!;
      params = { ...params, ...route.params };
      queryParams = { ...queryParams, ...route.queryParams };
      fragment = route?.fragment;
      stack.push(...route.children);
    }
    return { params, queryParams, fragment };
  }

  /**
   * Gets all the route data.
   * @returns The route data.
   */
  getData(): any {
    let data = {};
    let stack: ActivatedRouteSnapshot[] = [
      this.router.routerState.snapshot.root,
    ];
    while (stack.length > 0) {
      const route = stack.pop();
      data = { ...data, ...route.data };
      stack.push(...route.children);
    }
    return data;
  }

  reload() {
    this.state.reload();
  }

  inherit() {
    this.state.inherit();
  }

  href(path: string, params) {
    const [newPath]: any = generateRoute(path, params);
    return newPath;
  }
  navigateToRelativeRoute(path: string, state, queryParams = {}): void {
    this.router.navigate([`../${path}`], {
      relativeTo: state,
      ...queryParams,
    });
  }
  navigateToRoute(path: string): void {
    path = path?.replaceAll('.', '/');
    this.router.navigate([path]);
  }
}
function generateRoute(route, params) {
  switch (route) {
    case 'app.diligence.project.investment_ratings':
      return [
        [
          `/#/app/diligence/projects/${params.diligenceId}/investment_ratings${
            params.categoryId ? '?categoryId=' + params.categoryId : ''
          }`,
        ],
      ];

    case 'app.vehicles.profile.recommendations':
      return [
        [`/#/app/vehicles/${params.vehicleId}/profile/recommendations`],
        {
          queryParams: {
            recommendationId: params.recommendationId,
          },
        },
      ];
    case 'app.firm.settings.investment_rating.types':
      return [
        [
          `/#/app/firm/settings/investment_rating/types?rating_id=${params.rating_id}`,
        ],
      ];
    case 'app.funds.profile.recommendations':
      return [
        [
          `/#/app/funds/${params.fundId}/profile/recommendations?recommendationId=${params.recommendationId}`,
        ],
      ];
    case 'app.firms.profile.recommendations':
      return [
        [
          `/#/app/firms/${params.firmId}/profile/recommendations?recommendationId=${params.recommendationId}`,
        ],
      ];
    case 'app.strategies.profile.recommendations':
      return [
        [
          `/#/app/strategies/${params.strategyId}/profile/recommendations?recommendationId=${params.recommendationId}`,
        ],
      ];
    case 'app.diligence.project.recommendations':
      return [
        [
          `/#/app/diligence/projects/${params.diligenceId}/recommendations?recommendationId=${params.recommendationId}`,
        ],
      ];
    case 'app.diligence.project.questionnaire.category.question':
      let url = `/#/app/diligence/projects/${params.diligenceId}/questionnaire/category/${params.categoryId}/question/${params.questionId}`;
      return [
        [url],
        { fragment: params['#'], queryParams: { panel: params.panel } },
      ];
    case 'app.diligence.project.questionnaire':
      return [
        [`/#/app/diligence/projects/${params.diligenceId}/questionnaire`],
      ];
    case 'app.firm.settings.preferences':
      return [[`/#/app/firm/settings/preferences#${params['#']}`]];
    case 'app.dash':
      if (params?.dashType) {
        return [[`/#/app/dash?dashType=${params.dashType}`]];
      } else {
        return [[`/#/app/dash`]];
      }
    case 'app.diligence.project.summary':
      return [[`/#/app/diligence/projects/${params.diligenceId}/summary`], {}];
    case 'app.workflow_automation.detail':
      return [[`/#/app/workflow_automation/${params.Id}/detail`], {}];
    case 'app.diligence.projects.activity':
      return [[`/#/app/diligence/projects/activity?type=${params.type}`]];
    case 'app.diligence.excel_sync.detail':
      return [
        [`/#/app/diligence/excel_sync/detail?sync_type=${params.sync_type}`],
      ];
    case 'app.diligence.excel_sync.list':
      return [
        [`/#/app/diligence/excel_sync/list?sync_type=${params.sync_type}`],
      ];
    case 'app.firms.profile.monitor':
      return [[`/#/app/firms/${params.firmId}/profile/monitor`], {}];
    case 'app.diligence.project.summary':
      return [[`/#/app/diligence/projects/${params.diligenceId}/summary`], {}];
    case 'app.workflow_automation.detail':
      return [[`/#/app/workflow_automation/${params.Id}/detail`], {}];
    case 'app.content.document.detail':
      return [[`/#/app/content/document/${params.documentId}/detail`]];
    case 'app.ai-terms-of-use':
      return [[`/#/app/ai-terms-of-use`]];
    default:
      return [['/' + route?.replaceAll('.', '/')], { queryParams: params }];
  }
}

function allRouterMapper(route, params) {
  let url = '';
  switch (route) {
    case 'app.partnership':
      return [[route?.replaceAll('.', '/')], { queryParams: params }];
    case 'app.form_adv.firm.filings_history':
      let filings_history_url = `app/form_adv/firm/${params.firmCRD}/filings_history`;
      delete params.firmCRD;
      return [
        [filings_history_url],
        { queryParams: params, onSameUrlNavigation: true },
      ];

    case 'app.form_adv.firm.snapshot':
      return [[`app/form_adv/firm/${params.firmCRD}/snapshot`], {}];
    case 'app.form_adv.firm.potential_flags':
      return [[`app/form_adv/firm/${params.firmCRD}/potential_flags`], {}];
    case 'app.form_adv.firm.private_funds':
      return [[`app/form_adv/firm/${params.firmCRD}/private_funds`], {}];
    case 'app.form_adv.firm.related_entities':
      return [[`app/form_adv/firm/${params.firmCRD}/related_entities`], {}];
    case 'app.diligence.project.questionnaire':
      return [
        [`/app/diligence/projects/${params.diligenceId}/questionnaire`],
        {},
      ];
    case 'app.diligence.project.questionnaire.category':
      let hash = {};
      if ('#' in params) {
        hash = params['#'];
      }
      return [
        [
          `/app/diligence/projects/${params.diligenceId}/questionnaire/category/${params.categoryId}`,
        ],
        { fragment: hash },
      ];
    case 'app.form_adv.firm.question_history':
      let question_history_url = `/app/form_adv/firm/${params.firmCRD}/question_history`;
      delete params.firmCRD;
      return [[question_history_url], { queryParams: params }];
    case 'app.diligence.project.summary':
      return [[`/app/diligence/projects/${params.diligenceId}/summary`], {}];
    case 'app.diligence.firms.funds.project.questionnaire':
      return [
        [
          `/app/diligence/${params.fromfirmId}/firms/${params.tofirmId}/funds/${params.fundId}/projects/${params.diligenceId}/questionnaire`,
        ],
        {},
      ];
    case 'app.diligence.firms.funds.project.summary':
      return [
        [
          `/app/diligence/${params.fromfirmId}/firms/${params.tofirmId}/funds/${params.fundId}/projects/${params.diligenceId}/summary`,
        ],
        {},
      ];
    case 'app.diligence.firms.project.questionnaire':
      return [
        [
          `/app/diligence/${params.fromfirmId}/firms/${params.tofirmId}/projects/${params.diligenceId}/questionnaire`,
        ],
        {},
      ];
    case 'app.diligence.firms.project.summary':
      return [
        [
          `/app/diligence/${params.fromfirmId}/firms/${params.tofirmId}/projects/${params.diligenceId}/summary`,
        ],
        {},
      ];
    case 'app.diligence.firms.strategies.project.questionnaire':
      return [
        [
          `/app/diligence/${params.fromfirmId}/firms/${params.tofirmId}/strategies/${params.strategyId}/projects/${params.diligenceId}/questionnaire`,
        ],
        {},
      ];
    case 'app.diligence.firms.funds.vehicles.project.questionnaire':
      return [
        [
          `/app/diligence/${params.fromfirmId}/firms/${params.tofirmId}/funds/${params.fundId}/vehicles/${params.vehicleId}/projects/${params.diligenceId}/questionnaire`,
        ],
        {},
      ];
    case 'app.diligence.firms.strategies.funds.project.questionnaire':
      return [
        [
          `/app/diligence/${params.fromfirmId}/firms/${params.tofirmId}/strategies/${params.strategyId}/funds/${params.fundId}/projects/${params.diligenceId}/questionnaire`,
        ],
        {},
      ];
    case 'app.diligence.firms.strategies.funds.project.summary':
      return [
        [
          `/app/diligence/${params.fromfirmId}/firms/${params.tofirmId}/strategies/${params.strategyId}/funds/${params.fundId}/projects/${params.diligenceId}/summary`,
        ],
        {},
      ];
    case 'app.diligence.firms.strategies.project.summary':
      return [
        [
          `/app/diligence/${params.fromfirmId}/firms/${params.tofirmId}/strategies/${params.strategyId}/projects/${params.diligenceId}/summary`,
        ],
        {},
      ];
    case 'app.diligence.firms.funds.vehicles.project.summary':
      // [`/app/diligence/:fromfirmId/firms/:tofirmId/funds/:fundId/vehicles/:vehicleId/projects/:diligenceId/summary`],
      url = `/app/diligence/${params.fromfirmId}/firms/${params.tofirmId}/funds/${params.fundId}/vehicles/${params.vehicleId}/projects/${params.diligenceId}/summary`;
      return [[url], {}];
    case 'app.diligence.project.questionnaire.category.question':
      return [
        [
          `/app/diligence/projects/${params.diligenceId}/questionnaire/category/${params.categoryId}/question/${params.questionId}`,
        ],
        { fragment: params['#'] },
      ];
    case 'app.diligence.project.notes':
      return [[`/app/diligence/projects/${params.diligenceId}/notes`], {}];
    case 'app.diligence.project.share':
      return [[`/app/diligence/projects/${params.diligenceId}/share`], {}];
    case 'app.diligence.template.categories':
      return [[`app/diligence/template/${params.templateId}/categories`], {}];
    case 'app.diligence.projects.activity':
      return [[route?.replaceAll('.', '/')], { queryParams: params }];

    case 'app.diligence.excel_sync.detail':
      return [[route?.replaceAll('.', '/')], { queryParams: params }];
    case 'app.analyze.compare.due_diligences':
      return [[route?.replaceAll('.', '/')], { queryParams: params }];
    case 'app.analyze.compare.due_diligence_list':
      return [[route?.replaceAll('.', '/')], { queryParams: params }];
    case 'app.diligence.template.preview':
      let hashVal = {};
      if ('#' in params) {
        hashVal = params['#'];
      }
      return [
        [`app/diligence/template/${params.templateId}/preview`],
        { fragment: hashVal },
      ];
    case 'app.diligence.template.print_preview':
      return [
        [`app/diligence/template/${params.templateId}/print_preview`],
        {},
      ];
    case 'app.diligence.template.scoring':
      return [[`app/diligence/template/${params.templateId}/scoring`], {}];
    case 'app.diligence.template.categories.subcategories':
      return [
        [
          `app/diligence/template/${params.templateId}/categories/${params.categoryId}/subcategories`,
        ],
        {},
      ];
    case 'app.diligence.template.categories.subcategories.questions':
      return [
        [
          `app/diligence/template/${params.templateId}/categories/${params.categoryId}/subcategories/${params.subcategoryId}/questions`,
        ],
        {},
      ];
    case 'app.diligence.invite':
      return [[route?.replaceAll('.', '/')], { queryParams: params }];
    case 'app.firm.settings.investment_rating.types':
      return [[route?.replaceAll('.', '/')], { queryParams: params }];
    case 'app.analyze.templates.categories':
      url = `app/analyze/templates/${params.templateId}/categories`;
      delete params.templateId;
      return [[url], { queryParams: params, onSameUrlNavigation: true }];
    case 'app.analyze.templates.categories.responses':
      url = `app/analyze/templates/${params.templateId}/categories/${params.categoryId}/responses`;
      delete params.templateId;
      delete params.categoryId;
      return [[url], { queryParams: params, onSameUrlNavigation: true }];
    case 'app.firms.profile.monitor':
      return [[`/app/firms/${params.firmId}/profile/monitor`], {}];
    case 'app.contacts':
      return [[`/app/contacts/${params.Id}`], {}];
    case 'app.firms.profile.associated_contacts':
      return [[`/app/firms/${params.firmId}/profile/associated_contacts`], {}];
    case 'app.firms.profile.related_entities':
      return [[`/app/firms/${params.firmId}/profile/related_entities`], {}];
    case 'app.firms.profile.documents.list':
      return [
        [`/app/firms/${params.firmId}/profile/documents/list`],
        { queryParams: params.queryParams },
      ];
    case 'app.firms.profile.recommendations':
      return [[`/app/firms/${params.firmId}/profile/recommendations`], {}];
    case 'app.firms.funds.profile.monitor':
      return [
        [`/app/firms/${params.firmId}/funds/${params.fundId}/profile/monitor`],
        {},
      ];
    case 'app.firms.funds.vehicles.profile.monitor':
      return [
        [
          `/app/firms/${params.firmId}/funds/${params.fundId}/vehicles/${params.vehicleId}/profile/monitor`,
        ],
        {},
      ];
    case 'app.vehicles.profile.monitor':
      return [[`/app/vehicles/${params.vehicleId}/profile/monitor`], {}];
    case 'app.firms.funds.vehicles.profile.aum_tr':
      return [
        [
          `/app/firms/${params.firmId}/funds/${params.fundId}/vehicles/${params.vehicleId}/profile/aum_tr`,
        ],
        {},
      ];
    case 'app.firms.strategies.profile.aum_tr':
      return [
        [
          `/app/firms/${params.firmId}/strategies/${params.strategyId}/profile/aum_tr`,
        ],
        {},
      ];
    case 'app.firms.funds.profile.contacts':
      return [
        [`/app/firms/${params.firmId}/funds/${params.fundId}/profile/contacts`],
        {},
      ];
    case 'app.firms.funds.profile.documents.list':
      return [
        [
          `/app/firms/${params.firmId}/funds/${params.fundId}/profile/documents/list`,
        ],
        { queryParams: params.queryParams },
      ];
    case 'app.firms.funds.profile.recommendations':
      return [
        [
          `/app/firms/${params.firmId}/funds/${params.fundId}/profile/recommendations`,
        ],
        {},
      ];
    case 'app.firms.funds.profile.aum_tr':
      return [
        [`/app/firms/${params.firmId}/funds/${params.fundId}/profile/aum_tr`],
        {},
      ];
    case 'app.firms.funds.profile.ddq':
      return [
        [`/app/firms/${params.firmId}/funds/${params.fundId}/profile/ddq`],
        {},
      ];
    case 'app.firms.funds.profile.related_entities':
      return [
        [
          `/app/firms/${params.firmId}/funds/${params.fundId}/profile/related_entities`,
        ],
        {},
      ];
    case 'app.strategies.profile.monitor':
      return [[`/app/strategies/${params.strategyId}/profile/monitor`], {}];
    case 'app.firms.strategies.profile.monitor':
      return [
        [
          `/app/firms/${params.firmId}/strategies/${params.strategyId}/profile/monitor`,
        ],
        {},
      ];
    case 'app.funds.profile.monitor':
      return [[`/app/funds/${params.fundId}/profile/monitor`], {}];
    case 'app.funds.profile.summary':
      return [[`/app/funds/${params.fundId}/profile/summary`], {}];
    case 'app.firms.strategies.profile.contacts':
      return [
        [
          `/app/firms/${params.firmId}/strategies/${params.strategyId}/profile/contacts`,
        ],
        {},
      ];
    case 'app.firms.strategies.profile.documents.list':
      return [
        [
          `/app/firms/${params.firmId}/strategies/${params.strategyId}/profile/documents/list`,
        ],
        { queryParams: params.queryParams },
      ];
    case 'app.firms.funds.vehicles.profile.documents.list':
      return [
        [
          `/app/firms/${params.firmId}/funds/${params.fundId}/vehicles/${params.vehicleId}/profile/documents/list`,
        ],
        { queryParams: params.queryParams },
      ];
    case 'app.monitor.my_firm.profile.documents.list':
      return [
        [`/app/monitor/my_firm/profile/documents/list`],
        { queryParams: params.queryParams },
      ];
    case 'app.firms.strategies.profile.recommendations':
      return [
        [
          `/app/firms/${params.firmId}/strategies/${params.strategyId}/profile/recommendations`,
        ],
        {},
      ];
    case 'app.workflow_automation.preview':
      url = `/app/workflow_automation/${params.Id}/preview`;
      delete params.Id;
      return [[url], { queryParams: params }];
    case 'app.workflow_automation.detail':
      return [[`/app/workflow_automation/${params.Id}/detail`], {}];
    case 'app.content.document.detail':
      return [[`/app/content/document/${params.documentId}/detail`], {}];
    case 'app.form_adv.firm.snapshot':
      return [[`app/form_adv/firm/${params.firmCRD}/snapshot`], {}];
    case 'app.form_adv.regulatory_monitor.explore':
    case 'app.content.duplicates':
      return [[route?.replaceAll('.', '/')]];
    case 'app.content.questions':
      return [[route?.replaceAll('.', '/')], { queryParams: params }];
    case 'app.firm.settings.workflows.detail':
      return [[`app/firm/settings/workflows/${params.workflowId}`], {}];
    case 'app.firm.settings.workflows.detail.edit':
      return [[`app/firm/settings/workflows/${params.workflowId}/edit`], {}];
    case 'app.firm.settings.workflows.detail.preview':
      return [[`app/firm/settings/workflows/${params.workflowId}/preview`], {}];
    case 'app.reports.templates.list.preview':
      return [[`app/reports/templates/list/${params.templateId}/preview`], {}];
    case 'app.reports.realtime-reports.show.preview':
      return [
        [`app/reports/realtime-reports/${params.reportId}/show/preview`],
        {},
      ];
    case 'app.diligence.word_to_template':
      return [
        [`app/diligence/word_to_template/${params.doc_id}`],
        { queryParams: (({ doc_id, ...otherParams }) => otherParams)(params) },
      ];
    case 'app.diligence.excel_to_template':
      return [[`app/diligence/excel_to_template/${params.doc_id}`], {}];
    case 'app.diligence.to_external':
      return [
        [`app/diligence/to_external`],
        {
          queryParams: params,
        },
      ];
    case 'app.monitor.meetings.detail':
      return [[`app/monitor/meetings/${params.Id}/detail`], {}];
    case 'app.firm.settings.employees':
      let hashParam = {};
      if ('#' in params) {
        hashParam = params['#'];
      }
      return [[`/app/firm/settings/employees`], { fragment: hashParam }];
    case 'app.firm.settings.preferences':
      let param = {};
      if ('#' in params) {
        param = params['#'];
      }
      return [[`/app/firm/settings/preferences`], { fragment: param }];
    case 'app.content.documents':
      return [[`app/content/documents`], { queryParams: params.queryParams }];
    case 'app.diligence.project.not_approval_reasons':
      return [
        [`/app/diligence/projects/${params.diligenceId}/not_approval_reasons`],
        {},
      ];
    case 'app.inbound.review_request':
      return [[`/app/inbound/review_request`], { queryParams: params }];
    case 'app.firms.profile.aum_tr':
      return [[`app/firms/${params.firmId}/profile/aum_tr`], {}];
    case 'app.form_adv.service_provider':
      return [[`/app/form_adv/service_provider`], { queryParams: params }];
    case '.':
      return [[], { queryParams: params, queryParamsHandling: 'merge' }];
    default:
      return [[route?.replaceAll('.', '/')], { queryParams: params }];
  }
}
