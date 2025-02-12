class FirmProfileController extends BaseController

  @register 'FirmProfileController'

  @inject '$stateParams', 'Restangular', '$state', 'Utils',
          '$scope', '$q'

  initialize: ->
    @firmId = @$stateParams.firmId
    @isFreeSubscriber = @Utils.isFreeSubscription()
    @is_manager = @Utils.isManager()
    @$scope.getFirm = @getFirm
    @issue_tracker_default_name = ''
    @getFirmPref()

  getFirmPref: =>
    @loading_prefs = true
    @Restangular.all('firm_preferences').customGET().then (response) =>
      @issue_tracker_default_name = response.issue_tracker_default_name
      @loading_prefs = false

  getFirm: () =>
    deferred = @$q.defer()
    @Restangular.one('firms', @firmId).one('profile').get().then (response) =>
      deferred.resolve(response)
    deferred.promise