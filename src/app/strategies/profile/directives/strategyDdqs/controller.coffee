class StrategyDDQsController extends BaseController
  @register 'StrategyDDQsController'

  @inject 'SweetAlert', 'toaster', '$scope', '$attrs',
          'DueDiligenceDataservice', 'Utils', '$state', 'keywordConstants'

  initialize: ->
    @entity_type = 'Strategy'
    empty_state_message = 'No DDQ available for this '+ @entity_type

    @is_admin = @Utils.isAdmin()
    @is_manager = @Utils.isManager()
    @isFreeSubscription = @Utils.isFreeSubscription()
    
    @modalTitle = @$scope.$parent.$eval(@$attrs.modalTitle)
    @ddqType = @$scope.$parent.$eval(@$attrs.ddqType)

    if angular.isDefined(@$attrs.readonly)
      @readonly = true
    else
      @readonly = false

    @loadDdqs()
    @empty_state_message = @$scope.$parent.$eval(@$attrs.emptyStateMessage) || empty_state_message

  loadDdqs: ->
    deregisterer = @$scope.$parent.$watch @$attrs.ddqs, (value) =>
      if value?
        @ddqs = value
        deregisterer()

  createNewVersion: (ddq) ->
    @SweetAlert.confirm({
      title: 'Are you sure you want to create a new version ?'
      confirmButtonText: 'Yes, please!'
      showLoaderOnConfirm: true
      preConfirm: =>
        @DueDiligenceDataservice.createNewVersion(ddq.id)
        .then (response) =>
          diligence_id = response.id
          @toaster.pop 'success', '', "You will be redirected to the latest version"
          @$state.go 'app.diligence.project.questionnaire', {
            diligenceId: diligence_id
          }
          swal.close()
        , (error) =>
          swal.close()
          @toaster.pop 'error', '', 'Something went wrong. Please try again.'
    })
        
  shareDDQ: (ddq) ->
    @$state.go 'app.diligence.project.share', {
      diligenceId: ddq.id
    }

  retireDDQ: (ddq) ->
    @SweetAlert.confirm({
      title: 'Are you sure you want to retire this DDQ ?'
      text: 'You will not be able to recover this'
      confirmButtonText: 'Yes, retire it!'
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @DueDiligenceDataservice.setStatus(ddq.id, 'Retired').then (response) =>
          @toaster.pop 'success', '', "DDQ retired successfully"

          #removes the ddq from the local list, which in turn removes from UI
          @ddqs.splice(@ddqs.indexOf(ddq), 1)
        .finally => swal.close()
    })
        
  redirectToQuestionnaire: (ddq)=>
    #generate new route
    parentState = "app.diligence"                   #parent state of the route
    newParams = {
      diligenceId: ddq.id
    }
    if ddq.entity_type.toLowerCase() == @keywordConstants.Strategy.toLowerCase()             #if diligence type is strategy then go to firms.strategies route
      newState = ".firms.strategies"
      newParams.fromfirmId = ddq.fromfirm_id
      newParams.tofirmId = ddq.tofirm_id
      newParams.strategyId = ddq.entity_id
    else if ddq.entity_type.toLowerCase() == @keywordConstants.Firm.toLowerCase()        #else if it is a firm diligence then go to firms route
      newState = ".firms"
      newParams.fromfirmId = ddq.fromfirm_id
      newParams.tofirmId = ddq.entity_id
    else
      newState = ""                                 #else go to the oldstate
    childState = '.project.questionnaire'                  #get the tostate from the $state and append to the new route
    @$state.go(parentState+newState+childState, newParams)