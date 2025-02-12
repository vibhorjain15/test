import { USER_ROLES } from 'src/app2/shared/constants/constant';

export const getMetaUserData = (res) => {
  return {
    getSkipIntro: res.skip_tour,
    endUserAgreementAccepted: res.eucAccepted,
    discussAgreementAccepted: res.discussEUCAccepted,
    isInvestor: res.type === 'investor',
    isManager: res.type === 'manager',
    isFreeInvestor:
      res.type === 'investor' && res.firmInfo.subscription === 'Free',
    isFreeManager:
      res.type === 'manager' && res.firmInfo.subscription === 'Free',
    isApprover: res.is_approver,
    hideGroupByIntro: res.group_by_intro,
    isFreeSubscription: res.firmInfo.subscription === 'Free',
    isSmartSubscription: res.firmInfo.subscription === 'Smart',
    isProductiveSubscription: res.firmInfo.subscription === 'Productive',
    isInstitutionalSubscription: res.firmInfo.subscription === 'Institutional',
    isFormADVSubscription: res.firmInfo.subscription === 'FormADV',
    isFormADVAnalyticsSubscription:
      res.firmInfo.subscription === 'FormADVAnalytics',
    isFullSubscription: res.firmInfo.subscription === 'Full',
    isFundSubscription: res.firmInfo.subscription === 'Fund',
    isVendorSubscription: res.firmInfo.subscription === 'Vendor',
    hasMultipleAccounts: res.firmAccessCount > 1,
    isOwner: res.firmwide_role.toLowerCase() == USER_ROLES.OWNER,
    isAdmin: res.isAdmin,
    isReadOnly: res.isReadOnly,
    isEnabledInboundModule: res.firmInfo.preferences.enable_inbound_module,
    isDisabledInboundModule: !res.firmInfo.preferences.enable_inbound_module, // if disabled then true to hide OV from free investor
    isExcelBulkImport: res.firmInfo.preferences.excel_bulk_import,
    isEnableCustomAccessLevel: res.firmInfo.preferences?.enable_custom_access_level,
    isDiligencevaultUser:
      res.userName.toLowerCase().indexOf('diligencevault.com') > -1,
    hasFirmWideRole: res.firmwide_role.toLowerCase() !== USER_ROLES.RESTRICTED,
    isFirstLogin: res.isFirstLogin,
    isSuperAdmin: res.firmwide_role.toLowerCase() == USER_ROLES.ADMIN,
    isSecurityAdmin:
      res.firmwide_role.toLowerCase() == USER_ROLES.SECURITYADMIN,
    isBusinessAdmin:
      res.firmwide_role.toLowerCase() == USER_ROLES.BUSINESSADMIN,
  };
};
