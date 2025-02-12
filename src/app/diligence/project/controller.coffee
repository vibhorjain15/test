class DiligenceProjectController extends BaseController

  @register 'DiligenceProjectController'

  @inject 'Utils', 'DueDiligenceDataservice', '$stateParams', '$scope', '$q', '$state', 'keywordConstants','toaster','diligenceStatusConstant'

  initialize: ->
    # Get user type and access level
    @is_investor = @Utils.isInvestor()
    @is_manager = @Utils.isManager()
    @is_free_user = @Utils.isFreeSubscription()
    @is_internal = false
    @dd_status = null
    @project_type = null
    @is_admin = @Utils.isAdmin()
    @readOnlyAccess = @Utils.isReadOnly()
    @profile_dd = false

    # Since $scope is prototypically inherited to all the child states this would be available to all child state controllers
    @$scope.getDueDiligence = =>
      deferred = @$q.defer()
      @DueDiligenceDataservice.getDiligence(@$stateParams.diligenceId)
      .then (diligence) =>
        if diligence.status == 'Invited'
          @toastInstance = @toaster.pop({type: 'info', title: 'Starting project...', body: 'Please wait while the request is being processed.', timeout: 0})
          @DueDiligenceDataservice.updateDiligenceStatus('Started', diligence.id).then (response) =>
            diligence = response.data
            @loadDiligenceData(diligence)
            @toaster.clear(@toastInstance)
            deferred.resolve diligence
          ,(error)=>
            @toaster.clear(@toastInstance)
            @$state.go 'app.home'
            deferred.reject error
        else
          @loadDiligenceData(diligence)
          deferred.resolve diligence
      , (error) =>
        if error.status == 403
          @$state.go 'app.home'

      deferred.promise

  loadDiligenceData: (diligence)=>
    #These are locked status for both Investor and Manager
    locked_statuses = ['Approved', 'NotApproved', 'Deleted', 'Retired', 'Withdrawn']

    # Get diligence, type and if diligence is internal
    status = diligence.status
    @dd_status = diligence.status

    internalOnly = diligence.is_internal
    @is_internal = internalOnly
    diligenceType = diligence.diligence_type

    if diligenceType is 'dd_review'
      @project_type = 'Analyst Evaluation'
    else if diligenceType is 'dd_profile'
      @project_type = 'Internal Profile' 
    else if @is_internal 
      @project_type = 'Internal Project'   
    else
      @project_type = 'Questionnaire'  

    @isVehicleDiligence = diligence.entity_type == @keywordConstants.Vehicle

    @profile_dd = (diligenceType is 'dd_profile')
    diligence.alwaysOpen = (diligenceType is 'dd_profile')
    diligence.isLocked = (_(locked_statuses).contains(status)) and (!diligence.alwaysOpen)
    diligence.isCompleted = (status is 'Completed')

    diligence.hasReadOnlyAccess = @readOnlyAccess

    if @is_manager
      diligence.isReadOnly = ((status is 'Completed') or (status is 'PendingRestart')) or (status is @diligenceStatusConstant.POSTCOMPLETIONREVIEW)
      diligence.review_allowed = !(internalOnly is false and (status is 'Completed'))

    else if @is_investor
      diligence.notVisible = (((status is 'Started') or (status is 'ExtensionRequested') or (status is @diligenceStatusConstant.PRECOMPLETIONREVIEW)) and (internalOnly is false) and !diligence.alwaysOpen)
      diligence.isReadOnly = ((status is 'Completed') or (status is 'Followup') or (status is 'PendingRestart') or (status is @diligenceStatusConstant.POSTCOMPLETIONREVIEW)) and !diligence.alwaysOpen
      diligence.review_allowed = !(internalOnly is false and (status is 'Started' or status is 'ExtensionRequested' or status is 'Followup'))       