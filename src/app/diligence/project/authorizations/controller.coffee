class ProjectAuthorizationsController extends BaseController

  @register 'ProjectAuthorizationsController'

  @inject 'Utils', 'currentUser', '$http', 'baseUrl', 'toaster', 'BaseDataService'

  initialize: ->
    @user = @currentUser
    @is_investor = @Utils.isInvestor()
    @payload = {}

    @BaseDataService.getTeamMembers().then (response) =>
      @team = response

    @$http.get(@baseUrl + '/Fund').then (response) =>
      @fund = response.data

    @$http.get(@baseUrl + '/diligences/1/authorize').then (response) =>
      @authorize = response.data

  processCheck: (type, id) ->
    @payload.TargetType = type
    @payload.TargetID = id

    @$http(
      url: @baseUrl + '/diligences/1/authorize'
      method: 'POST'
      data: JSON.stringify(@payload)
      headers: 'Content-Type': 'application/json'
    ).then (response) =>
      message = 'Background Check has been authorized.'
      @toaster.pop 'success', '', message, 5000
