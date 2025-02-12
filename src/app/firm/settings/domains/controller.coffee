class FirmSettingsDomainsController extends BaseController
  @register 'FirmSettingsDomainsController'

  @inject '$scope', 'toaster', 'Restangular', 'Utils', '$tinymceToolbar1', '$tinymceToolbar2', '$tinymcePlugins', 'ModalFactory', 'SweetAlert','angularEnabled'

  initialize: ->
    firmId = @Utils.getCurrentFirm().id
    @ssoObject = {}
    @domains = []
    @getDomains()

  confirmDomainDeletion: (domain,index) =>
    @SweetAlert.confirm({
      title: "Are you sure you want to remove this domain?"
      focusCancel: true
      showLoaderOnConfirm: true
      preConfirm: =>
        @removeDomain(domain,index)
    })

  toggleSSO: (domainObj, index) =>
    params = angular.copy domainObj
    @Restangular.all('firm_settings').one('firm_domains', params.id).customPUT(params).then (response) =>
      @domains[index] = response
      @toaster.pop 'success', '', 'Domain updated successfully', 3000

  toggleWhiteListing: (domainObj, index) =>
    params = angular.copy domainObj
    @Restangular.all('firm_settings').one('firm_domains', params.id).customPUT(params).then (response) =>
      @domains[index] = response
      @toaster.pop 'success', '', 'Domain updated successfully', 3000

  removeDomain: (domain, index) =>
    @Restangular.one('firm_settings/firm_domains', domain.id).remove().then (response) =>
      @domains.splice index,1
      @toaster.pop 'success', '', 'Domain removed successfully', 3000

  getDomains: =>
    @Restangular.all('firm_settings/firm_domains').getList().then (response) =>
      @domains = response

  addNewDomain: =>
    @ModalFactory.invokeModal 'add_domain',
      resolve:
        existing_domains: => @domains
      success: (response) =>
        @domains.push response
