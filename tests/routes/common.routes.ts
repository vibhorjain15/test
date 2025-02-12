export const ALL_PARTNERSHIP_ROUTES: any = [
  {
    url: '/app/partnership',
    selector: { role: 'heading', name: 'All Partners' },
  },
];
export const ALL_MANAGER_ROUTES: any = [
  {
    url: '/app/diligence/newddq',
    selector: {
      role: 'text',
      name: 'Choose a DDQ workflow to set up and respond to an investor request, create a standard DDQ for your product(s)/firm, or build your Q/A content library.',
    },
  },
  {
    url: '/app/content/questions',
    selector: { role: 'label', name: 'Library' },
  },
  {
    url: '/app/diligence/1/firms/1/funds/27604/projects/1059606/share',
    selector: { role: 'text', name: 'Status' },
  },
  {
    url: '/app/monitor/my_firm/profile/ddqs',
    selector: { role: 'label', name: 'DDQs' },
  },
  {
    url: '/app/monitor/my_firm/profile/aum_tr',
    selector: { role: 'label', name: 'AUM & Track Record' },
  },
  {
    url: '/app/monitor/my_firm/profile/documents/list',
    selector: { role: 'label', name: 'Documents' },
  },
  {
    url: '/app/monitor/my_firm/profile/address',
    selector: { role: 'label', name: 'Addresses' },
  },
  {
    url: '/app/monitor/my_firm/profile/contacts',
    selector: { role: 'label', name: 'Associated Contacts' },
  },
  {
    url: '/app/monitor/my_firm/profile/recommendations',
    selector: {
      role: 'a',
      name: 'Back to all Firms',
      isLocator: true,
      locatorType: 'a',
    },
  },

  {
    url: '/app/firms/1/strategies/9517/profile/ddq',
    selector: { role: 'label', name: 'DDQ' },
  },
  {
    url: '/app/firms/1/funds/9500/profile/ddq',
    selector: { role: 'label', name: 'DDQ' },
  },
  {
    url: '/app/firms/1/funds/9500/vehicles/8847/profile/ddq',
    selector: { role: 'label', name: 'DDQ' },
  },
  {
    url: '/app/firm/settings/disclaimers',
    selector: { role: 'heading', name: 'Firm Disclaimers' },
  },
  {
    url: '/app/firms/1/strategies/9326/meetings/123262/detail',
    selector: { role: 'heading', name: 'Documents' },
  },
  {
    url: '/app/my_downloads',
    selector: { role: 'heading', name: 'My Downloads' },
  },
];

export const ALL_REPORTS_ROUTES: any = [
  {
    url: '/app/reports/exports',
    selector: { role: 'heading', name: 'Export New Report' },
  },
  {
    url: '/app/reports/realtime-reports/list',
    selector: { role: 'heading', name: 'Presentation Reports' },
  },
  {
    url: '/app/reports/realtime-reports/476/show/preview', // /app/reports/realtime-reports/476/show/preview
    selector: { role: 'heading', name: 'Export New Report' },
  },
  {
    url: '/app/reports/templates/list/140/preview',
    selector: { role: 'heading', name: 'Presentation Report Design' },
  },
  {
    url: '/app/reports/templates/list',
    selector: { role: 'heading', name: 'Presentation Report Design' },
  },
];
export const ALL_DATAHUB_ROUTES: any = [
  {
    url: '/app/form_adv/regulatory_monitor/portfolio',
    selector: { role: 'label', name: 'My Portfolio' },
  },
  {
    url: '/app/form_adv/firm/5670/snapshot',
    selector: { role: 'label', name: 'Snapshot' },
  },
  {
    url: '/app/form_adv/adv_search', // underscore issue
    selector: { role: 'heading', name: 'Relationship Summary' },
  },
  {
    url: '/app/form_adv/thresholds',
    selector: { role: 'heading', name: 'Configure Materiality' },
  },
  {
    url: '/app/data_hub/resources',
    selector: { role: 'heading', name: 'Important Resources' },
  },
];
export const ALL_ANALYZE_ROUTES: any = [
  {
    url: '/app/analyze/scorecard',
    selector: { role: 'heading', name: 'Rating/Score' },
  },
  {
    url: '/app/analyze/compare/due_diligence_list',
    selector: { role: 'text', name: 'Select a Template' },
  },
  {
    url: '/app/analyze/compare/due_diligences?ids=1026197,1059397&template_id=6924',
    selector: { role: 'heading', name: 'Compare Due diligences' },
  },
  {
    url: '/app/analyze/templates',
    selector: { role: 'text', name: 'Select a Template' },
  },
  {
    url: '/app/analyze/portfolio',
    selector: { role: 'heading', name: 'PORTFOLIO ANALYTICS' },
  },
  {
    url: '/app/advanced_reporting',
    selector: { role: 'text', name: 'Select a Dashboard' },
  },
];
export const ALL_EXCEL_DOC_ROUTES: any = [
  {
    url: '/app/diligence/excel_sync/detail?sync_type=download',
    selector: { role: 'text', name: '1. Select a Manager Firm' },
  },
  {
    url: '/app/diligence/excel_sync/list?sync_type=download',
    selector: { role: 'heading', name: 'Excel sync history' },
  },
  {
    url: '/app/content/documents?tab=received&view=file',
    selector: { role: 'label', name: 'Uploads' },
  },
];
export const ALL_DASH_ROUTES: any = [
  {
    url: '/app/dash?dashType=Activity',
    selector: { role: 'text', name: 'ACTIVITY DASHBOARD' },
  },
  {
    url: '/app/dash?dashType=Monitor',
    selector: { role: 'text', name: 'MONITOR DASHBOARD' },
  },
];
export const ALL_WORKFLOW_ROUTES: any = [
  {
    url: '/app/workflow_automation/889/detail',
    selector: { role: 'label', name: 'Add Note' },
  },
  {
    url: '/app/workflow_automation/252/preview?entity_type=Firm&entity_id=49166',
    selector: { role: 'heading', name: 'Workflow Process Preview' },
  },
];
export const ALL_TEMPLATE_ROUTES: any = [
  {
    url: '/app/diligence/templates',
    selector: { role: 'heading', name: 'Templates' },
  },
  {
    url: '/app/diligence/template/6086/preview',
    selector: { role: 'heading', name: 'Categories' },
  },
  {
    url: '/app/diligence/template/6086/categories/171438/subcategories/171448/questions',
    selector: { role: 'heading', name: 'Categories and Sub-categories' },
  },
  {
    url: '/app/diligence/template/6086/categories/',
    selector: { role: 'heading', name: 'Categories and Sub-categories' },
  },
  {
    url: '/app/diligence/template/6086/categories/171438/subcategories/',
    selector: { role: 'heading', name: 'Categories and Sub-categories' },
  },
  {
    url: '//app/diligence/template/6086/scoring/',
    selector: { role: 'heading', name: 'Define rules for creating' },
  },
  {
    url: '/app/diligence/template/6086/print_preview/',
    selector: { role: 'text', name: 'Status' },
  },
];
export const ALL_PROJECTS_ROUTES: any = [
  {
    url: '/app/diligence/projects/activity?type=in-progress',
    selector: { role: 'text', name: 'My Projects' },
  },
  {
    url: '/app/diligence/2/firms/63952/projects/1059364/summary',
    selector: { role: 'text', name: 'Quick View' },
  },
  {
    url: '//app/diligence/2/firms/63952/projects/1059364/questionnaire',
    selector: { role: 'heading', name: 'Categories' },
  },
  {
    url: '/app/diligence/2/firms/63952/projects/1059364/response_history',
    selector: { role: 'text', name: 'Status' },
  },
  {
    url: '/app/diligence/2/firms/63952/projects/1059364/assignment_status',
    selector: { role: 'heading', name: 'Status' },
  },
  {
    url: '/app/diligence/2/firms/63952/projects/1059364/documents/list',
    selector: { role: 'text', name: 'Status' },
  },
  {
    url: '/app/diligence/2/firms/63952/projects/1059364/notes',
    selector: { role: 'text', name: 'Status' },
  },
  {
    url: '/app/diligence/2/firms/63952/projects/1059364/investment_ratings',
    selector: { role: 'text', name: 'Status' },
  },
  {
    url: '/app/diligence/2/firms/63952/projects/1059364/recommendations',
    selector: { role: 'text', name: 'Status' },
  },

  {
    url: '/app/diligence/invite',
    selector: { role: 'text', name: 'Select the purpose for this' },
  },
];

export const ALL_NEW_MENU_ROUTES: any = [
  // {
  //   url: '/app/diligence/invite',
  //   selector: { role: 'heading', name: 'Rating/Score' }, //getByText('Select the purpose for this').
  // },
  //page.getByRole('menu').locator('a').filter({ hasText: 'Firm' }).click();
];
export const ALL_ENTITY_ROUTES: any = [
  {
    url: '/app/monitor/firms',
    selector: { role: 'heading', name: 'Monitor Firm Relationship' },
  },
  {
    url: '/app/firms/49166/profile/monitor',
    selector: { role: 'label', name: 'Monitor' },
  },
  {
    url: '/app/firms/49166/profile/aum_tr',
    selector: { role: 'label', name: 'AUM & Track Record' },
  },
  {
    url: '/app/firms/49166/profile/documents/list?tab=uploads&view=file',
    selector: { role: 'label', name: 'Documents' },
  },
  {
    url: '/app/firms/49166/profile/address',
    selector: { role: 'label', name: 'Add Address' },
  },
  {
    url: '/app/firms/49166/profile/related_entities',
    selector: { role: 'label', name: 'Add Product' },
  },
  {
    url: '/app/firms/49166/profile/associated_contacts',
    selector: { role: 'heading', name: 'Associated Contact(s)' },
  },
  {
    url: '/app/firms/49166/profile/recommendations',
    selector: {
      role: 'a',
      name: 'Back to all Firms',
      isLocator: true,
      locatorType: 'a',
    },
  },

  //"---------------------------------------------------------------------------------------------"
  {
    url: '/app/monitor/strategies',
    selector: { role: 'heading', name: 'Monitor Strategies' },
  },
  {
    url: '/app/firms/1/strategies/9326/profile/monitor',
    selector: { role: 'text', name: 'Relationship Summary' },
  },
  {
    url: '/app/firms/1/strategies/9326/profile/summary',
    selector: { role: 'heading', name: 'Management Firm' },
  },
  {
    url: '/app/firms/1/strategies/9326/profile/aum_tr',
    selector: { role: 'label', name: 'Add / UploadAUM / Track Record' },
  },
  {
    url: '/app/firms/1/strategies/9326/profile/documents/list?tab=uploads&view=file',
    selector: { role: 'label', name: 'Uploads' },
  },
  {
    url: '/app/firms/1/strategies/9326/profile/related_entities',
    selector: { role: 'heading', name: 'Related Entities' },
  },
  {
    url: '/app/firms/1/strategies/9326/profile/contacts',
    selector: { role: 'heading', name: 'Associated Contact(s)' },
  },
  {
    url: '/app/firms/1/strategies/9326/profile/associated_entities',
    selector: { role: 'heading', name: 'Associated Products' },
  },
  {
    url: '/app/firms/1/strategies/9326/profile/recommendations',
    selector: {
      role: 'a',
      name: 'Back to all Strategies',
      isLocator: true,
      locatorType: 'a',
    },
  },

  //"---------Products------------------------------------------------------------------------------------"
  {
    url: '/app/monitor/investments',
    selector: { role: 'heading', name: 'Monitor Products' },
  },
  {
    url: '/app/firms/1/funds/9500/profile/monitor',
    selector: { role: 'text', name: 'Relationship Summary' },
  },
  {
    url: '/app/firms/1/funds/9500/profile/summary',
    selector: { role: 'heading', name: 'Management Firm' },
  },
  {
    url: '/app/firms/1/funds/9500/profile/aum_tr',
    selector: { role: 'label', name: 'Add / UploadAUM / Track Record' },
  },
  {
    url: '/app/firms/1/funds/9500/profile/documents/list?tab=uploads&view=file',
    selector: { role: 'label', name: 'Uploads' },
  },
  {
    url: '/app/firms/1/funds/9500/profile/related_entities',
    selector: { role: 'heading', name: 'Related Entities' },
  },
  {
    url: '/app/firms/1/funds/9500/profile/contacts',
    selector: { role: 'heading', name: 'Associated Contact(s)' },
  },
  {
    url: '/app/firms/1/funds/9500/profile/vehicles',
    selector: { role: 'heading', name: 'Related Vehicle(s)' },
  },
  {
    url: '/app/firms/1/funds/9500/profile/recommendations',
    selector: {
      role: 'a',
      name: 'Back to all Products',
      isLocator: true,
      locatorType: 'a',
    },
  },

  //"---------Vehicles------------------------------------------------------------------------------------"
  {
    url: '/app/monitor/vehicles',
    selector: { role: 'heading', name: 'Monitor Vehicles' },
  },
  {
    url: '/app/firms/1/funds/9500/vehicles/8792/profile/monitor',
    selector: { role: 'text', name: 'Relationship Summary' },
  },

  {
    url: '/app/firms/1/funds/9500/vehicles/8792/profile/aum_tr',
    selector: { role: 'label', name: 'Add / UploadAUM / Track Record' },
  },
  {
    url: '/app/firms/1/funds/9500/vehicles/8792/profile/documents/list?tab=uploads&view=file',
    selector: { role: 'label', name: 'Uploads' },
  },
  {
    url: '/app/firms/1/funds/9500/vehicles/8792/profile/related_entities',
    selector: { role: 'heading', name: 'Related Entities' },
  },
  {
    url: '/app/firms/1/funds/9500/vehicles/8792/profile/related_vehicles',
    selector: { role: 'heading', name: 'Related Entities' },
  },
  {
    url: '/app/firms/1/funds/9500/vehicles/8792/profile/recommendations',
    selector: {
      role: 'a',
      name: 'Back to all Vehicles',
      isLocator: true,
      locatorType: 'a',
    },
  },
  //"---------contacts------------------------------------------------------------------------------------"
  {
    url: '/app/monitor/contacts',
    selector: { role: 'label', name: 'Apply Filters' },
  },
  {
    url: '/app/contacts/72350',
    selector: { role: 'text', name: 'Quick View' },
  },
  //"---------Manage AUM & Track Records------------------------------------------------------------------------------------"
  {
    url: '/app/content/aum_tr',
    selector: { role: 'heading', name: 'Manage AUM & Track Records' },
  },
];
