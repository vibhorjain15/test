class DueDiligenceActionController extends BaseController

  @register 'DueDiligenceActionController'

  @inject '$http', 'baseUrl', '$filter', '$scope', 'toaster', 'Utils', '$state', 'DueDiligenceDataservice','keywordConstants', 'ModalFactory'

  initialize: ->
    @action_loaders = {}
    @accept_params = {}
    @currentFirm = @Utils.getCurrentFirm()
    @status_map =
      remind: 'Reminded'
      withdraw: 'Withdrawn'

  generatePageUrl: (entity)=>
    pageUrl = ""
    if entity.entity_type.toLowerCase() == @keywordConstants.Product.toLowerCase()
      pageUrl += "app/diligence/#{entity.fromfirm_id}/firms/#{entity.tofirm_id}/funds/#{entity.entity_id}/projects/#{entity.id}"
    else if entity.entity_type.toLowerCase() == @keywordConstants.Firm.toLowerCase()
      pageUrl += "app/diligence/#{entity.fromfirm_id}/firms/#{entity.entity_id}/projects/#{entity.id}"
    pageUrl

  addSubscribersSentAction: (diligence)->
    @ModalFactory.invokeModal 'manage_subscribers',
      resolve:
          diligence: => diligence

  #Reminded, Withdrawn
  updateStatus: (entity, action) ->
    status = @status_map[action]
    params =
      status: status

    @action_loaders[action] = true
    pageUrl = @generatePageUrl(entity)
    params2 = {
      headers: {'page-url': pageUrl, 'diligence-status': status.toLowerCase()}
    }
    @$http.put(@baseUrl + '/diligences/' + entity.id, params, params2).then((response) =>
      if action is 'withdraw'
        message = 'Project withdrawn'
      else
        message = 'Sent reminder for this project'
        _(entity).extend response.data

      if action is 'withdraw'
        @$scope.$emit 'due_diligence:remove', entity

      @$scope.$emit 'due_diligence_counts:refresh'
      @toaster.pop 'success', '', message
    ).finally =>
      @action_loaders[action] = false

  #Accepted, Declined
  acceptInvitation: (entity, acknowledge) ->
    if @accept_form and !@accept_form.$valid
      return

    params = angular.extend({}, @accept_params,
      status: 'Started'
    )

    if @accept_params.due_at
      params.due_at = @$filter('date')(@accept_params.due_at, 'MM-dd-yyyy')

    @action_loaders.accept = true

    pageUrl = @generatePageUrl(entity)
    @DueDiligenceDataservice.updateDiligenceStatus(params.status, entity.id, pageUrl).then (response) =>
      if acknowledge
        message = "#{entity.entity_name} has been successfully acknowledged"
      else
        message = "#{entity.entity_name} has been successfully accepted"

      @accept_form_open = false
      @$scope.$emit 'due_diligence:remove', entity
      @$scope.$emit 'due_diligence_counts:refresh'
      @toaster.pop 'success', '', message
      @action_loaders.accept = false

      childState = ".project.summary"
      if @Utils.isInvestor()
        childState = ".project.summary"
        # @$state.go 'app.diligence.projects.activity', type: 'in-progress'
      else if @Utils.isManager()
        childState = ".project.questionnaire"

      #generate new route
      parentState = "app.diligence"                   #parent state of the route
      newParams = {
        diligenceId: response.data.id
      }
      if response.data.entity_type.toLowerCase() == @keywordConstants.Product.toLowerCase()             #if diligence type is fund then go to firms.funds route
        newState = ".firms.funds"
        newParams.fromfirmId = response.data.fromfirm_id
        newParams.tofirmId = response.data.tofirm_id
        newParams.fundId = response.data.entity_id
      else if response.data.entity_type.toLowerCase() == @keywordConstants.Firm.toLowerCase()        #else if it is a firm diligence then go to firms route
        newState = ".firms"
        newParams.fromfirmId = response.data.fromfirm_id
        newParams.tofirmId = response.data.entity_id
      else if entity.entity_type.toLowerCase() == @keywordConstants.Strategy.toLowerCase()        #else if it is a firm diligence then go to firms route
        newState = ".firms.strategies"
        newParams.fromfirmId = entity.fromfirm_id
        newParams.tofirmId = entity.tofirm_id
        newParams.strategyId = entity.entity_id
      else
        newState = ""                                 #else go to the oldstate
      @$state.go(parentState+newState+childState, newParams)

    .finally =>
      @action_loaders.accept = false

  declineWithReason: (entity, decline_option_id) ->
    params =
      status: 'Declined'
      decline_option: decline_option_id

    @action_loaders.decline = true
    pageUrl = @generatePageUrl(entity)

    @$http.put(@baseUrl + '/diligences/' + entity.id, params, {headers: {'page-url': pageUrl, 'diligence-status': status.toLowerCase()}}).then(=>
      message = "#{entity.entity_name} has been successfully declined"
      @$scope.$emit 'due_diligence:remove', entity
      @$scope.$emit 'due_diligence_counts:refresh'
      @toaster.pop 'success', '', message
    ).finally =>
      @action_loaders.decline = false

  canRemind: (lastReminderDate) ->
    unless lastReminderDate
      true
    else
      moment().diff(moment(lastReminderDate), 'days') > 5
