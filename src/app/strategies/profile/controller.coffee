class StrategyProfileController extends BaseController

  @register 'StrategyProfileController'

  @inject '$stateParams', 'Restangular', 'StrategyDataservice', '$state', 'Utils',
          '$scope', '$q'

  initialize: ->
    @getFirmPref()
    @strategyId = @$stateParams.strategyId
    @issue_tracker_default_name = ''
    @FreeSubscription = @Utils.isFreeSubscription()

    @$scope.getStrategy = @getStrategy
    @issue_tracker_default_name = ''
    @getFirmPref()

  getFirmPref: =>
    @loading_prefs = true
    @Restangular.all('firm_preferences').customGET().then (response) =>
      @issue_tracker_default_name = response.issue_tracker_default_name
      @loading_prefs = false

  getStrategy: () =>  
    deferred = @$q.defer()
    @StrategyDataservice.getStrategy(@strategyId).then (response) =>
      deferred.resolve(response)
    deferred.promise

  getFirmPref: =>
    @loading_prefs = true
    @Restangular.all('firm_preferences').customGET().then (response) =>
      @issue_tracker_default_name = response.issue_tracker_default_name
      @loading_prefs = false
  
  