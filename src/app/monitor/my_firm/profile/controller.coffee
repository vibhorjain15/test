class MyFirmProfileController extends BaseController

  @register 'MyFirmProfileController'

  @inject 'Restangular', '$scope', '$q', 'Utils','RestangularHeaderService'

  initialize: =>
    firmId = @Utils.getCurrentFirm().id
    deferred = @$q.defer()

    @getFirm(firmId).then (firm) ->
      deferred.resolve(firm)

    @$scope.getFirm = -> deferred.promise
    @issue_tracker_default_name = ''
    @getFirmPref()

  getFirmPref: =>
    @loading_prefs = true
    @Restangular.all('firm_preferences').customGET().then (response) =>
      @issue_tracker_default_name = response.issue_tracker_default_name
      @loading_prefs = false

  getFirm: (firmId) ->
    pageUrl = "app/firms/#{firmId}/profile/ddqs"
    @RestangularHeaderService.RestangularWithHeader(pageUrl).one('firms', firmId).one('profile').get().then (response) =>
      @firm = response

      response