import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import * as d3 from 'd3';
import { Store } from '@ngxs/store';
import * as moment from 'moment';
import {
  dateNew,
  dateRanges,
  diligenceStatusConstant,
  iconsList,
  keywordConstants,
  Regex,
  USER_ROLES,
} from '../shared/constants/constant';
import { UserModel } from '../store/user/user.model';
import { UserState } from '../store/user/user.state';
import { KeyValue } from '@angular/common';
import { DvSafeHtmlPipe } from '../shared/pipes/dv-trust-html.pipe';
import * as saveAs from 'file-saver';
const selectedColors = [
  '#264E86',
  '#20BF55',
  '#D14549',
  '#01BAEF',
  '#BAD75E',
  '#B576AD',
  '#757575',
  '#E6A71E',
];
const selectedHeatmapColors = [
  '#cc3232',
  '#db7b2b',
  '#e7b416',
  '#99c140',
  '#4CAF50',
];
@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  currentUser;
  scrollId = 0;
  private subscriptionLimits;
  private recordsPerPage = 10;
  private displayGroupByIntro;
  private userData: UserModel;
  validText = (node: any) =>
    node?.text?.trim().length && !Regex.containsHtmlTags.test(node?.text);
  constructor(
    private readonly http: HttpClient,
    private readonly store: Store,
    private readonly dvSafeHtml: DvSafeHtmlPipe
  ) {
    // this.baseData.loadBaseData();
    // this.currentUser = this.baseData.getCurrentUser();
    // this.subscriptionLimits = this.baseData.getSubscriptionLimits();
    // this.userData = this.store.selectSnapshot((state) => state.user);
    this.store.subscribe((state) => {
      this.userData = state.user;
    });
  }

  getIssueTrackerName() {
    return this.store.selectSnapshot(UserState.getFirmPreferenceData)
      ?.issue_tracker_default_name;
  }

  getCurrentUser() {
    this.currentUser = this.store.selectSnapshot(UserState.getCurrentUserData);
    return this.currentUser;
  }

  isDefaultHomePage() {
    let email_notifications = this.store.selectSnapshot(
      (state) => state.user.email_notifications
    );
    return ['default', '', null].includes(email_notifications?.home_page);
  }

  getCurrentFirm() {
    return this.getCurrentUser().firmInfo;
  }

  getSubscriptionLevel() {
    return this.getCurrentUser()?.firmInfo?.subscription;
  }

  isDate(dateStr: string) {
    return moment(dateStr).isValid();
  }

  isAdmin() {
    return this.getCurrentUser().isAdmin;
  }

  hasFirmWideRole() {
    return this.getCurrentUser().hasFirmWideRole;
  }

  isReadOnly() {
    return this.getCurrentUser().isReadOnly;
  }

  isFirstLogin() {
    return this.getCurrentUser().isFirstLogin;
  }

  getSkipIntro() {
    return this.getCurrentUser().skip_tour;
  }

  isFirstDD() {
    return this.getCurrentUser().isFirstDD;
  }

  allowRichTextarea() {
    return this.getCurrentFirm().allowRichTextarea;
  }

  isDocToHtmlEnabled() {
    return this.getCurrentFirm().isDocToHtmlEnabled;
  }

  isFirstTemplate() {
    return this.getCurrentUser().isFirstTemplate;
  }

  isFreeSubscription() {
    return this.getSubscriptionLevel() === 'Free';
  }

  isSmartSubscription() {
    return this.getSubscriptionLevel() === 'Smart';
  }

  isProductiveSubscription() {
    return this.getSubscriptionLevel() === 'Productive';
  }

  isInstitutionalSubscription() {
    return this.getSubscriptionLevel() === 'Institutional';
  }

  isFormADVSubscription() {
    return this.getSubscriptionLevel() === 'FormADV';
  }

  isFormADVAnalyticsSubscription() {
    return this.getSubscriptionLevel() === 'FormADVAnalytics';
  }

  isFullSubscription() {
    return this.getSubscriptionLevel() === 'Full';
  }

  isFundSubscription() {
    return this.getSubscriptionType() === 'Fund';
  }

  isVendorSubscription() {
    return this.getCurrentUser().isVendorSubscription;
  }

  isDocumentUploadByCurrentFirm(user, creatorId: any) {
    return Boolean(user.firmInfo.id === creatorId);
  }

  isCurrentUserFirmOwner(id: any) {
    return Boolean(this.getCurrentUser().firmInfo.id === id);
  }

  endUserAgreementAccepted() {
    return this.getCurrentUser().eucAccepted;
  }

  discussAgreementAccepted() {
    return this.getCurrentUser().discussEUCAccepted;
  }

  // needs to pick the first element of the array. In the future will get the users to select one if they have more
  // than one subscription.
  getSubscriptionType() {
    return this.subscriptionLimits[0].type_id;
  }

  getSubscriptionLimit() {
    return this.subscriptionLimits[0].limit;
  }
  getCurrentSubscription() {
    return this.subscriptionLimits[0];
  }

  isInvestor() {
    return this.getCurrentUser()?.type === 'investor';
  }

  isManager() {
    return this.getCurrentUser().type === 'manager';
  }

  isFreeInvestor() {
    return (
      this.getCurrentUser()?.type === 'investor' &&
      this.getSubscriptionLevel() === 'Free'
    );
  }

  isAngular() {
    return this.getCurrentUser().firmInfo.preferences.ui_version == 'Angular';
  }

  isParserAngular() {
    return (
      this.isAngular() &&
      JSON.parse(this.getCurrentUser().firmInfo.preferences.module_ui_version)
        .parser_ui_version == 2
    );
  }

  formatDatetimeForSuggestedName(date) {
    return moment(new Date(date)).format('DD-MMM-YYYY_HH:mm:ss');
  }

  isFreeManager() {
    return (
      this.getCurrentUser()?.type === 'manager' &&
      this.getSubscriptionLevel() === 'Free'
    );
  }

  getEntityType(subscriptionLimit = null) {
    if (!subscriptionLimit) {
      return 'Product';
    }
    if (subscriptionLimit.type_id === 'Fund') {
      return 'Product';
    } else if (subscriptionLimit.type_id === 'Vendor') {
      return 'Vendor';
    } else {
      return 'Product';
    }
  }

  getEntityCTA(getCurrentSubscription) {
    if (getCurrentSubscription.type_id === 'Fund') {
      return 'Investor Outreach';
    } else if (getCurrentSubscription.type_id === 'Vendor') {
      return 'Client Outreach';
    } else {
      return 'Outreach';
    }
  }

  getEntitySubType(getCurrentSubscription) {
    if (getCurrentSubscription.type_id === 'Fund') {
      return 'Classification';
    } else if (getCurrentSubscription.type_id === 'Vendor') {
      return 'Type';
    } else {
      return 'Classification';
    }
  }

  getDVEntityDisplayName(subscriptionLimit, isInvestor) {
    if (subscriptionLimit.type_id === 'Fund' && isInvestor) {
      return 'Manager';
    } else if (subscriptionLimit.type_id === 'Fund' && !isInvestor) {
      return 'Investor';
    } else if (subscriptionLimit.type_id === 'Vendor' && isInvestor) {
      return 'Vendor';
    } else if (subscriptionLimit.type_id === 'Vendor' && !isInvestor) {
      return 'Client';
    } else {
      return null;
    }
  }

  isApprover() {
    return this.getCurrentUser().is_approver;
  }

  hideGroupByIntro() {
    return this.getCurrentUser().group_by_intro;
  }

  getGroupByIntroDisplayOption() {
    return this.displayGroupByIntro;
  }

  setGroupByIntroDisplayOption(value: any) {
    this.displayGroupByIntro = value;
  }

  $state; // RouterBUG
  goToCurrentFirmProfile() {
    // const $state = $injector.get('$state');
    return this.$state.go('app.firm.settings.profile');
  }

  groupByArray(arr, criteria) {
    if (!arr.length) {
      return [];
    }
    return arr.reduce(function (obj, item) {
      var key = item[criteria];
      if (!obj.hasOwnProperty(key)) {
        obj[key] = [];
      }
      obj[key].push(item);
      return obj;
    }, {});
  }

  // TODO: Replace _.map() method
  // Not used, commenting for now.
  /* serializeObject(obj) {
    if (!obj) {
      return obj;
    }
    _(obj)
      .map(
        (value: any, key: any) =>
          encodeURIComponent(key) + '=' + encodeURIComponent(value)
      )
      .join('&');
  } */

  getGrantMap(user) {
    return {
      ...user,
      manager: user.isManager,
      investor: user.isInvestor,
      admin: user.isAdmin,
      securityAdmin:
        user.firmwide_role.toLowerCase() == USER_ROLES.SECURITYADMIN,
      businessAdmin:
        user.firmwide_role.toLowerCase() == USER_ROLES.BUSINESSADMIN,
      readOnly: user.isReadOnly,
      hasMultipleAccounts: user.firmAccessCount > 1,
      FreeSubscription: user.isFreeSubscription,
      SmartSubscription: user.isSmartSubscription,
      ProductiveSubscription: user.isProductiveSubscription,
      InstitutionalSubscription: user.isInstitutionalSubscription,
      FormADVSubscription: user.isFormADVSubscription,
      FormADVAnalyticsSubscription: user.isFormADVAnalyticsSubscription,
      FullSubscription: user.isFullSubscription,
      FundSubscription: user.isFundSubscription,
      VendorSubscription: user.isVendorSubscription,
      FreeInvestor: user.isFreeInvestor,
      FreeManager: user.isFreeManager,
      PowerBISubscription: user.firmInfo.preferences.enable_powerbi_reports,
      hidePresentationModule:
        !user.firmInfo.preferences.show_presentation_module,
      DiligenceVaultUser:
        user.userName.toLowerCase().indexOf('diligencevault.com') > -1,
      angularView: user.firmInfo.preferences.ui_version == 'Angular',
      angularJSView: user.firmInfo.preferences.ui_version != 'Angular',
    };
  }
  trimLineBreak(string) {
    string.replace(/^(<br \/>)+|(<br \/>)+$/g, '');
  }

  trimFormatting(string) {
    return string.replace(/&nbsp;|<br \/>|\s+|<p>|<\/p>/g, '');
  }

  // TODO: Replace _.any method
  // Not used, commenting for now.
  /* isAuthorized(
    grant_map: { [x: string]: any },
    accessible_to: any,
    hidden_from: any
  ) {
    let result = true;

    if (accessible_to != null) {
      result =
        result &&
        _(accessible_to).any((role: string | number) => grant_map[role]);
    }

    if (hidden_from != null) {
      result =
        result &&
        !_(hidden_from).any((role: string | number) => grant_map[role]);
    }

    return result;
  } */

  getLazyLoadableTemplateFor(templateName) {
    return `/static/lazy-loadable-templates/${templateName}.html`;
  }

  getExcelColumnName(num) {
    let ordA = 'a'.charCodeAt(0);
    let ordZ = 'z'.charCodeAt(0);
    let len = ordZ - ordA + 1;

    let columnName = '';
    while (num >= 0) {
      columnName = String.fromCharCode((num % len) + ordA) + columnName;
      num = Math.floor(num / len) - 1;
    }
    return columnName.toUpperCase();
  }

  // TODO: Replace $window._errs & _errs
  logError(title, data) {
    let errorception = (window as any)._errs;
    if (errorception == null) {
      return;
    }
    //added try catch block to throw new error
    try {
      throw new Error(title);
    } catch (exception) {
      // this exception object has the stack trace object which is needed for posting error to errorception
      const current_user = this.getCurrentUser();
      errorception.meta = {
        id: current_user.id,
        userName: current_user.userName,
        type: current_user.type,
        isAdmin: current_user.isAdmin,
        isReadOnly: current_user.isReadOnly,
        firstName: current_user.firstName,
        lastName: current_user.lastName,
        angularVersion: 'angular',
      };

      if (data && data.config && data.config.headers) {
        delete data.config.headers;
      }

      if (data != null) {
        errorception.meta.data = JSON.stringify(
          data,
          Object.getOwnPropertyNames(data)
        );
      }

      errorception.push(exception);
    }
  }

  // TODO: Replace _.each method
  // Not used, commenting for now.
  /*  filterOut(collection, cb) {
    //returns filtered list simultaneously removing them from the parent list
    const filtered = [];
    const ref = [].slice.call(collection);
    collection.length = 0;
    _(ref).each(function (entity: any) {
      if (cb(entity)) {
        return filtered.push(entity);
      } else {
        return collection.push(entity);
      }
    });
    return filtered;
  } */

  capitalize(str: string) {
    return `${str[0].toUpperCase()}${str.slice(1).toLowerCase()}`;
  }

  supplant(str, o) {
    return str.replace(/\*\|([^\*\|\|\*]*)\|\*/g, (a, b) => {
      const r = o[b.toLowerCase().trim()];
      if (typeof r === 'string' || typeof r === 'number') {
        return r;
      } else {
        return a;
      }
    });
  }

  convertToMillion(number) {
    number = parseInt(number) / 1000000;
    number = Math.round(number * 100) / 100;
    number.toLocaleString('en', { minimumFractionDigits: 2 });
    return number;
  }

  convertToBillion(number) {
    number = parseInt(number) / 1000000000;
    number = Math.round(number * 100) / 100;
    number.toLocaleString('en', { minimumFractionDigits: 2 });
    return number;
  }

  isColorLightOrDarkModified(color) {
    if (!color) {
      return 'black';
    }
    const temp = +(
      '0x' + color?.slice(1)?.replace(color.length < 5 && /./g, '$&$&')
    );
    const r = temp >> 16;
    const g = (temp >> 8) & 255;
    const b = temp & 255;
    const hsp = Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b);
    if (hsp > 150) {
      return 'black';
    } else {
      return 'white';
    }
  }

  isColorLightOrDark(color, hspToCompareColor: number = 150) {
    if(!color) {
      // if no color is given, return dark so background can be white
      return 'dark';
    }
    // Variables for red, green, blue values
    let r = undefined;
    let g = undefined;
    let b = undefined;
    let hsp = undefined;
    // Check the format of the color, HEX or RGB?
    if (color.match(/^rgb/)) {
      // If HEX --> store the red, green, blue values in separate variables
      color = color.match(
        /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
      );
      r = color[1];
      g = color[2];
      b = color[3];
    } else {
      // If RGB --> Convert it to HEX: http://gist.github.com/983661
      color = +(
        '0x' + color.slice(1).replace(color.length < 5 && /./g, '$&$&')
      );
      r = color >> 16;
      g = (color >> 8) & 255;
      b = color & 255;
    }
    // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
    hsp = Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b);
    // Using the HSP value, determine whether the color is light or dark
    if (hsp > hspToCompareColor) {
      return 'light';
    } else {
      return 'dark';
    }
  }

  hexToRgba(hex, alpha) {
    // Remove '#' if present
    hex = hex.replace('#', '');

    // Check if the input is three or six digits, and duplicate if three
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map(function (char) {
          return char + char;
        })
        .join('');
    }

    // Parse the hexadecimal color code into its RGB components
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);

    // Convert the alpha value to a range between 0 and 1
    var a = alpha !== undefined ? parseFloat(alpha) : 1;

    // Return the RGBA format
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
  }

  standardPluralize(text) {
    // return pluralize(text);
  }

  getRecordsPerPageNum() {
    return this.recordsPerPage;
  }

  setRecordsPerPageNum(num) {
    return (this.recordsPerPage = num);
  }

  // TODO: Replace _.filter, _.groupBy, _.each method
  // Not used, commenting for now.
  /* createQuestionnaireTree(sections: any, other: any) {
    const onlyQuestions = _(other).filter(
      (element: { type: string }) => element.type === 'questions'
    );
    const questionsGroupedBySection = _(onlyQuestions).groupBy(
      (question: { attributes: { sectionID: any } }) =>
        question.attributes.sectionID
    );
    _(sections).each(
      (section: { questions: any; attributes: { id: string | number } }) =>
        (section.questions = questionsGroupedBySection[section.attributes.id])
    );
    const subSections = _(sections).filter(
      (section: { attributes: { isParent: any } }) =>
        !section.attributes.isParent
    );
    sections = _(sections).filter(
      (section: { attributes: { isParent: any } }) =>
        section.attributes.isParent
    );
    const groupedSubSections = _(subSections).groupBy(
      (subSection: { attributes: { parentID: any } }) =>
        subSection.attributes.parentID
    );
    _(sections).each(
      (section: { subSections: any; attributes: { id: string | number } }) =>
        (section.subSections = groupedSubSections[section.attributes.id])
    );
    return sections;
  } */

  ipToNumber(ip_address) {
    return ip_address.split('.').reduce((x, y) => +y + x * 256);
  }

  getRangeOfIP(ip_start, ip_end) {
    return 1 + this.ipToNumber(ip_end) - this.ipToNumber(ip_start);
  }

  getFirmPreferences() {
    return this.getCurrentUser()?.firmInfo?.preferences;
  }

  formatDate(date) {
    return moment(new Date(date)).format('YYYY-MM-DD');
  }

  s(pref) {
    if (!pref.color_codes) {
      return selectedColors;
    } else {
      return pref.color_codes;
    }
  }

  getHeatmapColorScheme(pref) {
    if (!pref.heatmap_color_codes) {
      return selectedHeatmapColors;
    } else {
      return pref.heatmap_color_codes;
    }
  }

  getDefaultColorScheme() {
    return selectedColors;
  }

  getIconList() {
    return [].concat(iconsList);
  }

  getDate_from(toDate, value, key) {
    return moment(toDate).subtract(value, key);
  }

  getFromDateTimeFormatted(date) {
    return moment(date)
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .format('YYYY-MM-DD HH:mm:ss');
  }

  getToDateTimeFormatted(date) {
    return moment(date)
      .set({ hour: 23, minute: 59, second: 59, millisecond: 999 })
      .format('YYYY-MM-DD HH:mm:ss');
  }

  getLocalDateTime(date) {
    return moment(date).add(moment(date).utcOffset(), 'minutes');
  }

  getLocalDateTimeGeneric(date) {
    return this.getLocalDateTime(date).toDate();
  }

  getUtcDateTime(date) {
    return moment(date).subtract(moment(date).utcOffset(), 'minutes');
  }

  getUtcFromDateTimeFormatted(date) {
    return this.getFromDateTimeFormatted(this.getUtcDateTime(date));
  }

  getUtcToDateTimeFormatted(date) {
    return this.getToDateTimeFormatted(this.getUtcDateTime(date));
  }

  getUtcFromDateTime(date) {
    return moment(this.getUtcDateTime(date)).set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
  }

  getUtcToDateTime(date) {
    return moment(this.getUtcDateTime(date)).set({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999,
    });
  }

  formatDatetime(date) {
    return moment(new Date(date)).format('YYYY-MM-DD HH:mm:ss');
  }

  formatDateTimeMonthFirstUTC(date) {
    return moment(new Date(date + 'Z')).format('MMMM DD YYYY,hh:mm:ss A');
  }

  formatDatetimeUtc(date) {
    return moment(new Date(date)).format('YYYY-MM-DDTHH:mm:ss');
  }

  getMaxAsOfDate() {
    return moment().add(2, 'weeks').toDate();
  }

  getMaxAsOfDateDiligence() {
    return moment().add(1, 'month').toDate();
  }

  get1MonthAgo() {
    return moment().subtract(1, 'month').toDate();
  }

  fillArray(array, value) {
    //custom method to fill the entire array with the passed value
    let i = 0;
    while (i < array.length) {
      array[i] = value;
      i++;
    }
  }

  getObjectLength(object) {
    return Object.keys(object).length;
  }

  datesInRange(d, start, end) {
    return (
      moment(d).isSameOrAfter(moment(start)) &&
      moment(d).isSameOrBefore(moment(end))
    );
  }

  escapeHtmlString(text) {
    const charMap = {
      '&': '\\&amp;', //for &
      '<': '\\&lt;', //for <
      '>': '\\&gt;', //for >
      '"': '\\&quot;', //for "
      "'": '\\&#039;', //for '
      '/': '\\&sol;',
      '\\': '\\&bsol;',
    };
    return text.replace(/[&<>"'/\\]/g, (m: string | number) => {
      return charMap[m];
    });
  }

  unescapeHtmlString(text) {
    return text
      .replace(/\\&amp;/g, '&') //for &
      .replace(/\\&lt;/g, '<') //for <
      .replace(/\\&gt;/g, '>') //for >
      .replace(/\\&quot;/g, '"') //for "
      .replace(/\\&#039;/g, "'"); //for '
  }

  getPredefinedDateRanges(index) {
    const dateRange = { ...dateRanges[index].range };
    dateRange.startDate = this.getUtcFromDateTime(dateRange.startDate);
    dateRange.endDate = this.getUtcToDateTime(dateRange.endDate);
    return dateRange;
  }

  getDateRanges() {
    return dateNew;
  }

  getExpiryClass(expiryDate, isLabel) {
    let expiryStyleData;
    const diff = moment(expiryDate).diff(moment(), 'seconds');
    const warningThreshold = 1296000; //15 days in seconds
    //There are 3 expiry date changes. A, B and C. If the question is not expiring we show in success-blue,
    //if its expiring in 15 days we show in warning-orange and if its expired then we show in grey.
    if (isLabel) {
      expiryStyleData = {
        class: 'label label-primary',
        text: 'Expires',
      };
      if (diff <= warningThreshold && diff >= 0) {
        expiryStyleData = {
          class: 'label label-warning',
          text: 'Expires',
        };
      } else if (diff < 0) {
        expiryStyleData = {
          class: 'label label-default',
          text: 'Expired',
        };
      }
    } else {
      expiryStyleData = {
        class: 'text text-muted',
        text: '',
      };
      if (diff <= warningThreshold && diff >= 0) {
        expiryStyleData = {
          class: 'text text-warning',
          text: '',
        };
      } else if (diff < 0) {
        expiryStyleData = {
          class: 'text text-danger',
          text: '',
        };
      }
    }
    return expiryStyleData;
  }

  pickTextColorBasedOnBgColorAdvanced(bgColor) {
    // changing the logic here to get rgb values as d3 library passes and converts values in a different way compared to angularJS
    const color = d3.rgb(bgColor);
    const r = color.r;
    const g = color.g;
    const b = color.b;
    const uiColors = [r / 255, g / 255, b / 255];
    const c = uiColors.map((col: number) => {
      if (col <= 0.03928) {
        return col / 12.92;
      }
      return Math.pow((col + 0.055) / 1.055, 2.4);
    });
    const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    if (L > 0.179) {
      return 'black';
    } else {
      return 'white';
    }
  }

  rgbToHex(rgbColor) {
    const color = d3.rgb(rgbColor);
    const r = color.r;
    const g = color.g;
    const b = color.b;
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  getQueryParams(params, url) {
    const href = url;
    const reg = new RegExp('[?&]' + params + '=([^&#]*)', 'i');
    const queryString = reg.exec(href);
    if (queryString) {
      return queryString[1];
    } else {
      return null;
    }
  }

  setQueryParam(key, value, params) {
    let queryParams = params?.split('&');
    let isQueryParamFound = false;
    for (let i = 0; i < queryParams?.length; i++) {
      if (queryParams[i]?.split('=')?.length == 2) {
        let paramKey = queryParams[i]?.split('=')[0];
        if (paramKey?.toLowerCase() == key?.toLowerCase()) {
          queryParams[i] = key + '=' + value;
          isQueryParamFound = true;
        }
      }
    }
    if (!isQueryParamFound) {
      if (!params?.length) {
        return key + '=' + value;
      }
      return params + '&' + key + '=' + value;
    }

    return queryParams.join('&');
  }

  getDisplayEntityType(entity_type) {
    if (entity_type) {
      let display_name = '';
      Object.entries(keywordConstants).forEach(([key, value]) => {
        if (value.toLowerCase() === entity_type.toLowerCase()) {
          display_name = key;
        }
      });
      return display_name;
    } else {
      return null;
    }
  }

  getDisplayUserRole(role) {
    let userRoles = {
      superadmin: 'Super Admin',
      superowner: 'Owner',
      superviewer: 'Viewer',
      supercontributor: 'readwrite',
      restricted: 'Restricted',
      securityadmin: 'Security Admin',
      businessadmin: 'Business Admin',
    };
    if (role) {
      let display_name = '';
      Object.entries(userRoles).forEach(([key, value]) => {
        if (key.toLowerCase() === role.toLowerCase()) {
          display_name = value;
        }
      });
      return display_name;
    } else {
      return null;
    }
  }

  sortProjectsByStatus(statusA, statusB) {
    if (statusA === statusB) {
      return 0;
    } else if (statusA === 'Invited') {
      return -1;
    } else if (statusB === 'Invited') {
      return 1;
    } else {
      return statusA.localeCompare(statusB);
    }
  }

  serializeObject(obj) {
    if (!obj) {
      return obj;
    }
  }
  isAuthorized(grant_map, accessible_to, hidden_from) {
    let result = true;
    if (accessible_to) {
      result = result && accessible_to.some((role) => grant_map[role]);
    }
    if (hidden_from) {
      result = result && !hidden_from.some((role) => grant_map[role]);
    }
    return result;
  }

  getFirmProfile() {
    return this.http.get(`firms/${this.currentUser.firmInfo.id}/profile`);
  }

  saveFirmProfile(params) {
    return this.http.put(
      `firms/${this.currentUser.firmInfo.id}/profile`,
      params
    );
  }

  unlockUser(userName) {
    return this.http.put(`users/unlock`, { userName });
  }

  validateEmail(email) {
    return String(email).toLowerCase().match(Regex.validEmail);
  }

  groupSections(sections, skip_questions?) {
    // TODO: Replace sortBy
    /* sections = _(sections).sortBy(
      (section: { isParent: any }) => !section.isParent
    ); */
    let grouped_sections = [];
    const section_map = {};
    sections.forEach(function (section) {
      if (section.isParent) {
        section.subSections = [];
        if (skip_questions || section.questions.length) {
          section.subSections.push(section);
        }
        section_map[section.id] = section;
        grouped_sections.push(section);
      } else {
        if (skip_questions || section.questions.length) {
          section_map[section.parentID].subSections.push(section);
        }
      }
    });
    if (!skip_questions) {
      grouped_sections = grouped_sections.filter(
        (section) => section.subSections.length
      );
    }
    return grouped_sections;
  }

  getColorCodeFromDomain(score: any, domain: (arg0: any) => any) {
    if (!score) {
      return {};
    }
    let background_color = domain(score);
    if (!background_color) {
      background_color = '#f5f5f5';
    }
    const fore_color =
      this.pickTextColorBasedOnBgColorAdvanced(background_color);
    return {
      color: fore_color,
      'background-color': background_color,
    };
  }

  getColorForEntityRating(
    score_value: number,
    color_code: string,
    next_color_code: string
  ): string {
    // Ensure the score is within the range
    const lowerLimit = Math.floor(score_value);
    const upperLimit = Math.ceil(score_value);

    // Calculate the fractional distance between the limits
    const ratio = (score_value - lowerLimit) / (upperLimit - lowerLimit);

    // Convert hex colors to RGB
    const lowerColorRGB = this.hexToRgb(color_code);
    const upperColorRGB = this.hexToRgb(next_color_code);

    if (!lowerColorRGB || !upperColorRGB) {
      throw new Error('Invalid color codes provided');
    }

    // Interpolate between the two colors
    const interpolatedRGB = `rgb(${Math.round(
      lowerColorRGB.r + (upperColorRGB.r - lowerColorRGB.r) * ratio
    )}, ${Math.round(
      lowerColorRGB.g + (upperColorRGB.g - lowerColorRGB.g) * ratio
    )}, ${Math.round(
      lowerColorRGB.b + (upperColorRGB.b - lowerColorRGB.b) * ratio
    )})`;

    // Convert the interpolated RGB back to a hex color using rgbToHex
    return this.rgbToHex(interpolatedRGB); // Adjusted to pass a string for d3.rgb compatibility
  }

  isAssignedToUser(verifier, functions) {
    const current_user = this.getCurrentUser();
    let foundInReview = null;
    let foundCompleted = null;
    if (verifier) {
      verifier.forEach((verifier) => {
        if (verifier.assigned_to_function_id && functions?.length) {
          if (
            Array.from(functions)?.includes(verifier.assigned_to_function_id)
          ) {
            if (verifier.status === diligenceStatusConstant.InReview)
              foundInReview = verifier;
            else foundCompleted = verifier;
          }
        } else if (verifier.assigned_to_user_id) {
          if (verifier.assigned_to_user_id === current_user.id)
            if (verifier.status === diligenceStatusConstant.InReview)
              foundInReview = verifier;
            else foundCompleted = verifier;
        }
      });
    }
    if (foundInReview) return foundInReview;
    else if (foundCompleted) return foundCompleted;
    else return null;
  }

  getAssignedToName(verifier) {
    if (verifier) {
      if (verifier.assigned_to_function_id) {
        return (
          verifier.assigned_to_function_name +
          (verifier.completed_by_name ? ' - ' + verifier.completed_by_name : '')
        );
      } else if (verifier.assigned_to_user_name) {
        return verifier.assigned_to_user_name;
      }
    }
  }

  isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  isValidNumberWithoutDecimal(n) {
    const regex = /^(-?\d{1,16})$/;
    return !!regex.exec(n);
  }

  isValidNumberDecimal(n) {
    const regex = /^(-?\d{1,14}|-?\d{1,14}\.\d{0,2})$/;
    return !!regex.exec(n);
  }

  getWordCount(text) {
    const regex = /\b\w+\b/g;
    const matches = text?.match(regex);
    const wordCount = matches ? matches.length : 0;
    return wordCount;
  }

  sortByAplha(array, key) {
    array.sort(function (a, b) {
      if (a[key] < b[key]) {
        return -1;
      }
      if (a[key] > b[key]) {
        return 1;
      }
      return 0;
    });
    return array;
  }

  sortByDate(array, key, asc = false) {
    array.sort(function (a, b) {
      a[key] = new Date(a[key]);
      b[key] = new Date(b[key]);
      if (a[key] < b[key]) {
        return 1;
      }
      if (a[key] > b[key]) {
        return -1;
      }
      return 0;
    });
    if (asc) return array.reverse();
    else return array;
  }

  sortByAplhaIgnoreCase(array, key) {
    array.sort(function (a, b) {
      if (a[key]?.toLowerCase() < b[key]?.toLowerCase()) {
        return -1;
      }
      if (a[key] > b[key]) {
        return 1;
      }
      return 0;
    });
    return array;
  }

  sortByDescTime(array, key) {
    array.sort(function (a, b) {
      if (a[key] > b[key]) {
        return -1;
      }
      if (a[key] < b[key]) {
        return 1;
      }
      return 0;
    });
    return array;
  }

  // Created new function wih appropriate sorting name
  sortByKey(array, key) {
    array.sort((a, b) => a[key] - b[key]);
    return array;
  }

  getMentionsIds(data) {
    let ids = [];
    const div = document.createElement('div');
    div.innerHTML = data;
    div.setAttribute('id', 'mentions-temp');
    document.body.appendChild(div);
    let divArray: any = document.querySelectorAll(
      '#mentions-temp [data-mention-id]'
    );
    Array.from(divArray).forEach(function (el: any) {
      ids.push(+el.getAttribute('data-mention-id'));
    });
    div.remove();
    return [...new Set(ids)];
  }

  groupBy = function (arr, criteria) {
    return arr.reduce(function (obj, item) {
      var key = item[criteria];
      if (!obj.hasOwnProperty(key)) {
        obj[key] = [];
      }
      obj[key].push(item);
      return obj;
    }, {});
  };

  groupByUnsorted = function (arr, criteria) {
    return arr.reduce(function (map, item) {
      var key = item[criteria];

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key).push(item);

      return map;
    }, new Map());
  };

  getMinInArray(arr, attr) {
    let list: any[] = [];
    for (var item of arr) {
      list.push(item[attr]);
    }
    return Math.min.apply(null, list);
  }

  getMaxInArray(arr, attr) {
    let list: any[] = [];
    for (var item of arr) {
      list.push(item[attr]);
    }
    return Math.max.apply(null, list);
  }

  pluck = function (array, key) {
    return array.map(function (obj) {
      return obj[key];
    });
  };

  // getFirmColorScheme() {
  //   if (!this.getFirmPreferences().color_codes) {
  //     return selectedColors;
  //   } else {
  //     return this.getFirmPreferences().color_codes;
  //   }
  // }

  getFirmColorScheme(pref?) {
    if (!pref.color_codes) {
      return selectedColors;
    } else {
      return pref.color_codes;
    }
  }

  validateAllFormFields(formGroup: FormGroup, touched: boolean = true) {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        if (touched) control.markAsTouched({ onlySelf: true });
        else control.markAsUntouched({ onlySelf: true });
      }
    });
  }

  keyValuePipeDefaultOrder(
    a: KeyValue<number, string>,
    b: KeyValue<number, string>
  ): number {
    return 0;
  }
  replaceGlobally(original: string, searchTxt: string, replaceTxt: string) {
    const regex = new RegExp(searchTxt, 'g');
    return original.replace(regex, replaceTxt);
  }

  extractTextBetweenParagraph(text) {
    if (text.indexOf('<p>') > -1 && text.indexOf('</p>') > -1) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      let matches = [];
      // Get all <p> elements
      const paragraphs = doc.querySelectorAll('p');
      // Extract and log the inner HTML
      paragraphs.forEach((p) => {
        matches.push(p.innerHTML.trim());
      });
      return matches.join('<br>');
    } else return text;
  }

  extractTextFromHTML(htmlString: string) {
    const str = htmlString.replace(/<(?:.|\n)*?>/gm, '');
    return str ? this.replaceGlobally(str, '&nbsp;', ' ') : str;
  }

  getFutureDatesFromNow(futureDate) {
    if (futureDate) {
      const currentDate = moment();
      const timeDifference = moment(futureDate).diff(currentDate);

      // Calculate time differences in milliseconds, seconds, minutes, hours, days, months, and years
      let seconds = Math.floor((timeDifference / 1000) % 60);
      let minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
      let hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
      let days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
      let months = Math.floor(days / 30); // Assuming 30 days in a month
      let years = Math.floor(months / 12);

      // Generate the future text based on the time differences
      if (years > 0) {
        return `In ${years} year${years > 1 ? 's' : ''}`;
      } else if (months > 0) {
        return `In ${months} month${months > 1 ? 's' : ''}`;
      } else if (days > 0) {
        if (hours > 12) days += 1;
        return `In ${days} day${days > 1 ? 's' : ''}`;
      } else if (hours > 0) {
        return `In ${hours} hour${hours > 1 ? 's' : ''}`;
      } else if (minutes > 0) {
        return `In ${minutes} minute${minutes > 1 ? 's' : ''}`;
      } else if (seconds > 0) {
        return `In ${seconds} second${seconds > 1 ? 's' : ''}`;
      } else {
        return `In less than a second`;
      }
    } else {
      return '';
    }
  }

  getFutureDatesFromNowInHours(futureDate) {
    if (futureDate) {
      const currentDate = moment();
      const timeDifference = moment(futureDate).diff(currentDate);

      // Calculate time differences in milliseconds, seconds, minutes, hours, days, months, and years
      let seconds = Math.floor(timeDifference / 1000);
      let minutes = Math.floor(timeDifference / (1000 * 60));
      let hours = Math.floor(timeDifference / (1000 * 60 * 60));

      // Generate the future text based on the time differences
      if (hours > 0) {
        return `In ${hours} hour${hours > 1 ? 's' : ''}`;
      } else if (minutes > 0) {
        return `In ${minutes} minute${minutes > 1 ? 's' : ''}`;
      } else if (seconds > 0) {
        return `In ${seconds} second${seconds > 1 ? 's' : ''}`;
      } else {
        return `In less than a second`;
      }
    } else {
      return '';
    }
  }

  getRandomColor() {
    const lum = -0.25;
    let hex = String(
      '#' + Math.random().toString(16).slice(2, 8).toUpperCase()
    ).replace(/[^0-9a-f]/gi, '');
    if (hex.length < 6) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    let rgb = '#';
    let c = undefined;
    let i = undefined;
    i = 0;
    while (i < 3) {
      c = parseInt(hex.substr(i * 2, 2), 16);
      c = Math.round(Math.min(Math.max(0, c + c * lum), 255)).toString(16);
      rgb += ('00' + c).substr(c.length);
      i++;
    }
    return rgb;
  }

  getHeapScript() {
    return '<script id="heapScript">window.heap=window.heap||[],heap.load=function(e,t){window.heap.appid=e,window.heap.config=t=t||{};var r=t.forceSSL||"https:"===document.location.protocol,a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=(r?"https:":"http:")+"//cdn.heapanalytics.com/js/heap-"+e+".js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(a,n);for(var o=function(e){return function(){heap.push([e].concat(Array.prototype.slice.call(arguments,0)))}},p=["addEventProperties","addUserProperties","clearEventProperties","identify","resetIdentity","removeEventProperty","setEventProperties","track","unsetEventProperty"],c=0;c<p.length;c++)heap[p[c]]=o(p[c])},heap.load("3544100948");</script>';
  }
  tinymceGetWordCount(htmlString: string) {
    if (!htmlString) return 0;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    let words = [];

    const traverse = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) {
          let textWords = text.split(/\s+/);
          if (textWords?.length) {
            words = words.concat(textWords);
          }
        }
      } else if (
        node.nodeType === Node.ELEMENT_NODE &&
        !node.classList.contains('footnote') // this check is for ignoring footnotes added
      ) {
        const children = node.childNodes;
        for (const childNode of children) {
          traverse(childNode);
        }
      }
    };

    traverse(doc.documentElement);

    return words.length;
  }

  /**
   * Checks whether the provided `HTML` content contains `img` tag or not.
   * @param htmlContent The `HTML` content.
   * @returns `true` if the `HTML` contains `img`, otherwise `false`.
   */
  hasImageInHTML(htmlContent: string): boolean {
    const div = document.createElement('div');
    div.innerHTML = htmlContent;

    return !!div.querySelector('img');
  }

  convertNumber(number) {
    if (number < 0 || number > 999999999) {
      return 'NUMBER OUT OF RANGE!';
    }
    var Gn = Math.floor(number / 10000000); /* Crore */
    number -= Gn * 10000000;
    var kn = Math.floor(number / 100000); /* lakhs */
    number -= kn * 100000;
    var Hn = Math.floor(number / 1000); /* thousand */
    number -= Hn * 1000;
    var Dn = Math.floor(number / 100); /* Tens (deca) */
    number = number % 100; /* Ones */
    var tn = Math.floor(number / 10);
    var one = Math.floor(number % 10);
    var res = '';

    if (Gn > 0) {
      res += this.convertNumber(Gn) + ' Crore';
    }
    if (kn > 0) {
      res += (res == '' ? '' : ' ') + this.convertNumber(kn) + ' Lakh';
    }
    if (Hn > 0) {
      res += (res == '' ? '' : ' ') + this.convertNumber(Hn) + ' Thousand';
    }

    if (Dn) {
      res += (res == '' ? '' : ' ') + this.convertNumber(Dn) + ' Hundred';
    }

    var ones = Array(
      '',
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen'
    );
    var tens = Array(
      '',
      '',
      'Twenty',
      'Thirty',
      'Fourty',
      'Fifty',
      'Sixty',
      'Seventy',
      'Eighty',
      'Ninety'
    );

    if (tn > 0 || one > 0) {
      if (!(res == '')) {
        res += ' And ';
      }
      if (tn < 2) {
        res += ones[tn * 10 + one];
      } else {
        res += tens[tn];
        if (one > 0) {
          res += '-' + ones[one];
        }
      }
    }

    if (res == '') {
      res = 'zero';
    }
    return res;
  }

  isDiligencevaultUser(current_user) {
    let userName = current_user.userName;
    return userName.toLowerCase().indexOf('diligencevault.com') > -1;
  }

  flattenArray(arr) {
    let result = [];
    arr.forEach((item) => {
      if (Array.isArray(item)) {
        result = result.concat(this.flattenArray(item));
      } else {
        result.push(item);
      }
    });
    return result;
  }

  getBgWithOpacity(color: string, opacity: number = 0.15): string {
    // Ensure opacity is within bounds
    const newOpacity = Math.min(Math.max(opacity, 0), 1);

    // Convert hexadecimal color code to RGBA format
    const rgbaColor = this.hexToRgb(color);

    if (rgbaColor) {
      // Extract RGB values
      const { r, g, b } = rgbaColor;

      // Return the color with adjusted opacity
      return `rgba(${r}, ${g}, ${b}, ${newOpacity})`;
    } else {
      console.error('Invalid color format');
      return null;
    }
  }

  // Function to convert hexadecimal color code to RGBA format
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (match) {
      return {
        r: parseInt(match[1], 16),
        g: parseInt(match[2], 16),
        b: parseInt(match[3], 16),
      };
    }
    return null;
  }

  convertDateIntoExpiryDate(futureDate) {
    if (!futureDate) return ``;
    futureDate = moment(futureDate);
    const duration = moment.duration(futureDate.diff(moment()));

    const days = duration.days();
    const hours = duration.hours();
    const minutes = duration.minutes();
    let label = `In`;
    if (days) {
      // come here if days count will >= 1
      label += ` ${days} days`;
    }
    if (hours) {
      label += ` ${hours} hours`;
    }
    if (minutes) {
      label += `, ${minutes} minutes`;
    }
    return label;
  }

  checkIfValidAndSameOrNotSame(value1, value2, isSameCheck = true) {
    if (
      value1 == null ||
      value1 == undefined ||
      value1 == null ||
      value2 == undefined
    )
      return false;

    if (value1 === value2) return isSameCheck;
    else return !isSameCheck;
  }

  shallowEqual(obj1, obj2) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (let key of keys1) {
      if (obj1[key] !== obj2[key]) return false;
    }

    return true;
  }

  compareArrayObjects(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;

    const unmatched = [...arr2];
    for (let obj1 of arr1) {
      const index = unmatched.findIndex((obj2) =>
        this.shallowEqual(obj1, obj2)
      );
      if (index === -1) return false;
      unmatched.splice(index, 1);
    }
    return unmatched.length === 0;
  }

  getSafeHtml(value: string) {
    return this.dvSafeHtml.transform(value)[
      'changingThisBreaksApplicationSecurity'
    ];
  }
  // This function strips track changes and comments added by ckeditor and gives out clean response
  stripCommentsAndTrackChanges(content) {
    if (!content) return;
    // Remove any comment spans, assuming comments are wrapped in tags with specific attributes
    return content
      .replace(/<comment-start name="[^"]*"><\/comment-start>/g, '') // Matches <comment-start ...>
      .replace(/<\/comment-start>/g, '') // Matches </comment-start>
      .replace(/<comment-end name="[^"]*"><\/comment-end>/g, '') // Matches <comment-end ...>
      .replace(/<\/comment-end>/g, '') // Matches </comment-end>
      .replace(/data-comment-start-before="[^"]*/g, '')
      .replace(/data-comment-end-after="[^"]*/g, '')
      .replace(/data-comment-start-after/g, '')
      .replace(/data-comment-end-before/g, '')
      .replace(/<suggestion-start name="[^"]*"><\/suggestion-start>/g, '')
      .replace(/<\/suggestion-start>/g, '')
      .replace(/<suggestion-end name="[^"]*"><\/suggestion-end>/g, '')
      .replace(/<\/suggestion-end>/g, '')
      .replace(/data-suggestion-end-after="[^"]*/g, '')
      .replace(/data-suggestion-start-before="[^"]*/g, '')
      .replace(/data-suggestion-start-after/g, '')
      .replace(/data-suggestion-end-before/g, '')
      .trim();
  }

  /**
   * Checks whether the passed `data` has any comments or track changes
   * @param data The data string.
   * @returns `true` if it has any comments or track changes. Otherwise, `false`.
   */
  hasCommentsOrTrackChanges(data: string): boolean {
    if (!data) {
      return false;
    }

    return this.hasComments(data) || this.hasTrackChanges(data);
  }

  /**
   * Checks whether the passed `data` has any comments or not
   * @param data The data string.
   * @returns `true` if it has comments. Otherwise, `false`.
   */
  hasComments(data: string): boolean {
    if (!data) {
      return false;
    }

    const commentRegex =
      /<comment-start|<comment-end|data-comment-start-before|data-comment-end-after|data-comment-start-after|data-comment-end-before/g;
    return commentRegex.test(data);
  }

  /**
   * Checks whether the passed `data` has any track changes or not
   * @param data The data string.
   * @returns `true` if it has track change. Otherwise, `false`.
   */
  hasTrackChanges(data: string): boolean {
    if (!data) {
      return false;
    }

    const trackChangeRegex =
      /<suggestion-start|data-suggestion-start-before|suggestion-td/g;
    return trackChangeRegex.test(data);
  }

  checkForTrackChanges(data: string) {
    if (!data) return false;

    return (
      data.includes('<suggestion-start') ||
      data.includes('data-suggestion-start-before') ||
      data.includes('suggestion-td')
    );
  }
  extractDownloadUrl(element: any) {
    const attachmentURL =
      element.target.attributes['(click)'] ||
      element.target.attributes['data-ng-click'];
    let targetUrl = attachmentURL
      ? attachmentURL.value.split("'")[1].split('api/')[1]
      : '';
    return targetUrl;
  }

  downloadAttachment(targetUrl: string) {
    this.http.get(targetUrl, { responseType: 'blob' }).subscribe((res: any) => {
      const filename = targetUrl.split('file_name=')[1];
      saveAs(res, filename);
    });
  }

  addDownloadLink(anchorString: string): string {
    const clickRegex = /\(click\)="([^"]*)"/;
    const dataNgClickRegex = /data-ng-click="[^"]*"/; // data-ng-click if present already
    const clickMatch = anchorString.match(clickRegex);
    if (clickMatch && !dataNgClickRegex.test(anchorString)) {
      // click event present already and data-ng-click not present
      const clickFunctionValue = clickMatch[1];
      return anchorString.replace(
        clickRegex,
        `data-ng-click="${clickFunctionValue}" $&`
      );
    }
    return anchorString;
  }

  getUrlWithParam(url){
    const urlParts = url.split('#');
    const path = urlParts[0];
    const fragment = urlParts[1] || null;
    const queryParams = new URLSearchParams(path.split('?')[1]);
    let queryParamsObj = Object.fromEntries(queryParams.entries());
    const pathWithoutQuery = path.split('?')[0];
    return {
      pathWithoutQuery,
      queryParamsObj,
      fragment,
    }
  }
}
