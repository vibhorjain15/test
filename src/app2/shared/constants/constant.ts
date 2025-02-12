import { HttpContextToken } from '@angular/common/http';
import { ColDef } from 'ag-grid-community';
import * as moment from 'moment';

export const baseUrl = 'https://dv-test-api.azurewebsites.net/api/';
export const siteKey = '6Le18uIeAAAAAFETJrSsdtSI0RUL-5Ay7TgOJvS7';
// export const baseUrl = 'https://dv-dev-api.diligencevault.com/api/';
// export const baseUrl = 'https://dvtestapi.azurefd.net/api/';
// export const baseUrl = 'https://dv-test-api.azurewebsites.net/api/';
// export const baseUrl = 'https://dv-dev-api.diligencevault.com/api/';

export const SKIP_AUTH_FAILURE_REDIRECTION = new HttpContextToken<boolean>(
  () => false
);
export const SKIP_404_REDIRECTION = new HttpContextToken<boolean>(() => false);
export const SKIP_400_ALERT = new HttpContextToken<boolean>(() => false);

export const SKIP_BAD_GATEWAY_ALERT = new HttpContextToken<boolean>(
  () => false
);
export const SKIP_INTERNAL_SERVER_ERROR_ALERT = new HttpContextToken<boolean>(
  () => false
);
export const authenticationUrls = {
  login: baseUrl + 'auth/token',
  verifyUsername: baseUrl + 'Account/VerifyUserName',
  forgotPassword: baseUrl + 'Account/ForgotPassword',
  confirmEmail: baseUrl + 'account/confirm',
  verifyToken: baseUrl + 'Account/VerifyToken',
  resetPassword: baseUrl + 'Account/ResetPassword',
};

export const firstLoadUrls = [
  'user_notification_settings',
  'account',
  'team_members',
  'subscription_limits',
  'service/dvapi_service/pubsub_token',
  'service/dvapi_service/task_file_list',
  'function_assignments',
  'feedback_types',
  'notifications/unread_count',
  'document_tag_definitions',
  'notifications',
];

export const USER_ROLES = {
  ADMIN: 'superadmin',
  OWNER: 'superowner',
  READONLY: 'superviewer',
  READWRITE: 'supercontributor',
  RESTRICTED: 'restricted',
  SECURITYADMIN: 'securityadmin',
  BUSINESSADMIN: 'businessadmin',
};
export const keywordConstants = {
  Product: 'Fund',
  Fund: 'Products',
  Products: 'Products',
  Program: 'Program',
  Firm: 'Firm',
  Project: 'Duediligence',
  Document: 'Document',
  Vehicle: 'Vehicle',
  FormADV: 'FormADV',
  MyFirm: 'Myfirm',
  Review: 'Review',
  Contact: 'Contact',
  Rating: 'Rating',
  Strategy: 'Strategy',
  Template: 'Template',
  Question: 'Question',
  Subcategory: 'Subsection',
  Category: 'Section',
  Investor: 'Investor',
  Answer: 'Answer',
  Comment: 'Comment',
};
export const iconsList = [
  { name: 'Update', icon: 'bolt' },
  { name: 'Related Entities', icon: 'linked-items' },
  { name: 'Under Review', icon: 'under-construction-2' },
  { name: 'Overview', icon: 'overview' },
  { 'Cloud based': 'cloud-lock', icon: 'cloud-lock' },
  { name: 'Checklist', icon: 'check-all' },
  { name: 'Investor', icon: 'investor' },
  { name: 'Org Chart', icon: 'branches' },
  { name: 'Score', icon: 'scoring' },
  { name: 'Analytics', icon: 'analytics2' },
  { name: 'Performance', icon: 'bar-graph' },
  { name: 'Research', icon: 'binoculars' },
  { name: 'Analytics 2', icon: 'computer-statistics' },
  { name: 'Workflow', icon: 'controls' },
  { name: 'Meeting', icon: 'handshake' },
  { name: 'payment-cogs', icon: 'payment-cogs' },
  { name: 'Startup', icon: 'rocket' },
  { name: 'tools', icon: 'tools' },
  { name: 'Team', icon: 'users' },
  { name: 'Team 2', icon: 'team' },
  { name: 'secure', icon: 'secure' },
  { name: 'History', icon: 'history' },
  { name: 'Notes', icon: 'notepad' },
  { name: 'Privacy', icon: 'privacy' },
  { name: 'access-level', icon: 'access-level' },
  { name: 'Assets', icon: 'aum' },
  { name: 'Strategy', icon: 'strategy' },
  { name: 'Meeting 2', icon: 'meeting' },
  { name: 'thunder', icon: 'thunder' },
  { name: 'Follow', icon: 'follow-fund' },
  { name: 'New Fund', icon: 'add-fund' },
  { name: 'New Contact', icon: 'add-user' },
  { name: 'compare', icon: 'compare' },
  { name: 'manager', icon: 'manager' },
  { name: 'file-doc', icon: 'file-doc' },
  { name: 'file-docx', icon: 'file-docx' },
  { name: 'readonly', icon: 'readonly' },
  { name: 'document-question', icon: 'document-question' },
  { name: 'doubt', icon: 'doubt' },
  { name: 'follow-up', icon: 'follow-up' },
  { name: 'raise-hand', icon: 'raise-hand' },
  { name: 'fund', icon: 'fund' },
  { name: 'analytics', icon: 'analytics' },
  { name: 'monitor', icon: 'monitor' },
  { name: 'chart', icon: 'chart' },
  { name: 'analyze', icon: 'analyze' },
  { name: 'gears', icon: 'gears' },
  { name: 'manage', icon: 'manage' },
  { name: 'bulb', icon: 'bulb' },
  { name: 'dash', icon: 'dash' },
  { name: 'grid', icon: 'grid' },
  { name: 'na', icon: 'na' },
  { name: 'file-plus', icon: 'file-plus' },
  { name: 'coffee', icon: 'coffee' },
  { name: 'picture', icon: 'picture' },
  { name: 'upload2', icon: 'upload2' },
  { name: 'Attachment', icon: 'attachment' },
  { name: 'Tweet', icon: 'retweet' },
  { name: 'Key', icon: 'key' },
  { name: 'Domicile', icon: 'location' },
  { name: 'Email', icon: 'mail' },
  { name: 'Due Date', icon: 'calendar' },
  { name: 'add-user-4', icon: 'add-user-4' },
  { name: 'th', icon: 'th' },
  { name: 'arrow-back', icon: 'arrow-back' },
  { name: 'Phone', icon: 'phone' },
  { name: 'Share', icon: 'share' },
  { name: 'Copy', icon: 'clone' },
  { name: 'file-add', icon: 'file-add' },
  { name: 'file', icon: 'file' },
  { name: 'Dots', icon: 'dots-three-vertical' },
  { name: 'Ratings 2', icon: 'star-half' },
  { name: 'page-break', icon: 'page-break' },
  { name: 'movie', icon: 'movie' },
  { name: 'Excel', icon: 'file-excel' },
  { name: 'git-compare', icon: 'git-compare' },
  { name: 'sign-out', icon: 'sign-out' },
  { name: 'bars', icon: 'bars' },
  { name: 'mobile', icon: 'mobile' },
  { name: 'Not Applicable', icon: 'not-applicable' },
  { name: 'copy', icon: 'copy' },
  { name: 'Info', icon: 'info' },
  { name: 'pushpin', icon: 'pushpin' },
  { name: 'add-user-3', icon: 'add-user-3' },
  { name: 'user-check', icon: 'user-check' },
  { name: 'pause2', icon: 'pause2' },
  { name: 'home', icon: 'home' },
  { name: 'scores', icon: 'scores' },
  { name: 'Pause', icon: 'pause' },
  { name: 'check2', icon: 'check2' },
  { name: 'font', icon: 'font' },
  { name: 'Image', icon: 'image' },
  { name: 'underline', icon: 'underline' },
  { name: 'pie-chart', icon: 'pie-chart' },
  { name: 'external-link', icon: 'external-link' },
  { name: 'Table', icon: 'table' },
  { name: 'bell', icon: 'bell' },
  { name: 'circle', icon: 'circle' },
  { name: 'powerpoint', icon: 'powerpoint' },
  { name: 'search', icon: 'Search' },
  { name: 'star', icon: 'star' },
  { name: 'Star', icon: 'star-o' },
  { name: 'user', icon: 'user' },
  { name: 'check', icon: 'check' },
  { name: 'close', icon: 'close' },
  { name: 'remove', icon: 'remove' },
  { name: 'times', icon: 'times' },
  { name: 'cog', icon: 'cog' },
  { name: 'gear', icon: 'gear' },
  { name: 'Clock', icon: 'clock-o' },
  { name: 'refresh', icon: 'refresh' },
  { name: 'Flag', icon: 'flag' },
  { name: 'tag', icon: 'tag' },
  { name: 'bookmark', icon: 'bookmark' },
  { name: 'print', icon: 'print' },
  { name: 'pencil', icon: 'pencil' },
  { name: 'Left', icon: 'chevron-left' },
  { name: 'Right', icon: 'chevron-right' },
  { name: 'Plus', icon: 'plus-circle' },
  { name: 'Minus', icon: 'minus-circle' },
  { name: 'check-circle', icon: 'check-circle' },
  { name: 'question-circle', icon: 'question-circle' },
  { name: 'ban', icon: 'ban' },
  { name: 'mail-forward', icon: 'mail-forward' },
  { name: 'expand', icon: 'expand' },
  { name: 'compress', icon: 'compress' },
  { name: 'plus', icon: 'plus' },
  { name: 'minus', icon: 'minus' },
  { name: 'Fire', icon: 'fire' },
  { name: 'Eye', icon: 'eye' },
  { name: 'Alert', icon: 'exclamation-triangle' },
  { name: 'Warning', icon: 'warning' },
  { name: 'Up', icon: 'chevron-up' },
  { name: 'Down', icon: 'chevron-down' },
  { name: 'cogs', icon: 'cogs' },
  { name: 'Approve', icon: 'thumbs-o-up' },
  { name: 'Not Approved', icon: 'thumbs-o-down' },
  { name: 'upload', icon: 'upload' },
  { name: 'Tasks', icon: 'tasks' },
  { name: 'Screen', icon: 'filter' },
  { name: 'Proposal', icon: 'briefcase' },
  { name: 'Square', icon: 'square' },
  { name: 'Comment', icon: 'comment-o' },
  { name: 'comments-o', icon: 'comments-o' },
  { name: 'angle-left', icon: 'angle-left' },
  { name: 'angle-right', icon: 'angle-right' },
  { name: 'angle-up', icon: 'angle-up' },
  { name: 'angle-down', icon: 'angle-down' },
  { name: 'smile-o', icon: 'smile-o' },
  { name: 'unlock-alt', icon: 'unlock-alt' },
  { name: 'ellipsis-h', icon: 'ellipsis-h' },
  { name: 'thumbs-up', icon: 'thumbs-up' },
  { name: 'thumbs-down', icon: 'thumbs-down' },
  { name: 'Firm', icon: 'institution' },
  { name: 'file-pdf-o', icon: 'file-pdf-o' },
];

export const dateNew = [
  { label: 'Last 1 month', value: 1 },
  { label: 'Last 3 months', value: 3 },
  { label: 'Last 6 months', value: 6 },
  { label: 'Last 1 year', value: 12 },
  { label: 'No Filter', value: 'null' },
];

export const dateRanges = {
  null: {
    label: 'No Filter',
    value: null,
    range: {
      startDate: moment(),
      endDate: moment(),
    },
  },
  1: {
    label: 'Last 1 Month',
    value: 1,
    range: {
      startDate: moment().subtract(1, 'months'),
      endDate: moment(),
    },
  },
  3: {
    label: 'Last 3 Months',
    value: 3,
    range: {
      startDate: moment().subtract(3, 'months'),
      endDate: moment(),
    },
  },
  6: {
    label: 'Last 6 Months',
    value: 6,
    range: {
      startDate: moment().subtract(6, 'months'),
      endDate: moment(),
    },
  },
  12: {
    label: 'Last 1 Year',
    value: 12,
    range: {
      startDate: moment().subtract(1, 'year'),
      endDate: moment(),
    },
  },
};
export const dateRange = {
  'Last 1 month': [moment().subtract(1, 'month'), moment()],
  'Last 3 month': [moment().subtract(3, 'month'), moment()],
  'Last 6 month': [moment().subtract(6, 'month'), moment()],
  'Last 1 year': [moment().subtract(1, 'year'), moment()],
};

export const entityList = [
  { id: 'firms', title: 'Firms' },
  { id: 'investors', title: 'Investors' },
  { id: 'contacts', title: 'Contacts' },
];

export const entity_types_investor = [
  { name: 'Product', value: 'Fund' },
  { name: 'Firm', value: 'Firm' },
  { name: 'Vehicle', value: 'Vehicle' },
  { name: 'Strategy', value: 'Strategy' },
];

export const entity_types_manager = [
  { name: 'My Firm', value: 'Myfirm' },
  { name: 'Product', value: 'Fund' },
  { name: 'Strategy', value: 'Strategy' },
  { name: 'Vehicle', value: 'Vehicle' },
];

export const DateRanges = [
  {
    value: [
      moment()
        .subtract(1, 'month')
        .set({
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0,
        })
        .toDate(),
      moment()
        .set({
          hour: 23,
          minute: 59,
          second: 59,
          millisecond: 999,
        })
        .toDate(),
    ],
    label: 'Last 1 month',
  },
  {
    value: [
      moment()
        .subtract(3, 'month')
        .set({
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0,
        })
        .toDate(),
      moment()
        .set({
          hour: 23,
          minute: 59,
          second: 59,
          millisecond: 999,
        })
        .toDate(),
    ],
    label: 'Last 3 months',
  },
  {
    value: [
      moment()
        .subtract(6, 'month')
        .set({
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0,
        })
        .toDate(),
      moment()
        .set({
          hour: 23,
          minute: 59,
          second: 59,
          millisecond: 999,
        })
        .toDate(),
    ],
    label: 'Last 6 months',
  },
  {
    value: [
      moment()
        .subtract(1, 'year')
        .set({
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0,
        })
        .toDate(),
      moment()
        .set({
          hour: 23,
          minute: 59,
          second: 59,
          millisecond: 999,
        })
        .toDate(),
    ],
    label: 'Last 1 year',
  },
  {
    value: [
      moment()
        .set({
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0,
        })
        .toDate(),
      moment()
        .set({
          hour: 23,
          minute: 59,
          second: 59,
          millisecond: 999,
        })
        .toDate(),
    ],
    label: 'Clear filter',
  },
];

export const errorMessageMap = {
  required: '{{fieldName}} is required',
  email: 'Please enter a valid email',
  containsHtml: 'Please enter a valid {{fieldName}}',
  validateEquals: '{{fieldName}} do not match',
  uniqueEmail: 'This email address is taken',
  number: '{{fieldName}} must be a number',
  minlength:
    '{{fieldName}} is too short. Minimum {{charLength}} characters required',
  maxlength:
    '{{fieldName}} is too long. Maximum {{charLength}} characters allowed',
  emailExistence: 'This email does not exist in our database',
  url: 'Please enter a valid url',
  uniqueItem: "You've entered this {{fieldName}} already",
  passwordLowercaseChar: 'At least one lowercase letter is required',
  passwordUppercaseChar: 'At least one uppercase letter is required',
  passwordSpecialChar:
    'At least one of these symbols is required: !"#$%&\'()*+,-./:;<=>?@[]^_`{|}~',
  passwordRequiredLength: 'Password needs to be between 8 & 16 characters long',
  passwordNumber: 'At least one number is required',
  passwordNoWhiteSpace: 'Password should not contain whitespaces',
  alphaNumericPlus:
    'Only Letters, Numbers, and limited special characters (Underscore, Single Quote, Parenthesis, Comma, Hyphen, Period) allowed',
  avoidFirstSplCharacter: '{{fieldName}} cannot start with a special character',
  validateUserFirmAssociation:
    'This user is already associated with another firm, please use another user.',
  pattern: '{{customPatternMessage}}',
  duplicateColor: "You can't have duplicate colors in the list.",
  duplicateCategory: "You can't have duplicate categories.",
  duplicateTeam: "You can't select a team multiple times.",
  min: '{{fieldName}} should be greater than {{minValue}}',
  digitsOnly: 'Letters or special characters not allowed',
  validPhoneCharsOnly: 'Alphabets and some special characters not allowed',
  validCityName: 'Only Alphabets and some special characters allowed',
  validZipcode: 'Zipcode not valid',
  validName: 'Only valid Windows Document name allowed',
  validDateRange: 'Date Range Not Valid',
  validDate: 'Date not valid',
  freeUserMessage: 'Available to premium subscribers',
};
export const alphabets = [
  { char: '', displayValue: 'A-Z' },
  { char: 'a', displayValue: 'A' },
  { char: 'b', displayValue: 'B' },
  { char: 'c', displayValue: 'C' },
  { char: 'd', displayValue: 'D' },
  { char: 'e', displayValue: 'E' },
  { char: 'f', displayValue: 'F' },
  { char: 'g', displayValue: 'G' },
  { char: 'h', displayValue: 'H' },
  { char: 'i', displayValue: 'I' },
  { char: 'j', displayValue: 'J' },
  { char: 'k', displayValue: 'K' },
  { char: 'l', displayValue: 'L' },
  { char: 'm', displayValue: 'M' },
  { char: 'n', displayValue: 'N' },
  { char: 'o', displayValue: 'O' },
  { char: 'p', displayValue: 'P' },
  { char: 'q', displayValue: 'Q' },
  { char: 'r', displayValue: 'R' },
  { char: 's', displayValue: 'S' },
  { char: 't', displayValue: 'T' },
  { char: 'u', displayValue: 'U' },
  { char: 'v', displayValue: 'V' },
  { char: 'w', displayValue: 'W' },
  { char: 'x', displayValue: 'X' },
  { char: 'y', displayValue: 'Y' },
  { char: 'z', displayValue: 'Z' },
];
export const Regex = {
  digitsOnly: '^[0-9]*$',
  lettersAndDigitsOnly: '^[a-zA-Z0-9]*$',
  validPhoneCharsOnly: '^[0-9 ()/+/-]*$',
  alphaNumericPlus: "^[a-zA-Z0-9_'(),-. ]+$",
  avoidFirstSplCharacter: '^[^+@=\\-]|^$',
  containsHtmlTags: /<\/?[a-z][\s\S]*>/i,
  validName:
    /^(?!((com[0-9]|con|lpt[0-9]|nul|prn|aux)\b|[\s.=\+\-\@]))[^\\\/:*"?<>|]{1,254}$/i,
  validCityName:
    "^([a-zA-Z\u0080-\u024F]+(?:. |-| |'))*[a-zA-Z\u0080-\u024F]*$",
  validZipcode: '^[a-zA-Z0-9][a-zA-Z0-9- ]{0,10}[a-zA-Z0-9]$',
  noDecimal: /^[+]?\d{0,7}$/,
  extractUrl: /(https?:\/\/[^ ]*.')/g,
  numericResponse: /(^100([.]0{0,16})?)$|(^\d{1,16}([.]\d{0,33})?)$/,
  validEmail:
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  validPersonNames:
    /^(?!.*[!@#$%^&*\"()_+=\[\]{}|\\;:<>?/~])(?!.*(?:\s{3}|\s{2}\s))\S[\S\s]{0,48}\S$/,
  validFirmWebsite:
    /^(?:(?:https?|ftp):\/\/)?(?:www\.)?((?!(www|http))[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,10})(?:\/[\w-]+(?:\/[\w-]+)*)?(?!.*[:\s])\/?(?:#.*)?$/,
  validAccessLevelName: /^[a-zA-Z0-9][a-zA-Z0-9 ]*[a-zA-Z0-9]$/,
  validEmailId: '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,10}$',
  validUrl:
    /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/){1}[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,10}(:[0-9]{1,5})?(\/.*)?(\?.*)?$/i,
  urlRegExp:
    /^(?!.*\.\.)((https?:\/\/)?(www\.)?)?([\w\-\.]+)\.((?<!^(https?:\/\/)?www\.)([a-z]{2,6}))(?:\/[^\s]*)?$/,
};
export const headerConstants = {
  RATINGDEFINITION: 'Rating/Score Definition',
};
export const ratingConstants = {
  notRatedValue: -1,
  naValue: 0,
  ScoreBand: 'ScoreBand',
  Absolute: 'Absolute',
};
export const ratingLevels = {
  Default: 'default', // manual rating scheme
  Section: 'section',
  Question: 'question',
};

export const ERROR_CODES = {
  BAD_REQUEST: 409,
  ACCEPTED: 202,
  CONFLICT: 409,
};

export const SITE_KEY = '6Le18uIeAAAAAFETJrSsdtSI0RUL-5Ay7TgOJvS7';

export const languageCodeMap = [
  { name: 'English', code: 'en' },
  // { name: 'Japanese', code: 'ja' },
];
export const FILTER_TERNARY_OPERATORS = {
  OR: 'or',
  AND: 'and',
  GENERAL: 'general',
};
export const operatorList = [
  {
    id: 2202,
    value: 'ac',
    display_symbol: 'Δ',
    display_label: 'Any Change',
  },
  {
    id: 2201,
    value: 'cont',
    display_symbol: '⊂',
    display_label: 'Contains',
  },
  {
    id: 1464,
    value: 'eq',
    display_symbol: '=',
    display_label: 'Equal To',
  },
  {
    id: 1466,
    value: 'gt',
    display_symbol: '>',
    display_label: 'Greater Than',
  },
  {
    id: 1468,
    value: 'gte',
    display_symbol: '>=',
    display_label: 'Greater Than or Equal To',
  },
  {
    id: 1467,
    value: 'lt',
    display_symbol: '<',
    display_label: 'Less Than',
  },
  {
    id: 1469,
    value: 'lte',
    display_symbol: '<=',
    display_label: 'Less Than or Equal To',
  },
  {
    id: 3011,
    value: 'notcontains',
    display_symbol: 'Not contains',
    display_label: 'Not contains',
  },
  {
    id: 1465,
    value: 'noteq',
    display_symbol: '≠',
    display_label: 'Not Equal To',
  },
];
export const hierarchyConstants = {
  Title: 'Strategies',
  Fund: 'fund',
  Masterfund: 'masterfund',
  Strategy: 'strategy',
};
export const KeyTableNameMap = {
  investmentsStrategyGrid: 'strategy_name',
  investmentsProductGrid: 'product_name',
  investmentsVehiclesGrid: 'vehicle_name',
  manageFirmsGrid: 'display_name',
  manage_strategy: 'strategy_name',
  manage_product: 'product_name',
  manage_vehicle: 'vehicle_name',
  manage_firm: 'display_name',
  templates: 'name',
  contacts: 'contact_name',
  recommendations: 'recommendations',
};
export const statusLabel = {
  ACTIVE: 'Active',
  INACTIVE: 'Deactivated',
};
export const authSettings = {
  client_id: 'DvApp',
};
export const FILTER_TYPES = {
  STRING: 'str',
  NUMBER: 'number',
  RANGE: 'range',
  DATE: 'date',
  DROPDOWN: 'dropdown',
  CHECKBOX: 'checkbox',
  DROP: 'drop',
  DYNAMIC: 'dynamic',
  PARAGRAPH: 'paragraph',
  MULTILINE: 'textmultiline',
  LINK: 'link',
  INTEGER: 'integer',
  NUMERIC: 'numeric',
  TEXT: 'text',
  BOOLEAN: 'bool',
  DATETIME: 'datetime',
  INT: 'int',
  RATING: 'rating',
};

export const defaultColumn: ColDef = {
  colId: '',
  headerName: '',
  field: '',
  sortable: true,
  filter: false,
  menuTabs: [],
  resizable: true,
  flex: 1,
};
export const grid_widths_map = {
  icon_xs: 20,
  icon_sm: 30,
  icon_lg: 60,
  icon_xl: 80,
  sm_column_xxxm: 35,
  sm_column_xxm: 100,
  sm_column_xm: 150,
  sm_column_sm: 200,
  sm_column_lg: 250,
  sm_column_xl: 300,
  sm_column_xxl: 350,
  lg_column_xxm: 400,
  lg_column_sm: 450,
  lg_column_lg: 500,
  lg_column_xl: 550,
  lg_column_xxl: 600,
};

export const dateSort = (valueA, valueB, nodeA, nodeB, isInverted) => {
  return new Date(nodeA.data?.last_updated_at) <
    new Date(nodeB.data?.last_updated_at)
    ? 1
    : -1;
};
export const dueDateSortNew = (prop) => {
  return (valueA, valueB, nodeA, nodeB, isInverted) => {
    var date1Number = nodeA?.data
      ? nodeA?.data[prop] && new Date(nodeA?.data[prop]).getTime()
      : null;
    var date2Number = nodeB?.data
      ? nodeB?.data[prop] && new Date(nodeB?.data[prop]).getTime()
      : null;
    if (date1Number == null) {
      date1Number = 0;
    }
    if (date2Number == null) {
      date2Number = 0;
    }
    return date1Number - date2Number;
  };
};

export const dateSortFilingDate = (
  valueA,
  valueB,
  nodeA,
  nodeB,
  isInverted
) => {
  var date1Number: any = new Date(nodeA?.data['filingDate']);
  var date2Number: any = new Date(nodeB?.data['filingDate']);
  return date1Number - date2Number;
};

export const questionFilter = [
  {
    name: 'All Questions',
    id: 'all',
  },
  {
    name: 'Only Mandatory Questions',
    id: 'mandatory',
  },
];

export const dateSortNew = (prop) => {
  return (valueA, valueB, nodeA, nodeB, isInverted) => {
    var date1Number =
      nodeA?.data && nodeA.data[prop] && new Date(nodeA?.data[prop]).getTime();
    var date2Number =
      nodeB?.data && nodeB.data[prop] && new Date(nodeB?.data[prop]).getTime();
    if (date1Number === date2Number) {
      return 0;
    }

    if (date1Number === null) {
      return isInverted ? -1 : 1;
    } else if (date2Number === null) {
      return isInverted ? 1 : -1;
    }
    return date1Number - date2Number;
  };
};
export const dateSortWithGroupBy = () => {
  return (valueA, valueB, nodeA, nodeB, isInverted) => {
    if (valueA == '' && valueB == '') {
      return 0;
    } else if (valueA == '') {
      return isInverted ? -1 : 1;
    } else if (valueB == '') {
      return isInverted ? 1 : -1;
    }
    const dateA = new Date(valueA);
    const dateB = new Date(valueB);
    return dateA.getTime() - dateB.getTime();
  };
};

export const RequestTypes = {
  SHAREABLE: 'shareable_request',
  INVESTOR: 'investor_request',
  PREAPPROVED: 'preapproved_request',
};

export const requestSteps = {
  DOC_PARSER: 'document_parser',
  EXCEL_PARCER: 'excel_parser',
  TEMPLATE_BUILDER: 'template_editor',
  COMPLETE_REQUEST: 'complete_request',
};

export const ProprietoryLicenses = {
  AGGRID:
    'Using_this_{AG_Charts_and_AG_Grid}_Enterprise_key_{AG-051838}_in_excess_of_the_licence_granted_is_not_permitted___Please_report_misuse_to_legal@ag-grid.com___For_help_with_changing_this_key_please_contact_info@ag-grid.com___{Diligencevault}_is_granted_a_{Single_Application}_Developer_License_for_the_application_{Diligence_Module}_only_for_{1}_Front-End_JavaScript_developer___All_Front-End_JavaScript_developers_working_on_{Diligence_Module}_need_to_be_licensed___{Diligence_Module}_has_been_granted_a_Deployment_License_Add-on_for_{1}_Production_Environment___This_key_works_with_{AG_Charts_and_AG_Grid}_Enterprise_versions_released_before_{30_December_2024}____[v3]_[0102]_MTczNTUxNjgwMDAwMA==6fdf02ff5852674cbbb2663695b3dd3b',
  HANDSONTABLE: '822cb-b3aa2-217c0-64509-e9c25',
};

export const tooltip_map = {
  dd_doc: 'Digitized project for document sent by investor',
  dd_new: 'Research and due diligence preceding the initial allocation',
  dd_ongoing: 'Post investment, ongoing information request',
  dd_event_related:
    'Post investment request triggered by a specific event or circumstance, such as personnel change, drawdown, et al',
  dd_profile: 'Internal profile of the manager',
};
export const diligenceStatusConstant = {
  Completed: 'Completed',
  InReview: 'InReview',
  Evaluation: 'Evaluation',
  NotApproved: 'NotApproved',
  Approved: 'Approved',
  Deleted: 'Deleted',
  Retired: 'Retired',
  Withdrawn: 'Withdrawn',
  PendingRestart: 'PendingRestart',
  Started: 'Started',
  Followup: 'Followup',
  ExtensionRequested: 'ExtensionRequested',
  COMPLETED: 'Completed',
  PRECOMPLETIONREVIEW: 'InReview',
  POSTCOMPLETIONREVIEW: 'Evaluation',
  ReviewPassed: 'ReviewPassed',
  ReviewFailed: 'ReviewFailed',
  UnAssigned: 'UnAssigned',
  Invited: 'Invited',
  Scheduled: 'Scheduled',
  Declined: 'Declined',
  Sent: 'Sent',
};

export const responseStatus = {
  STARTED: 'Started',
  INREVIEW: 'InReview',
  REVIEWSUCCESS: 'ReviewPassed',
  REVIEWFAILED: 'ReviewFailed',
};

export const ResponseSource = {
  AutoFill: 'AutoPopulate',
  ManualEdit: 'User',
  ExcelSync: 'ExcelSync',
};

export const reviewStatusMap = {
  ReviewPassed: 'Approved',
  ReviewFailed: 'Revision Requested',
  ReviewFailedEvaluation: 'Response Rejected',
  InReview: 'In Review',
  Started: 'In Queue',
  reviewpassed: 'Approved',
  reviewfailed: 'Revision Requested',
  inreview: 'In Review',
  started: 'In Queue',
  reviewfailedevaluation: 'Response Rejected',
};

export const dvThresholds = {
  REVIEW_TIMELIMIT: 15000,
  REVIEW_UNDO: 15,
};

export enum ErrorStatusCode {
  BadRequest = 400,
  ResourceNotFound = 404,
  ServiceUnavailable = 503,
  BadGateway = 502,
  Forbidden = 403,
  ConnectionFailed = -1,
  InternalServerError = 500,
  Unauthorized = 401,
  Conflict = 409,
  PartialContent = 206,
}
export const platformLabels = {
  MANAGER: 'Responder',
  INVESTOR: 'Requestor',
};

export const fileIcon = {
  doc: 'file-doc',
  rtf: 'file-doc',
  docx: 'file-docx',
  csv: 'file-excel',
  xls: 'file-excel',
  xlsm: 'file-excel',
  xlsx: 'file-excel',
  pdf: 'file-pdf-o',
  png: 'picture',
  jpg: 'picture',
  jpeg: 'picture',
  gif: 'picture',
  mp4: 'movie',
  mov: 'movie',
  avi: 'movie',
  ppt: 'powerpoint',
  pptx: 'powerpoint',
  pptm: 'powerpoint',
  pps: 'powerpoint',
  ppsx: 'powerpoint',
  vsd: 'visio',
  vsdx: 'visio',
  txt: 'file',
  log: 'file',
  sql: 'file',
  htm: 'file',
  msg: 'mail',
  eml: 'mail',
};

export const RatingCalculationTypes = {
  WeightedAverage: 'WeightedAverage',
  CustomSimpleSum: 'CustomSimpleSum',
  SimpleSum: 'SimpleSum',
};

export const ReportTypes = {
  TEMPLATE: 'template',
  QUESTION: 'question',
};
export const IssueType = {
  Question: 'Question',
  Project: 'Duediligence',
  Firm: 'Firm',
  Product: 'Fund',
  Vehicle: 'Vehicle',
  Strategy: 'Strategy',
};

export const SingularToPluralTypes = {
  Firm: 'Firms',
  Strategy: 'Strategies',
  Fund: 'Funds',
  Vehicle: 'Vehicles',
};

export const FollowUpType = {
  Question: 'Question',
  Project: 'Duediligence',
};

export const ModuleColor = {
  project: 'LavenderPurple',
  template: 'PersianIndigo',
  document: 'BlueGreen',
  qna: 'TomatoRed',
  excel: 'ForestGreen',
  dashboard: 'PastelRed',
  firm: 'AquaGreen',
  product: 'LightBlue',
  vehicle: 'BlushPink',
  strategy: 'DarkPink',
  contact: 'StrongPink',
  'aum-tr': 'RedOrange',
  analyze: 'ShamrockGreen',
  'data-hub': 'GreenishBlue',
  report: 'DodgerBlue',
  partnership: 'LightGreen',
};
export const ResponseStatus = {
  STARTED: 'Started',
  INREVIEW: 'InReview',
  REVIEWSUCCESS: 'ReviewPassed',
  REVIEWFAILED: 'ReviewFailed',
};

export const TrackChangeStatus = {
  STARTED: 'Started',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
};

export enum EntityType {
  Firm = 1220,
  Fund = 1219,
  Vehicle = 1217,
  Strategy = 5004,
  Project = 1105,
  Product = 1219,
  DueDiligence = 1105,
  Contact = 1218,
  TeamMember = 1243,
}

export const entityApiMap = {
  strategy: 'product_search',
  fund: 'fund_search',
  firm: 'firm_search',
  investor: 'firm_search',
  vehicle: 'vehicle_search',
};

export const DvTextLimits = {
  HELP_TEXT_LIMIT: 1000000,
  CATEGORY_TEXT_LIMIT: 150,
  SUB_CATEGORY_TEXT_LIMIT: 150,
};

export const PeriodOptions = [
  {
    id: -1,
    name: 'Both Monthly and Quarterly',
  },
  {
    id: 0,
    name: 'Monthly',
  },
  {
    id: 2,
    name: 'Quarterly',
  },
];

export enum DiligenceTypeEnum {
  dd_review = 'dd_review', // analyst evaluation
  dd_profile = 'dd_profile', // preapproved
  dd_new = 'dd_new',
  dd_ongoing = 'dd_ongoing',
  dd_event_related = 'dd_event_related',
  dd_doc = 'dd_doc',
  inbound = 'inbound',
  shared_profile = 'shared_profile',
}

export const DownloadStatus = {
  started: 1,
  success: 2,
  failed: 3,
};
export const CanDeleteOrEditAtOnce = 1000;
export const EveryonePermissionTypeId = 2;
export const LimitedPermissionTypeId = 3;

export const numericSortWithNoValues = (prop) => {
  // to sort numeric values where not values are present and some rows are maked with "-"
  // code reference taken from the above custom dateSortNew function
  return (valueA, valueB, nodeA, nodeB, isInverted) => {
    const num1 =
      nodeA &&
      (nodeA.data[prop] || nodeA.data[prop] === 0) && // include 0 as a valid value for sorting
      nodeA.data[prop] !== '-'
        ? +nodeA.data[prop]
        : null;
    var num2 =
      nodeB &&
      (nodeB.data[prop] || nodeB.data[prop] === 0) && // include 0 as a valid value for sorting
      nodeB.data[prop] !== '-'
        ? +nodeB.data[prop]
        : null;
    if (num1 === num2) {
      return 0;
    }
    if (num1 === null) {
      return isInverted ? -1 : 1;
    }
    if (num2 === null) {
      return isInverted ? 1 : -1;
    }
    return num1 - num2;
  };
};

export enum NewRequestTypes {
  InvestorRequest = 'Investor Requests',
  StandardDDQ = 'Standard DDQs',
  QaLibrary = 'Q/A Library',
}
export const DownloadMedium = {
  DOWNLOAD: 'download',
  BOTH: 'both',
};

export const DownloadViewTabs = {
  ALL: 'All',
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
};

export const TooltipMessage = {
  ConditionalQuestion:
    'This question may contain additional questions based on the response entered.',
};

export const RSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
  MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCHtKSuUo36fj6jRSeNaVilQNbq
  qFbQYfFLBVcsXZ1DnnlpRwysersDTUNsb+pVqMp3jMa3F0x9fprzKJ4ywuOJXkGF
  E+9SD5z8tErbSNZjjNXhEeRvOQI82mnZT4lwUmdcvSpc0PMfSKoe6eomXzZ3ZO6C
  MpUVwgKJDl76qcHgmQIDAQAB
  -----END PUBLIC KEY-----`;

export const AiPrompts = {
  Summarize: 'Summarize',
  SummarizeInvestor: 'Summarize for investors',
  Elaborate: 'Elaborate',
  FixWritingMistake: 'Fix writing mistakes',
  Readable: 'Make more readable',
  Trim: 'Trim Word Count',
  // Under2000: 'Trim word count by 2000 words',
  // Under1000: 'Trim word count by 1000 words',
  // Under500: 'Trim word count by 500 words',
  // Under200: 'Trim word count by 200 words',
  // Under75: 'Trim word count by 75 words',
  TrimMinimally: 'Trim minimally',
  TrimSignificantly: 'Trim significantly',
  wordCount: 'Trim word count Under Word Limit',
  Tone: 'Change Tone',
  FormalTone: 'Change tone to Formal',
  DirectTone: 'Change tone to Direct',
  ConfidentTone: 'Change tone to Confident',
  CooperativeTone: 'Change tone to Cooperative',
  Voice: 'Change Voice',
  ActiveVoice: 'Change voice to Active',
  PassiveVoice: 'Change voice to Passive',
  Explain: 'Explain the Generated Changes',
  Custom: 'Enter Custom Prompt',
  MainPoints: 'List the Main Points',
  Quantitative: 'Pull All Quantitative Figures and Dates',
};
export const VIEW_ACCESS_LEVELS = {
  USER: 'User',
  FIRM: 'Firm',
};

export const enum DocumentEventTypes {
  document_download = 1,
  document_detail_view = 2,
  document_received_tab_view = 3,
}

export const QuestionnaireSuccessMessages = {
  projectMarkedAsComplete: 'Project is marked as completed',
  sentToRequestForReview: 'Sent to requestor for review',
};
