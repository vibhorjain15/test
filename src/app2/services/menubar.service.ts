import { Injectable } from '@angular/core';
import { UtilsService } from './utils.service';
import { StandardPluralizePipe } from '../shared/pipes/standard-pluralize.pipe';

@Injectable({
  providedIn: 'root',
})
export class MenubarService {
  menu_items: any = [];
  firm_settings_items: any = [];
  my_settings_items: any = [];
  constructor(
    private readonly Utils: UtilsService,
    private pluralize: StandardPluralizePipe
  ) {}
  entity_type = this.Utils.getEntityType();
  grant_map: any = {};

  updateAllMenuItem(entity_type) {
    this.entity_type = entity_type;
    this.updateAllNavMenuItem(entity_type);
    this.updateFirmSettingMenu(entity_type);
    this.updateMySettingsMenu();
  }
  updateAllNavMenuItem(entity_type) {
    this.menu_items = [
      {
        label: 'New',
        iconName: 'plus',
        custom_class: 'js-menu-new-action',
        hidden_from: ['securityAdmin', 'FreeInvestor'],
        submenu_items: [
          {
            label: 'Request',
            stateName: 'app/diligence/invite',
            hidden_from: ['FreeSubscription', 'manager'],
            accessible_to: ['investor'],
            freeuser_icon: 'upgrade',
          },

          {
            label: 'Project',
            stateName: 'app/diligence/newddq',
            hidden_from: ['investor'],
            freeuser_icon: 'upgrade',
            premiumTitle: 'Unlock Project Creation',
            premiumText:
              'Don’t miss out on efficient due diligence! Start creating projects instantly.',
          },

          {
            label: 'Investor Pitch',
            stateName: 'app/inbound/investor_pitch',
            accessible_to: ['manager'],
            hidden_from: ['securityAdmin'],
          },

          {
            label: 'Investor',
            modal_name: 'manage-firm',
            accessible_to: ['manager'],
            freeuser_icon: 'upgrade',
            modal_options: {
              class: 'gray modal-lg',
            },
            premiumTitle: 'Unlock Investor Firm Creation',
            premiumText:
              "Don't miss out - create your new investor firm today!",
          },

          {
            label: 'Firm',
            modal_name: 'manage-firm',
            accessible_to: ['investor'],
            freeuser_icon: 'upgrade',
            modal_options: {
              class: 'gray modal-lg',
            },
          },

          {
            label: 'Strategy',
            modal_name: 'manage-fund',
            modal_options: {
              initialState: {
                fund_type: 'strategy',
              },
              class: 'gray modal-lg',
            },
          },

          {
            label: entity_type,
            modal_name: 'manage-fund',
            hidden_from: ['FreeInvestor'],
            modal_options: {
              class: 'gray modal-lg',
            },
          },

          {
            label: 'Vehicle',
            modal_name: 'manage-vehicle',
            accessible_to: ['investor', 'manager'],
            hidden_from: ['FreeInvestor'],
            modal_options: {
              class: 'gray modal-lg',
            },
          },

          {
            label: 'Contact',
            modal_name: 'manage-contact',
            freeuser_icon: 'upgrade',
            modal_options: {
              class: 'gray modal-lg',
            },
            premiumTitle: 'Unlock Add New Contact',
            premiumText:
              "Don't miss out on valuable connections! Add new contacts instantly.",
          },

          {
            label: 'Template',
            modal_name: 'new-template',
            accessible_to: ['investor', 'manager'],
            freeuser_icon: 'upgrade',
            premiumTitle: 'Unlock New Template Creation',
            premiumText: "Don't miss out - customize templates now!",
          },

          {
            label: 'Document / Folder',
            modal_name: 'upload-document-folder',
            freeuser_icon: 'upgrade',
            premiumTitle: 'Unlock Document Repository',
            premiumText: "Don't miss out - access all your documents now!",
            modal_options: {
              class: 'gray modal-lg',
              initialState: {
                showUploadTypeToggler: true,
                uploadType: 'file',
              },
            },
          },

          {
            label: 'Presentation Design',
            modal_name: 'add-report-template',
            accessible_to: ['ProductiveSubscription'],
            freeuser_icon: 'upgrade',
            hidden_from: ['FreeInvestor', 'manager', 'hidePresentationModule'],
            modal_options: {
              class: 'gray modal-lg',
            },
          },

          {
            label: 'Presentation Reports',
            stateName: 'app/reports/new_report',
            accessible_to: ['ProductiveSubscription'],
            hidden_from: ['manager', 'hidePresentationModule', 'FreeInvestor'],
            freeuser_icon: 'upgrade',
          },
        ],
      },
      {
        label: 'Home',
        iconName: 'dash',
        matcher: /^app\/dash(.*)/,
        hidden_from: ['securityAdmin'],
        submenu_items: [
          {
            label: 'My Work',
            stateName: 'app/dash',
            stateParams: { dashType: 'my-work' },
          },
          {
            label: 'Dashboard',
            stateName: 'app/dash',
            accessible_to: ['manager'],
            stateParams: { dashType: 'Dashboard' },
          },
          {
            label: 'Activity Dash',
            stateName: 'app/dash',
            accessible_to: ['investor'],
            stateParams: { dashType: 'Activity' },
          },
          {
            label: 'Monitoring Dash',
            stateName: 'app/dash',
            accessible_to: ['investor'],
            stateParams: { dashType: 'Monitor' },
          },
        ],
      },
      this.grant_map?.manager && {
        label: 'Content',
        iconName: 'briefcase',
        custom_class: 'js-menu-diligence',
        hidden_from: ['securityAdmin', 'investor'],
        freeuser_icon: 'upgrade',
        submenu_items: [
          {
            label: 'Q/A Center',
            stateName: 'app/content/questions',
          },
          {
            label: 'Documents',
            matcher: /^app\/content\/document(.*)/,
            stateName: 'app/content/documents',
            stateParams: {
              tab: 'uploads',
              view: 'folder',
              receivedDocumentsNewCount: '0',
            },
          },
          {
            label: 'Manage AUM & TR',
            stateName: 'app/content/aum_tr',
          },
        ],
      },

      {
        label: 'Diligence',
        iconName: 'briefcase',
        custom_class: 'js-menu-diligence',
        hidden_from: ['securityAdmin'],
        freeuser_icon: 'upgrade',
        submenu_items: [
          {
            label: 'Projects',
            stateName: 'app/diligence/projects/activity',
            stateParams: { type: 'in-progress' },
            matcher: /^app\/diligence\/project(.*)/,
            custom_class: 'js-diligence-projects',
          },
          {
            label: 'Templates',
            stateName: 'app/diligence/templates',
            matcher: /^app\/diligence\/template(.*)/,
            hidden_from: ['FreeInvestor'],
            freeuser_icon: 'upgrade',
            premiumTitle: 'Unlock New Template Creation',
            premiumText: "Don't miss out - customize templates now!",
          },
          {
            label: 'Documents',
            matcher: /^app\/content\/document(.*)/,
            stateName: 'app/content/documents',
            stateParams: {
              tab: 'uploads',
              view: 'folder',
              receivedDocumentsNewCount: '0',
            },
            hidden_from: ['manager'],
          },
          {
            label: 'Excel Download',
            stateName: 'app/diligence/excel_sync/detail',
            stateParams: { sync_type: 'download' },
          },
          {
            label: 'Excel Upload',
            stateName: 'app/diligence/excel_sync/list',
            stateParams: { sync_type: 'download' },
          },
        ],
      },
      {
        label: 'Manage',
        iconName: 'monitor',
        matcher: /^app\/monitor(\/.*)/,
        hidden_from: [
          'FormADVSubscription',
          'FormADVAnalyticsSubscription',
          'securityAdmin',
        ],
        submenu_items: [
          {
            label: 'My Firm',
            stateName: 'app/monitor/my_firm/profile/ddqs',
            hidden_from: ['investor'],
          },
          {
            label: 'Firms',
            stateName: 'app/monitor/firms',
            accessible_to: ['investor'],
          },
          {
            label: 'Strategies',
            stateName: 'app/monitor/strategies',
          },
          {
            label: this.pluralize.transform(entity_type),
            stateName: 'app/monitor/investments',
          },
          {
            label: 'Vehicles',
            stateName: 'app/monitor/vehicles',
          },
          {
            label: 'Investors',
            stateName: 'app/monitor/firms',
            accessible_to: ['manager'],
          },
          {
            label: 'Contacts',
            stateName: 'app/monitor/contacts',
            matcher: /^app\/monitor\/contact(.*)/,
          },
          {
            label: 'AUM & Track Record',
            stateName: 'app/content/aum_tr',
            hidden_from: ['manager'],
          },
        ],
      },
      {
        label: 'Analyze',
        iconName: 'analyze',
        custom_class: 'js-menuanalyze',
        accessible_to: [
          'ProductiveSubscription',
          'FormADVAnalyticsSubscription',
          'PowerBISubscription',
        ],
        hidden_from: ['securityAdmin'],
        submenu_items: [
          {
            label: 'Rating/Score',
            stateName: 'app/analyze/scorecard',
            accessible_to: ['ProductiveSubscription'],
            hidden_from: ['manager'],
          },
          {
            label: 'Comparisons',
            stateName: 'app/analyze/compare/due_diligence_list',
            matcher: /^app\/analyze\/compare\/due_diligence(.*)/,
            accessible_to: ['InstitutionalSubscription'],
            hidden_from: ['manager'],
          },
          {
            label: 'Benchmarking',
            stateName: 'app/analyze/templates',
            accessible_to: ['ProductiveSubscription'],
            hidden_from: ['manager'],
          },
          {
            label: 'Portfolio Analytics',
            stateName: 'app/analyze/portfolio',
            accessible_to: [
              'FormADVAnalyticsSubscription',
              'ProductiveSubscription',
            ],
            hidden_from: ['manager'],
          },
          {
            label: 'Advanced Reports',
            stateName: 'app/advanced_reporting',
            accessible_to: ['PowerBISubscription'],
          },
        ],
      },
      {
        label: 'Data Hub',
        iconName: 'file',
        hidden_from: ['securityAdmin'],
        matcher: /^app\/form_adv(.*)/,
        submenu_items: [
          {
            label: 'ADV Portfolio',
            stateName: 'app/form_adv/regulatory_monitor/portfolio',
            matcher: /^app\/form_adv\/regulatory_monitor\/(.*)/,
          },
          {
            label: 'ADV Search',
            stateName: 'app/form_adv/adv_search',
            matcher: /^app\/form_adv\/adv_search/,
          },
          {
            label: 'Manage Thresholds',
            stateName: 'app/form_adv/thresholds',
            matcher: /^app\/form_adv\/thresholds/,
            hidden_from: ['FreeInvestor', 'FreeManager'],
            accessible_to: [
              'SmartSubscription',
              'FormADVSubscription',
              'FormADVAnalyticsSubscription',
              'ProductiveSubscription',
              'FreeSubscription',
            ],
            freeuser_icon: 'upgrade',
            premiumTitle: 'Unlock Manage Threshold',
            premiumText: 'Create tailored thresholds for key information.',
          },
          {
            label: 'Data Hub Resources',
            stateName: 'app/data_hub/resources',
            matcher: /^app\/data_hub\/resources/,
          },
        ],
      },
      {
        label: 'Reports',
        hidden_from: ['manager', 'FreeSubscription', 'securityAdmin'],
        matcher: /^app\/reports(.*)/,
        submenu_items: [
          {
            label: 'Excel Data Exports',
            stateName: 'app/reports/exports',
            matcher: /^app\/reports\/exports(.*)/,
          },
          {
            label: 'Presentation Reports',
            stateName: 'app/reports/realtime-reports/list',
            matcher: /^app\/reports\/realtime-reports(\/.*)/,
            accessible_to: ['ProductiveSubscription'],
            hidden_from: ['hidePresentationModule'],
          },
          {
            label: 'Presentation Design',
            stateName: 'app/reports/templates/list',
            matcher: /^app\/reports\/templates(\/.*)/,
            accessible_to: ['ProductiveSubscription'],
            hidden_from: ['hidePresentationModule'],
          },
        ],
      },
      {
        label: 'Partnerships',
        stateName: 'app/partnership',
        hidden_from: ['securityAdmin'],
        matcher: /^app\/partnership(.*)/,
      },
    ].filter(Boolean);
  }

  updateGrandMap(grant_map) {
    this.grant_map = grant_map;
  }

  isAuthorized(url: string): boolean {
    let menuItem = this.findMenuItemByUrl(url, this.menu_items);
    if (!menuItem) {
      menuItem = this.findMenuItemByUrl(url, this.firm_settings_items);
    }
    if (!menuItem) {
      menuItem = this.findMenuItemByUrl(url, this.my_settings_items);
    }
    if (!menuItem) {
      return true;
    }
    return this.canAccessHelper(
      menuItem?.hidden_from || [],
      menuItem?.accessible_to || []
    );
  }

  findMenuItemByUrl(url: string, menuItems) {
    for (const topLevelItem of menuItems) {
      const foundItem = this.findMatchingMenuItem(topLevelItem, url);
      if (foundItem) {
        return foundItem;
      }
    }
    return null;
  }

  findMatchingMenuItem(item, url: string) {
    if (item.stateName && url.includes(item?.stateName)) {
      return item;
    }

    if (item?.matcher && item.matcher.test(url)) {
      return item;
    }
    if (item.submenu_items) {
      for (const subItem of item.submenu_items) {
        const clonedAccessibleTo = [
          ...(subItem?.accessible_to || []),
          ...(item?.accessible_to || []),
        ];
        const clonedHiddenFrom = [
          ...(subItem?.hidden_from || []),
          ...(item?.hidden_from || []),
        ];

        const newSubItem = {
          ...subItem,
          accessible_to: clonedAccessibleTo,
          hidden_from: clonedHiddenFrom,
          parentMenu: item,
        };

        const match = this.findMatchingMenuItem(newSubItem, url);
        if (match) {
          return match;
        }
      }
    }

    return null;
  }

  getMenuItems(menuList, finalList) {
    menuList.forEach((item) => {
      if (item?.hidden_from?.some((hide) => this.grant_map[hide])) {
        return;
      }
      const isAccessible = this.canAccessHelper(
        item?.hiddenRole || [],
        item?.accessible_to || []
      );

      const itemCopy = {
        ...item,
        submenu_items: [],
      };

      if (item?.freeuser_icon) {
        itemCopy['upgrade'] =
          this.grant_map.FreeInvestor || this.grant_map.FreeManager;
      }

      if (item?.submenu_items) {
        item.submenu_items = item?.submenu_items.map((subItem) => {
          const clonedAccessibleTo = [
            ...(subItem?.accessible_to || []),
            ...(item?.accessible_to || []),
          ];
          const clonedHiddenFrom = [
            ...(subItem?.hidden_from || []),
            ...(item?.hidden_from || []),
          ];

          return {
            ...subItem,
            accessible_to: clonedAccessibleTo,
            hidden_from: clonedHiddenFrom,
          };
        });
      }
      if (isAccessible) {
        finalList.push(itemCopy);
        const submenu_items = item.submenu_items || [];
        const localList = [];
        this.getMenuItems(submenu_items, localList);
        itemCopy.submenu_items = localList; // Assign the populated submenu
      } else if (!item?.accessible_to?.length) {
        finalList.push(itemCopy);
        const submenu_items = item.submenu_items || [];
        const localList = [];
        this.getMenuItems(submenu_items, localList);
        itemCopy.submenu_items = localList; // Assign the populated submenu
      }
    });
  }

  canRouteToPremium(currentRoute, menu) {
    let canRedirect = false;
    menu.forEach((menu) => {
      if (menu.submenu_items?.length) {
        menu.submenu_items.forEach((suMenu) => {
          if (
            currentRoute.replaceAll('/', '.').includes(suMenu?.stateName) &&
            suMenu?.upgrade
          ) {
            canRedirect = true;
          }
        });
      }

      if (
        currentRoute.replaceAll('/', '.').includes(menu?.stateName) &&
        menu?.upgrade
      ) {
        canRedirect = true;
      }
    });
    return canRedirect;
  }

  updateFirmSettingMenu(entity_type) {
    this.firm_settings_items = [
      {
        label: 'Firm Settings',
        iconName: 'settings',
        custom_class: 'js-menu-firm-settings',
        hidden_from: [],
        freeuser_icon: '',
        submenu_items: [
          {
            label: 'Firm Profile',
            stateName: 'app/firm/settings/profile',
            hidden_from: ['securityAdmin'],
          },
          {
            label: 'Firm Activity',
            stateName: 'app/firm/settings/activity',
            hidden_from: ['securityAdmin'],
          },
          {
            label: 'Users & Teams',
            submenu_items: [
              {
                label: 'Users',
                stateName: 'app/firm/settings/employees',
              },
              {
                label: 'Teams',
                stateName: 'app/firm/settings/teams',
              },
              {
                label: 'Permissions',
                stateName: 'app/firm/settings/permissions',
              },
              {
                label: 'User roles',
                stateName: 'app/firm/settings/functions',
              },
              {
                stateName: 'app/firm/settings/access_levels',
                label: 'Access Levels',
                accessible_to: ['isEnableCustomAccessLevel'],
              },
            ],
          },
          {
            label: 'Security',
            accessible_to: ['isSuperAdmin', 'isSecurityAdmin'],
            hidden_from: ['businessAdmin'],
            submenu_items: [
              {
                label: 'Domain',
                stateName: 'app/firm/settings/domains',
              },
              {
                label: 'IP Whitelisting',
                stateName: 'app/firm/settings/ip_configurations',
              },
              {
                label: 'SAML/SSO',
                stateName: 'app/firm/settings/sso_profile',
              },
              {
                label: 'Password',
                stateName: 'app/firm/settings/password',
              },
            ],
          },
          {
            label: 'Preferences',
            hidden_from: ['securityAdmin'],
            submenu_items: [
              {
                label: 'Firm Preferences',
                stateName: 'app/firm/settings/preferences',
              },
              {
                label: 'Design Preferences',
                stateName: 'app/firm/settings/design_preferences',
              },
              {
                label: 'Export Preferences',
                stateName: 'app/firm/settings/export_preferences',
              },
            ],
          },
          {
            label: 'Download Audits',
            stateName: 'app/firm/settings/download_audits',
            hidden_from: ['securityAdmin'],
          },
          // {
          //   label: 'RMS',
          //   hidden_from: ['manager', 'securityAdmin', 'isFreeSubscription'],
          //   submenu_items: [
          //     {
          //       label: 'Bipsync RMS',
          //       stateName: 'app/firm/settings/bipsync-rms',
          //     },
          //   ],
          // },

          {
            label: 'Bulk Upload',
            hidden_from: ['securityAdmin'],
            accessible_to: ['isExcelBulkImport'],
            submenu_items: [
              {
                label: 'Users & Entities',
                stateName: 'app/firm/settings/bulk_upload/user_entities',
                accessible_to: ['isExcelBulkImport'],
              },
              {
                label: 'Q/A Library',
                stateName:
                  'app/firm/settings/bulk_upload/bulk_upload_pre_approved',
                hidden_from: ['investor'],
              },
              {
                label: 'Saved Mappings',
                stateName: 'app/firm/settings/bulk_upload/mapping_information',
                hidden_from: ['isFreeSubscription'],
              },
            ],
          },
          {
            label: 'Disclaimers',
            stateName: 'app/firm/settings/disclaimers',
            accessible_to: ['manager'],
            hidden_from: ['securityAdmin'],
          },
          entity_type == 'Product' && {
            label: 'Documents',
            accessible_to: [
              'FreeSubscription',
              'SmartSubscription',
              'InstitutionalSubscription',
              'ProductiveSubscription',
              'FullSubscription',
              'investor',
            ],
            hidden_from: ['securityAdmin'],
            submenu_items: [
              {
                label: 'Document Types',
                stateName: 'app/firm/settings/document_tags',
              },
              {
                label: 'Document Groups',
                stateName: 'app/firm/settings/document_group_tags',
              },
              {
                label: 'Document Classification',
                stateName: 'app/firm/settings/document_classifications',
              },
            ],
          },
          entity_type == 'Vendor' && {
            label: 'Documents',
            accessible_to: [
              'InstitutionalSubscription',
              'ProductiveSubscription',
              'investor',
            ],
            hidden_from: ['securityAdmin'],
            submenu_items: [
              {
                label: 'Document Types',
                stateName: 'app/firm/settings/document_tags',
              },
              {
                label: 'Document Groups',
                stateName: 'app/firm/settings/document_group_tags',
              },
              {
                label: 'Document Classification',
                stateName: 'app/firm/settings/document_classifications',
              },
            ],
          },
          entity_type != 'Product' &&
            entity_type != 'Vendor' && {
              label: 'Documents',
              accessible_to: [
                'InstitutionalSubscription',
                'ProductiveSubscription',
                'SmartSubscription',
                'manager',
              ],
              hidden_from: ['securityAdmin'],
              submenu_items: [
                {
                  label: 'Document Types',
                  stateName: 'app/firm/settings/document_tags',
                },
                {
                  label: 'Document Groups',
                  stateName: 'app/firm/settings/document_group_tags',
                },
                {
                  label: 'Document Classification',
                  stateName: 'app/firm/settings/document_classifications',
                  hidden_from: ['securityAdmin'],
                },
              ],
            },

          {
            label: 'Email Templates',
            stateName: 'app/firm/settings/email_templates',
            hidden_from: ['securityAdmin'],
          },
          {
            label: 'Opportunity Vault',
            accessible_to: [
              'isInvestor',
              'SmartSubscription',
              'InstitutionalSubscription',
              'ProductiveSubscription',
              'FullSubscription',
              'isEnabledInboundModule',
            ],
            hidden_from: [
              'securityAdmin',
              'manager',
              'isDisabledInboundModule',
              'FreeSubscription',
            ],
            submenu_items: [
              {
                label: 'Configure New Opportunity',
                stateName: 'app/firm/settings/manage_opportunity',
              },
              {
                label: 'Manage Opportunities',
                stateName: 'app/firm/settings/view_opportunities',
              },
            ],
          },
          {
            label: 'Rating/Score Map',
            hidden_from: ['securityAdmin', 'manager', 'FreeSubscription'],
            submenu_items: [
              {
                label: 'Rating/Score Definition',
                stateName: 'app/firm/settings/investment_rating/types',
              },
              {
                label: 'Rating/Score Scales',
                stateName: 'app/firm/settings/investment_rating/scales',
              },
            ],
          },
          {
            label: 'Review Definitions',
            stateName: 'app/firm/settings/review_definitions/list',
            hidden_from: ['isFreeSubscription', 'securityAdmin'], //admin added from angularjs page check
          },
          {
            label: 'Tags and Custom Fields',
            hidden_from: ['securityAdmin'],
            submenu_items: [
              {
                label: 'Universal',
                stateName: 'app/firm/settings/all_tags',
              },
              {
                label: 'Firm',
                stateName: 'app/firm/settings/firm_tags',
              },
              {
                label: 'Strategy',
                stateName: 'app/firm/settings/strategy_tags',
              },
              {
                label: 'Product',
                stateName: 'app/firm/settings/product_tags',
              },
              {
                label: 'Vehicle',
                stateName: 'app/firm/settings/vehicle_tags',
              },
              {
                label: 'Contact',
                stateName: 'app/firm/settings/contact_tags',
              },
              {
                label: 'Project',
                stateName: 'app/firm/settings/project_tags',
              },
            ],
          },

          {
            label: 'Workflow Definitions',
            stateName: 'app/firm/settings/workflows/list',
            hidden_from: ['securityAdmin'],
          },
          {
            label: 'CRM',
            hidden_from: ['isFreeSubscription', 'securityAdmin'],
            submenu_items: [
              {
                label: 'Dynamics 365 CRM',
                stateName: 'app/firm/settings/dynamics-crm',
              },
              {
                label: 'Salesforce CRM',
                stateName: 'app/firm/settings/salesforce-crm',
              },
            ],
          },
          {
            label: 'Data Integrations',
            hidden_from: ['securityAdmin'],
            submenu_items: [
              {
                label: 'Report Exports',
                stateName: 'app/firm/settings/integrations/export_import',
              },
              {
                label: 'API Key',
                stateName: 'app/firm/settings/integrations/api',
              },
            ],
          },
          {
            label: 'Releases',
            stateName: 'app/firm/settings/releases/list',
            accessible_to: ['isDiligencevaultUser'],
          },
          // {
          //   label: 'Feature Tours',
          //   stateName: 'app/firm/settings/feature_tours/list',
          //   accessible_to: ['isDiligencevaultUser'],
          // },
          {
            label: 'Banners',
            stateName: 'app/firm/settings/banners/list',
            accessible_to: ['isDiligencevaultUser'],
          },
        ].filter(Boolean),
      },
    ];
  }

  updateMySettingsMenu() {
    this.my_settings_items = [
      {
        label: 'User Settings',
        iconName: 'user-cog',
        custom_class: 'js-menu-user-settings',
        hidden_from: [],
        freeuser_icon: '',
        submenu_items: [
          {
            label: 'My Profile',
            stateName: 'app/settings/profile',
          },
          { stateName: 'app/settings/preferences', label: 'My Preferences' },
          {
            label: 'My Accounts',
            stateName: 'app/settings/my-accounts',
          },
          {
            label: 'Password Settings',
            stateName: 'app/settings/account',
          },
          {
            label: 'Security',
            submenu_items: [
              {
                label: 'Two-Factor Authentication',
                stateName:
                  'app/settings/security/two_factor_authentication/status',
              },
              {
                label: 'Account Activity',
                stateName: 'app/settings/security/account_activity',
              },
              {
                label: 'My Token',
                stateName: 'app/settings/security/my_token',
              },
            ],
          },
          {
            label: 'Email Notifications',
            stateName: 'app/settings/email_notifications',
            hidden_from: ['securityAdmin'],
          },
          {
            label: 'My Permissions',
            stateName: 'app/settings/my-permissions',
          },
          {
            label: 'My Admins',
            stateName: 'app/settings/my-admins',
          },
        ],
      },
    ];
  }

  isgrantMap() {
    return !!Object.keys(this.grant_map).length;
  }

  private _loadedUrl = '';
  updateLoadedUrl(url) {
    this._loadedUrl = url.slice(1);
  }
  getLoadedUrl() {
    return this._loadedUrl;
  }

  clearLoadedUrl() {
    this._loadedUrl = '';
  }

  canAccessHelper(hiddenRole, accessibleTo) {
    const hasAccessibleTo = accessibleTo.length > 0;
    const hasHiddenFrom = hiddenRole.length > 0;
    if (!hasAccessibleTo && !hasHiddenFrom) {
      return true;
    }
    const userHasAccess = hasAccessibleTo
      ? accessibleTo.some((access) => this.grant_map[access])
      : true;

    const userIsHidden = hasHiddenFrom
      ? hiddenRole.some((hide) => this.grant_map[hide])
      : false;

    return userHasAccess && !userIsHidden;
  }
}
