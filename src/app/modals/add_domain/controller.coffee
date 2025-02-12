class AddDomainController extends ModalController
  @register 'AddDomainController'

  @inject '$uibModalInstance', 'toaster', 'Restangular', '$state', '$timeout', 'existing_domains'

  initialize: ->
    @disclaimer_id = null
    @disclaimers = []
    @domainObj = {}
    @existingDomainNames = []
    @domains = []
    @getExistingDomains()


  getExistingDomains: =>
    @Restangular.all('firm_settings/firm_domains/GetUserDomains').getList().then (response) =>
      @domains = response
      if @existing_domains and @existing_domains.length
        @filterExisting()

  filterExisting: =>
    @domains = @domains.filter (domain) =>
      _(@existing_domains).findIndex((domainObj)=>
        domainObj.domain_name == domain
      ) == -1

  save: ->
    if @domain_form.$valid
      @saving = true
      params = angular.copy @domainObj
      @Restangular.all('firm_settings/firm_domains').post(params).then((response) =>
        @toaster.pop 'success', 'Domain successfully added!'
        @$uibModalInstance.close response
        @saving = false
      ).finally =>
          @saving = false
