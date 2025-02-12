class FirmProfileSummaryController extends BaseController

  @register 'FirmProfileSummaryController'

  @inject 'Restangular', 'baseData', 'currentUser', 'ModalFactory', 'Utils', 'SweetAlert', '$q', 'toaster', '$timeout', '$stateParams', '$scope', 'FirmDataservice','angularEnabled'

  initialize: ->
    @firmId = @$stateParams.firmId
    @entity_type = "Firm"

    @tag_map = {}
    @is_investor = @Utils.isInvestor()
    @current_user = @Utils.getCurrentUser()
    @entity_type = @Utils.getEntityType()
    @entity_sub_type = @Utils.getEntitySubType()

    @Restangular.one('firms', @firmId).one('profile').get().then (response) =>
      @firm = response

    @Restangular.all('currency').getList().then (response) =>
      @currency = response

    @fetchEmployees()

    @Restangular.all('funds').getList(profile: 'true').then (response) =>
      @fund_list = response


  fetchEmployees: ->
    promises = []

    promises.push @FirmDataservice.getRelatedContacts(@firmId)


    @$q.all(promises).then (responses) =>
      @active_users = responses[0]

      for user in @active_users
        if user.id is @current_user.id
          user.is_loggedin_user = true
          break

      @team_members = _.flatten(responses)
