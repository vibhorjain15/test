class FundProfileController extends BaseController

  @register 'FundProfileController'

  @inject '$stateParams', 'Restangular','FundDataservice', '$state', 'Utils',
          '$scope', '$q'

  initialize: ->
    @fundId = @$stateParams.fundId

    @FreeSubscription = @Utils.isFreeSubscription()

    @$scope.getFund = @getFund
    @issue_tracker_default_name = ''
    @getFirmPref()

  getFirmPref: =>
    @loading_prefs = true
    @Restangular.all('firm_preferences').customGET().then (response) =>
      @issue_tracker_default_name = response.issue_tracker_default_name
      @loading_prefs = false

  getFund: () =>  
    deferred = @$q.defer()
    @FundDataservice.getFund(@fundId).then (response) =>
      deferred.resolve(response)
    deferred.promise

  
  